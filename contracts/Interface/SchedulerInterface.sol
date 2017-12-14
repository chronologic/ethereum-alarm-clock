pragma solidity ^0.4.17;

import "contracts/Library/RequestScheduleLib.sol";
import "contracts/Library/SchedulerLib.sol";

/**
 * @title SchedulerInterface
 * @dev The base contract that the higher contracts: BaseScheduler, BlockScheduler and TimestampScheduler all inherit from.
 */
contract SchedulerInterface {
    using SchedulerLib for SchedulerLib.FutureTransaction;

    address public factoryAddress;              // The RequestFactory address which produces requests for this scheduler.
    RequestScheduleLib.TemporalUnit public temporalUnit;           // The TemporalUnit of this scheduler.

    /*
     * Local storage variable used to house the data for transaction
     * scheduling.
     */
    SchedulerLib.FutureTransaction public futureTransaction;

    /*
     * When applied to a function, causes the local futureTransaction to
     * get reset to it's defaults on each function call.
     */
    modifier doReset {
        if (temporalUnit == RequestScheduleLib.TemporalUnit.Blocks) {
            futureTransaction.resetAsBlock();
        } else if (temporalUnit == RequestScheduleLib.TemporalUnit.Timestamp) {
            futureTransaction.resetAsTimestamp();
        } else {
            revert();
        }
        _;
    }

    function scheduleTxSimple(address _toAddress,
                              bytes _callData,
                              uint[5] _uintArgs)
        doReset
        public payable returns (address);
    
    function scheduleTxFull(address _toAddress,
                            bytes _callData,
                            uint[7] _uintArgs)
        doReset
        public payable returns (address);


    /*
     *  Full scheduling API exposing all fields.
     * 
     *  uintArgs[0] callGas
     *  uintArgs[1] callValue
     *  uintArgs[2] windowSize
     *  uintArgs[3] windowStart
     *  bytes callData;
     *  address toAddress;
     */
    // function scheduleTransaction(address toAddress,
    //                              bytes32 callData,
    //                              uint[5] uintArgs) 
    //                              doReset public payable returns (address);

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
    // function scheduleTransaction(address toAddress,
    //                              bytes32 callData,
    //                              uint[7] uintArgs) 
    //                              doReset public payable returns (address);
}
