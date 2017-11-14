pragma solidity ^0.4.17;

import "contracts/Interface/SchedulerInterface.sol";
import "contracts/Library/RequestScheduleLib.sol";
import "contracts/Library/SchedulerLib.sol";


contract BaseScheduler is SchedulerInterface {
    using SchedulerLib for SchedulerLib.FutureTransaction;

    /*
     * Fallback function to be able to receive ether. This can occur
     *  legitimately when scheduling fails due to a validation error.
     */
    function() payable public {}

    /*
     *  @dev Smaller scheduling API.
     *  FIXME: Use explicit calls.
     * 
     *  @param uintArgs[0] callGas
     *  @param uintArgs[1] callValue
     *  @param uintArgs[2] windowSize
     *  @param uintArgs[3] windowStart
     *  @param bytes callData;
     *  @param address toAddress;
     */
    function scheduleTransaction(address _toAddress,
                                 bytes32 callData,
                                 uint[4] uintArgs)
        doReset public payable returns (address)
    {
        futureTransaction.toAddress = _toAddress;
        futureTransaction.callData = callData;
        futureTransaction.callGas = uintArgs[0];
        futureTransaction.callValue = uintArgs[1];
        futureTransaction.windowSize = uintArgs[2];
        futureTransaction.windowStart = uintArgs[3];

        // This is here to make this explicit.  While it should remain the same
        // across multiple calls, this ensures that it is clear what this value
        // is set to as well as keeping the setting close to where the other
        // transaction details are set.
        futureTransaction.temporalUnit = temporalUnit;
        // return 0x0;
        return futureTransaction.schedule(factoryAddress);
    }

    //------------------------
    // New API [WIP]
    //------------------------
    function scheduleTxSimple(address _toAddress,
                              bytes32 _callData,
                              uint[4] _uintArgs)
        doReset public payable returns (address)
    {
        TX("Received");
        futureTransaction.toAddress = _toAddress;
        futureTransaction.callData = _callData;
        futureTransaction.callGas = _uintArgs[0];
        futureTransaction.callValue = _uintArgs[1];
        futureTransaction.windowSize = _uintArgs[2];
        futureTransaction.windowStart = _uintArgs[3];

        futureTransaction.temporalUnit = temporalUnit;

        address newRequest = futureTransaction.schedule(factoryAddress);
        assert( newRequest != 0x0 );
        NewRequest(newRequest);
        return newRequest;
    }

    event TX(string _msg);
    event NewRequest(address _newAddress);


    /*
     *  @dev Full scheduling API exposing all fields.
     *  FIXME: ClaimWindow is fixed
     *
     *  uintArgs[0] callGas
     *  uintArgs[1] callValue
     *  uintArgs[2] donation
     *  uintArgs[3] payment
     *  uintArgs[4] windowSize
     *  uintArgs[5] windowStart
     *  bytes32 callData;
     *  address toAddress;
     */
    function scheduleTransaction(address toAddress,
                                 bytes32 callData,
                                 uint[6] uintArgs)
        doReset public payable returns (address)
    {
        futureTransaction.toAddress = toAddress;
        futureTransaction.callData = callData;
        futureTransaction.callGas = uintArgs[0];
        futureTransaction.callValue = uintArgs[1];
        futureTransaction.donation = uintArgs[2];
        futureTransaction.payment = uintArgs[3];
        futureTransaction.windowSize = uintArgs[4];
        futureTransaction.windowStart = uintArgs[5];

        // This is here to make this explicit.  While it should remain the same
        // across multiple calls, this ensures that it is clear what this value
        // is set to as well as keeping the setting close to where the other
        // transaction details are set.
        futureTransaction.temporalUnit = temporalUnit;
        return 0x0;
        // return futureTransaction.schedule(factoryAddress);
    }
}
