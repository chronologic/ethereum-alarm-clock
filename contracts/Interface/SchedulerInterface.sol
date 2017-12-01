pragma solidity ^0.4.17;

import "contracts/Library/RequestScheduleLib.sol";
import "contracts/Library/SchedulerLib.sol";

/**
 * @title SchedulerInterface
 * @dev The base contract that the higher contracts: BaseScheduler, BlockScheduler and TimestampScheduler all inherit from.
 */
contract SchedulerInterface {
    using SchedulerLib for SchedulerLib.FutureTransaction;

    address public factoryAddress;                          // The RequestFactory address which produces requests for this scheduler.
    RequestScheduleLib.TemporalUnit public temporalUnit;    // The TemporalUnit of this scheduler.

    /*
     * Local storage variable used to house the data for transaction
     * scheduling.
     */
    SchedulerLib.FutureTransaction public futureTransaction;

    /*
     * When applied to a function, causes the local futureTransaction to
     * get reset to it's defaults on each function call.
     *
     * TODO: Compare to actual enum values when solidity compiler error is fixed.
     * https://github.com/ethereum/solidity/issues/1116
     */
    modifier doReset {
        if (uint(temporalUnit) == 1) {
            futureTransaction.resetAsBlock();
        } else if (uint(temporalUnit) == 2) {
            futureTransaction.resetAsTimestamp();
        } else {
            revert();
        }
        _;
    }

    // function scheduleTxSimple
    // function scheduleTxFull

    /*
     *  Full scheduling API exposing all fields.
     * 
     *  uintArgs[0] callGas
     *  uintArgs[1] callValue
     *  uintArgs[2] windowSize
     *  uintArgs[3] windowStart
     *  bytes32 callData;
     *  address toAddress;
     */
    function scheduleTransaction(address toAddress,
                                 bytes callData,
                                 uint[5] uintArgs) 
                                 doReset public payable returns (address);

    /*
     *  Full scheduling API exposing all fields.
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
                                 bytes callData,
                                 uint[7] uintArgs) 
                                 doReset public payable returns (address);
}
