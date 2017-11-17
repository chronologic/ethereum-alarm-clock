pragma solidity ^0.4.17;

import "contracts/Library/RequestScheduleLib.sol";
import "contracts/Scheduler/BaseScheduler.sol";

/**
 * @title TimestampScheduler
 * @dev Top-level contract that exposes the API to the Ethereum Alarm Clock service and passes in timestamp as temporal unit.
 */
contract TimestampScheduler is BaseScheduler {

    /**
     * @dev Constructor
     * @param _factoryAddress Address of the RequestFactory which creates requests for this scheduler.
     */
    function TimestampScheduler(address _factoryAddress) {
        // Default temporal unit is timestamp.
        temporalUnit = RequestScheduleLib.TemporalUnit(2);

        // Sets the factoryAddress variable found in SchedulerInterface contract.
        factoryAddress = _factoryAddress;
    }
}

// contract TestnetTimestampScheduler is TimestampScheduler(0x6005cb5aa9c4774c9f1f46ef3323c1337809cdb0) {
// }
