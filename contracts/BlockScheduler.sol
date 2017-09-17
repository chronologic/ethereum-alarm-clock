pragma solidity ^0.4.15;


import {RequestScheduleLib} from "contracts/RequestScheduleLib.sol";
import {BaseScheduler} from "contracts/BaseScheduler.sol";


contract BlockScheduler is BaseScheduler {
    function BlockScheduler(address _factoryAddress) {
        // Set the type of time scheduling to blocks
        temporalUnit = RequestScheduleLib.TemporalUnit(1);

        // Set the factory address.
        factoryAddress = _factoryAddress;
    }
}


contract TestnetBlockScheduler is BlockScheduler(0x6005cb5aa9c4774c9F1f46EF3323c1337809cDb0) {
}
