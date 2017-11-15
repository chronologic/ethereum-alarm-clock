pragma solidity ^0.4.17;

import "contracts/Interface/RequestFactoryInterface.sol";
import "contracts/Interface/RequestTrackerInterface.sol";

import "contracts/TransactionRequest.sol";

import "contracts/Library/RequestLib.sol";

import "contracts/IterTools.sol";


contract RequestFactory is RequestFactoryInterface {
    using IterTools for bool[6];

    RequestTrackerInterface public requestTracker;

    function RequestFactory(address _trackerAddress) {
<<<<<<< HEAD
        // if (_trackerAddress == 0x0) {
        //     revert();
        // }
        // FIXME: Deployment to testrpc fails here. Use assertion and uncomment.
        // if (_trackerAddress == 0x0) throw;
=======
        // Below is commented out so that truffle migrates correctly... Probably should be
        //  uncommented again when this gets pushed to production. - Logan
        // require(_trackerAddress != 0x0);
>>>>>>> dev
        requestTracker = RequestTrackerInterface(_trackerAddress);
    }

    /*
     *  The lowest level interface for creating a transaction request.
     *
     *  addressArgs[1] -  meta.owner
     *  addressArgs[1] -  paymentData.donationBenefactor
     *  addressArgs[2] -  txnData.toAddress
     *  uintArgs[0]    -  paymentData.donation
     *  uintArgs[1]    -  paymentData.payment
     *  uintArgs[2]    -  schedule.claimWindowSize
     *  uintArgs[3]    -  schedule.freezePeriod
     *  uintArgs[4]    -  schedule.reservedWindowSize
     *  uintArgs[5]    -  schedule.temporalUnit
     *  uintArgs[6]    -  schedule.windowSize
     *  uintArgs[7]    -  schedule.windowStart
     *  uintArgs[8]    -  txnData.callGas
     *  uintArgs[9]    -  txnData.callValue
     */
    function createRequest(address[3] addressArgs,
                           uint[10] uintArgs,
                           bytes32 callData)
        public payable returns (address)
    {
        TransactionRequest request = (new TransactionRequest).value(msg.value)(
            [
                msg.sender,
                addressArgs[0],  // meta.owner
                addressArgs[1],  // paymentData.donationBenefactor
                addressArgs[2]   // txnData.toAddress
            ],
            uintArgs,
            callData
        );

        // Track the address locally
        requests[address(request)] = true;

        // Log the creation.
        RequestCreated(address(request));

        // Add the request to the RequestTracker
        ///FIXED - IMPORTANT BUG LIVES IN THIS FUNCTION BELOW
        requestTracker.addRequest(address(request), uintArgs[7]); // windowStart

        return request;
    }

    /*
     *  @dev The enum for launching `ValidationError` events and mapping them to an error.
     */
    enum Errors {
        InsufficientEndowment,
        ReservedWindowBiggerThanExecutionWindow,
        InvalidTemporalUnit,
        ExecutionWindowTooSoon,
        // InvalidRequiredStackDepth,
        CallGasTooHigh,
        EmptyToAddress
    }

    event ValidationError(uint8 error);

    /*
     * Validate the constructor arguments for either `createRequest` or
     * `createValidatedRequest`
     */
    function validateRequestParams(address[3] addressArgs,
                                   uint[10] uintArgs,
                                   bytes32 callData,
                                   uint endowment) 
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

    /*
     *  The same as createRequest except that it requires validation prior to
     *  creation.
     *
     *  Parameters are the same as `createRequest`
     */
    function createValidatedRequest(address[3] addressArgs,
                                    uint[10] uintArgs,
                                    bytes32 callData) 
        payable public returns (address)
    {
        var is_valid = validateRequestParams(addressArgs,
                                             uintArgs,
                                             callData,
                                             msg.value);

        if (!is_valid.all()) {
            if (!is_valid[0]) {
                ValidationError(uint8(Errors.InsufficientEndowment));
            }
            if (!is_valid[1]) {
                ValidationError(uint8(Errors.ReservedWindowBiggerThanExecutionWindow));
            }
            if (!is_valid[2]) {
                ValidationError(uint8(Errors.InvalidTemporalUnit));
            }
            if (!is_valid[3]) {
                ValidationError(uint8(Errors.ExecutionWindowTooSoon));
            }
            if (!is_valid[4]) {
                ValidationError(uint8(Errors.CallGasTooHigh));
            }
            if (!is_valid[5]) {
                ValidationError(uint8(Errors.EmptyToAddress));
            }

            // Try to return the ether sent with the message.  If this failed
            // then throw to force it to be returned.
            msg.sender.transfer(msg.value);
        }

        return createRequest(addressArgs, uintArgs, callData);
    }

    // TODO: decide whether this should be a local mapping or from tracker.
    mapping (address => bool) requests;

    function isKnownRequest(address _address) 
        view returns (bool)
    {
        return requests[_address];
    }
}


// contract TestnetRequestFactory is RequestFactory(0x8e67d439713b2022cac2ff4ebca21e173ccba4a0) {
// }
