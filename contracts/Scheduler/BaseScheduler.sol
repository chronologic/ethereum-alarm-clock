pragma solidity ^0.4.17;

import "contracts/Interface/SchedulerInterface.sol";
import "contracts/Library/RequestScheduleLib.sol";
import "contracts/Library/SchedulerLib.sol";

/**
 * @title BaseScheduler
 * @dev The foundational contract which provides the API for scheduling future transactions on the Alarm Client.
 */
contract BaseScheduler is SchedulerInterface {
    using SchedulerLib for SchedulerLib.FutureTransaction;

    /*
     * @dev Fallback function to be able to receive ether. This can occur
     *  legitimately when scheduling fails due to a validation error.
     */
    function() public payable {}

    //------------------------
    // New API [WIP]
    //------------------------

    /**
     * @dev Schedules a new TransactionRequest using the 'simple' parameters.
     * @param _toAddress The address destination of the transaction.
     * @param _callData The bytecode that will be included with the transaction.
     * @param _uintArgs [0] The callGas of the transaction.
     * @param _uintArgs [1] The value of ether to be send with the transaction.
     * @param _uintArgs [2] The size of the execution window of the transaction.
     * @param _uintArgs [3] The (block or timestamp) of when the execution window starts.
     * @param _uintArgs [4] The gasPrice which will be used to exeute this transaction.
     * @return The address of the new TransactionRequest.
     */
    function scheduleTxSimple(
        address _toAddress,
        bytes32 _callData,
        uint[5] _uintArgs
    )
        // doReset
        public payable returns (address newRequest)
    {
        futureTransaction.toAddress = _toAddress;
        futureTransaction.callData = _callData;
        futureTransaction.callGas = _uintArgs[0];
        futureTransaction.callValue = _uintArgs[1];
        futureTransaction.windowSize = _uintArgs[2];
        futureTransaction.windowStart = _uintArgs[3];
        futureTransaction.gasPrice = _uintArgs[4];

        futureTransaction.temporalUnit = temporalUnit;

        newRequest = futureTransaction.schedule(factoryAddress);
        require(newRequest!=0x0);

        NewRequest(newRequest);
        /// Automatically returns newRequest
    }

    /**
     * @dev Schedules a new TransactionRequest using the 'full' parameters.
     * @param _toAddress The address destination of the transaction.
     * @param _callData The bytecode that will be included with the transaction.
     * @param _uintArgs [0] The callGas of the transaction.
     * @param _uintArgs [1] The value of ether to be send with the transaction.
     * @param _uintArgs [2] The size of the execution window of the transaction.
     * @param _uintArgs [3] The (block or timestamp) of when the execution window starts.
     * @param _uintArgs [4] The gasPrice which will be used to execute this transaction.
     * @param _uintArgs [5] The donation value attached to this transaction.
     * @param _uintArgs [6] The payment value attached to this transaction.
     * @return The address of the new TransactionRequest.   
     */
    function scheduleTxFull(address _toAddress,
                            bytes32 _callData,
                            uint[7] _uintArgs)
        doReset
        public payable returns (address)
    {
        futureTransaction.toAddress = _toAddress;
        futureTransaction.callData = _callData;
        futureTransaction.callGas = _uintArgs[0];
        futureTransaction.callValue = _uintArgs[1];
        futureTransaction.windowSize = _uintArgs[2];
        futureTransaction.windowStart = _uintArgs[3];
        futureTransaction.gasPrice = _uintArgs[4];
        futureTransaction.donation = _uintArgs[5];
        futureTransaction.payment = _uintArgs[6];

        futureTransaction.temporalUnit = temporalUnit;

        address newRequest = futureTransaction.schedule(factoryAddress);
        require( newRequest != 0x0 );

        NewRequest(newRequest);
        return newRequest;
    }

    /// Event that bubbles up the address of new requests made with this scheduler.
    event NewRequest(address request);

    //------------------------
    // Deperecated API below
    //------------------------

    // /*
    //  *  @dev Smaller scheduling API.
    //  *  FIXME: Use explicit calls.
    //  * 
    //  *  @param uintArgs[0] callGas
    //  *  @param uintArgs[1] callValue
    //  *  @param uintArgs[2] windowSize
    //  *  @param uintArgs[3] windowStart
    //  *  @param bytes32 callData;
    //  *  @param address toAddress;
    //  */
    // function scheduleTransaction(address _toAddress,
    //                              bytes32 callData,
    //                              uint[4] uintArgs)
    //     doReset public payable returns (address)
    // {
    //     futureTransaction.toAddress = _toAddress;
    //     futureTransaction.callData = callData;
    //     futureTransaction.callGas = uintArgs[0];
    //     futureTransaction.callValue = uintArgs[1];
    //     futureTransaction.windowSize = uintArgs[2];
    //     futureTransaction.windowStart = uintArgs[3];

    //     // This is here to make this explicit.  While it should remain the same
    //     // across multiple calls, this ensures that it is clear what this value
    //     // is set to as well as keeping the setting close to where the other
    //     // transaction details are set.
    //     futureTransaction.temporalUnit = temporalUnit;
    //     // return 0x0;
    //     return futureTransaction.schedule(factoryAddress);
    // }

    // /**
    //  *  @dev Full scheduling API exposing all fields.
    //  *  FIXME: ClaimWindow is fixed
    //  *
    //  *  uintArgs[0] callGas
    //  *  uintArgs[1] callValue
    //  *  uintArgs[2] donation
    //  *  uintArgs[3] payment
    //  *  uintArgs[4] windowSize
    //  *  uintArgs[5] windowStart
    //  *  bytes32 callData;
    //  *  address toAddress;
    //  */
    // function scheduleTransaction(address toAddress,
    //                              bytes32 callData,
    //                              uint[6] uintArgs)
    //     doReset public payable returns (address)
    // {
    //     futureTransaction.toAddress = toAddress;
    //     futureTransaction.callData = callData;
    //     futureTransaction.callGas = uintArgs[0];
    //     futureTransaction.callValue = uintArgs[1];
    //     futureTransaction.donation = uintArgs[2];
    //     futureTransaction.payment = uintArgs[3];
    //     futureTransaction.windowSize = uintArgs[4];
    //     futureTransaction.windowStart = uintArgs[5];

    //     // This is here to make this explicit.  While it should remain the same
    //     // across multiple calls, this ensures that it is clear what this value
    //     // is set to as well as keeping the setting close to where the other
    //     // transaction details are set.
    //     futureTransaction.temporalUnit = temporalUnit;

    //     return futureTransaction.schedule(factoryAddress);
    // }
}
