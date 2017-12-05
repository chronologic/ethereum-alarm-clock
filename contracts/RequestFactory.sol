pragma solidity ^0.4.17;

import "contracts/Interface/RequestFactoryInterface.sol";
import "contracts/Interface/RequestTrackerInterface.sol";
import "contracts/TransactionRequest.sol";
import "contracts/Library/RequestLib.sol";
import "contracts/IterTools.sol";

/**
 * @title RequestFactory
 * @dev Contract which will produce new TransactionRequests.
 */
contract RequestFactory is RequestFactoryInterface {
    using IterTools for bool[6];

    // RequestTracker of this contract.
    RequestTrackerInterface public requestTracker;

    function RequestFactory(address _trackerAddress) {
        require( _trackerAddress != 0x0 );

        requestTracker = RequestTrackerInterface(_trackerAddress);
    }

    /**
     * @dev The lowest level interface for creating a transaction request.
     * 
     * @param _addressArgs [0] -  meta.owner
     * @param _addressArgs [1] -  paymentData.donationBenefactor
     * @param _addressArgs [2] -  txnData.toAddress
     * @param _uintArgs [0]    -  paymentData.donation
     * @param _uintArgs [1]    -  paymentData.payment
     * @param _uintArgs [2]    -  schedule.claimWindowSize
     * @param _uintArgs [3]    -  schedule.freezePeriod
     * @param _uintArgs [4]    -  schedule.reservedWindowSize
     * @param _uintArgs [5]    -  schedule.temporalUnit
     * @param _uintArgs [6]    -  schedule.windowSize
     * @param _uintArgs [7]    -  schedule.windowStart
     * @param _uintArgs [8]    -  txnData.callGas
     * @param _uintArgs [9]    -  txnData.callValue
     * @param _uintArgs [10]   -  txnData.gasPrice
     * @param _callData        -  The call data
     */
    function createRequest(
        address[3] _addressArgs,
        uint[11]   _uintArgs,
        bytes32    _callData
    )
        public payable returns (address)
    {
        TransactionRequest request = (new TransactionRequest).value(msg.value)(
            [
                msg.sender,       // Created by
                _addressArgs[0],  // meta.owner
                _addressArgs[1],  // paymentData.donationBenefactor
                _addressArgs[2]   // txnData.toAddress
            ],
            _uintArgs,
            _callData
        );

        // Track the address locally
        requests[address(request)] = true;

        // Log the creation.
        RequestCreated(address(request));

        // Add the request to the RequestTracker
        requestTracker.addRequest(address(request), _uintArgs[7]); // windowStart

        return address(request);
    }

    /**
     *  The same as createRequest except that it requires validation prior to
     *  creation.
     *
     *  Parameters are the same as `createRequest`
     */
    function createValidatedRequest(
        address[3] addressArgs,
        uint[11] uintArgs,
        bytes32 callData
    ) 
        public payable returns (address)
    {
        bool[6] memory isValid = validateRequestParams(
            addressArgs,
            uintArgs,
            callData,
            msg.value
        );

        if (!isValid.all()) {
            if (!isValid[0]) {
                ValidationError(uint8(Errors.InsufficientEndowment));
            }
            if (!isValid[1]) {
                ValidationError(uint8(Errors.ReservedWindowBiggerThanExecutionWindow));
            }
            if (!isValid[2]) {
                ValidationError(uint8(Errors.InvalidTemporalUnit));
            }
            if (!isValid[3]) {
                ValidationError(uint8(Errors.ExecutionWindowTooSoon));
            }
            if (!isValid[4]) {
                ValidationError(uint8(Errors.CallGasTooHigh));
            }
            if (!isValid[5]) {
                ValidationError(uint8(Errors.EmptyToAddress));
            }

            // Try to return the ether sent with the message.  If this failed
            // then revert() to force it to be returned.
            // msg.sender.transfer(msg.value);
            // revert();
        }

        return createRequest(addressArgs, uintArgs, callData);
    }

    /// ----------------------------
    /// Internal
    /// ----------------------------

    /*
     *  @dev The enum for launching `ValidationError` events and mapping them to an error.
     */
    enum Errors {
        InsufficientEndowment,
        ReservedWindowBiggerThanExecutionWindow,
        InvalidTemporalUnit,
        ExecutionWindowTooSoon,
        CallGasTooHigh,
        EmptyToAddress
    }

    event ValidationError(uint8 error);

    /*
     * @dev Validate the constructor arguments for either `createRequest` or `createValidatedRequest`.
     */
    function validateRequestParams(
        address[3] addressArgs,
        uint[11] uintArgs,
        bytes32 callData,
        uint endowment
    ) 
        internal returns (bool[6])
    {
        return RequestLib.validate(
            [
                msg.sender,      // meta.createdBy
                addressArgs[0],  // meta.owner
                addressArgs[1],  // paymentData.donationBenefactor
                addressArgs[2]   // txnData.toAddress
            ],
            uintArgs,
            callData,
            endowment
        );
    }

    // TODO: decide whether this should be a local mapping or from tracker.
    mapping (address => bool) requests;

    function isKnownRequest(address _address) 
        public view returns (bool)
    {
        return requests[_address];
    }
}


// contract TestnetRequestFactory is RequestFactory(0x8e67d439713b2022cac2ff4ebca21e173ccba4a0) {
// }
