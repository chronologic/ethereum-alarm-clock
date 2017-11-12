pragma solidity ^0.4.17;

import "contracts/Interface/SchedulerInterface.sol";
import "contracts/Library/RequestScheduleLib.sol";
import "contracts/Library/SchedulerLib.sol";


contract BaseScheduler is SchedulerInterface {
    using SchedulerLib for SchedulerLib.FutureTransaction;

    /*
     * Fallback function to be able to receive ether. This can occur
     * legitimately when scheduling fails due to a validation error.
     */
    function() payable public {}

    /*
     *  @dev Full scheduling API exposing all fields.
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

        return futureTransaction.schedule(factoryAddress);
    }

    /*
     *  Full scheduling API exposing all fields.
     * 
     *  uintArgs[0] callGas
     *  uintArgs[1] callValue
     *  uintArgs[2] donation
     *  uintArgs[3] payment
     *  uintArgs[4] requiredStackDepth
     *  uintArgs[5] windowSize
     *  uintArgs[6] windowStart
     *  bytes32 callData;
     *  address toAddress;
     */
    function scheduleTransaction(address toAddress,
                                 bytes32 callData,
                                 uint[7] uintArgs)
        doReset public payable returns (address)
    {
        futureTransaction.toAddress = toAddress;
        futureTransaction.callData = callData;
        futureTransaction.callGas = uintArgs[0];
        futureTransaction.callValue = uintArgs[1];
        futureTransaction.donation = uintArgs[2];
        futureTransaction.payment = uintArgs[3];
        futureTransaction.requiredStackDepth = uintArgs[4];
        futureTransaction.windowSize = uintArgs[5];
        futureTransaction.windowStart = uintArgs[6];

        // This is here to make this explicit.  While it should remain the same
        // across multiple calls, this ensures that it is clear what this value
        // is set to as well as keeping the setting close to where the other
        // transaction details are set.
        futureTransaction.temporalUnit = temporalUnit;

        return futureTransaction.schedule(factoryAddress);
    }
}
