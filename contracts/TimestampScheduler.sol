pragma solidity ^0.4.15;


import {RequestScheduleLib} from "contracts/RequestScheduleLib.sol";
import {BaseScheduler} from "contracts/BaseScheduler.sol";


contract TimestampScheduler is BaseScheduler {
    function TimestampScheduler(address _factoryAddress) {
        // Set the type of time scheduling to timestamps
        temporalUnit = RequestScheduleLib.TemporalUnit(2);

        // Set the factory address.
        factoryAddress = _factoryAddress;
    }
}


contract TestnetTimestampScheduler is TimestampScheduler(0x6005cb5aa9c4774c9F1f46EF3323c1337809cDb0) {
}
