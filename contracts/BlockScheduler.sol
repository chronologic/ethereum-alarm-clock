pragma solidity ^0.4.17;

import {RequestScheduleLib} from "contracts/Library/RequestScheduleLib.sol";

/// Imports BaseScheduler Contract
import "contracts/Scheduler.sol";


contract BlockScheduler is BaseScheduler {
    function BlockScheduler(address _factoryAddress) {
        // Set the type of time scheduling to blocks
        temporalUnit = RequestScheduleLib.TemporalUnit(1);

        // Set the factory address.
        factoryAddress = _factoryAddress;
    }
}


contract TestnetBlockScheduler is BlockScheduler(0x6005cb5aa9c4774c9f1f46ef3323c1337809cdb0) {
}
