pragma solidity ^0.4.18;

import "contracts/Library/RequestScheduleLib.sol";
import "contracts/Scheduler/BaseScheduler.sol";

/**
 * @title BlockScheduler
 * @dev Top-level contract that exposes the API to the Ethereum Alarm Clock service and passes in blocks as temporal unit.
 */
contract BlockScheduler is BaseScheduler {

    /**
     * @dev Constructor
     * @param _factoryAddress Address of the RequestFactory which creates requests for this scheduler.
     */
    function BlockScheduler(address _factoryAddress) {
        // Default temporal unit is block number.
        temporalUnit = RequestScheduleLib.TemporalUnit(1);

        // Sets the factoryAddress variable found in SchedulerInterface contract.
        factoryAddress = _factoryAddress;
    }
}


// contract TestnetBlockScheduler is BlockScheduler(0x6005cb5aa9c4774c9f1f46ef3323c1337809cdb0) {
// }
