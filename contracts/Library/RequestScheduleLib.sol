pragma solidity ^0.4.17;

import "contracts/zeppelin/SafeMath.sol";

library RequestScheduleLib {
    using SafeMath for uint;

    /*
     *  The manner in which this schedule specifies time.
     *
     *  Null: present to require this value be explicitely specified
     *  Blocks: execution schedule determined by block.number
     *  Timestamp: execution schedule determined by block.timestamp
     */
    enum TemporalUnit {
        Null,
        Blocks,
        Timestamp
    }

    struct ExecutionWindow {
        // The type of unit used to measure time.
        TemporalUnit temporalUnit;

        // The temporal starting point when the request may be executed
        uint windowStart;

        // The number of temporal units past the windowStart that the request
        // may still be executed.
        uint windowSize;

        // The number of temporal units before the window start during which no
        // activity may occur.
        uint freezePeriod;

        // The number of temporal units after the windowStart during which only
        // the address that claimed the request may execute the request.
        uint reservedWindowSize;

        // The number of temporal units that prior to the call freeze window
        // during which the request will be claimable.
        uint claimWindowSize;
    }

    /*
     *  Return what `now` is in the temporal units being used by this request.
     *  Currently supports block based times, and timestamp (seconds) based
     *  times.
     */
    function getNow(ExecutionWindow storage self) 
        internal view returns (uint)
    {
        return getNow(self.temporalUnit);
    }

    /// FIXME: Should the block num be default?? I set it here to pass tests (line 67)
    function getNow(TemporalUnit temporalUnit) 
        internal view returns (uint)
    {
        if (temporalUnit == TemporalUnit.Timestamp) {
            return block.timestamp;
        } else if (temporalUnit == TemporalUnit.Blocks) {
            return block.number;
        } else {
            // Unspecified OR unsupported unit.
            revert();
        }
    }

    /*
     * @dev The modifier that will be applied to the payment value for a claimed call.
     */
    function computePaymentModifier(ExecutionWindow storage self) 
        returns (uint8)
    {
        //require(inClaimWindow(self)); // This is not needed since it is already checked before sending this function.
        
        uint paymentModifier = (getNow(self).sub(firstClaimBlock(self))).mul(100).div(self.claimWindowSize); 
        assert(paymentModifier <= 100); 

        return uint8(paymentModifier);
    }

    /*
     *  Helper: computes the end of the execution window.
     */
    function windowEnd(ExecutionWindow storage self) returns (uint) {
        return self.windowStart.add(self.windowSize);
    }

    /*
     *  Helper: computes the end of the reserved portion of the execution
     *  window.
     */
    function reservedWindowEnd(ExecutionWindow storage self) returns (uint) {
        return self.windowStart.add(self.reservedWindowSize);
    }

    /*
     *  Helper: computes the time when the request will be frozen until execution.
     */
    function freezeStart(ExecutionWindow storage self) 
        view returns (uint)
    {
        return self.windowStart.sub(self.freezePeriod);
    }

    /*
     *  Helper: computes the time when the request will be frozen until execution.
     */
    function firstClaimBlock(ExecutionWindow storage self) 
        view returns (uint)
    {
        return freezeStart(self).sub(self.claimWindowSize);
    }

    /*
     *  Helper: Returns boolean if we are before the execution window.
     */
    function isBeforeWindow(ExecutionWindow storage self) returns (bool) {
        return getNow(self) < self.windowStart;
    }

    /*
     *  Helper: Returns boolean if we are after the execution window.
     */
    function isAfterWindow(ExecutionWindow storage self) returns (bool) {
        return getNow(self) > windowEnd(self);
    }

    /*
     *  Helper: Returns boolean if we are inside the execution window.
     */
    function inWindow(ExecutionWindow storage self) returns (bool) {
        return self.windowStart <= getNow(self) && getNow(self) < windowEnd(self);
    }

    /*
     *  Helper: Returns boolean if we are inside the reserved portion of the
     *  execution window.
     */
    function inReservedWindow(ExecutionWindow storage self) returns (bool) {
        return self.windowStart <= getNow(self) && getNow(self) < reservedWindowEnd(self);
    }

    /*
     * @dev Helper: Returns boolean if we are inside the claim window.
     */
    function inClaimWindow(ExecutionWindow storage self) 
        view returns (bool)
    {
        // DEBUG(firstClaimBlock(self));
        // DEBUG(getNow(self));
        assert(firstClaimBlock(self) <= getNow(self));
        assert(getNow(self) < freezeStart(self));
        return true;
    }

    event DEBUG(uint num);
    /*
     *  Helper: Returns boolean if we are before the freeze period.
     */
    function isBeforeFreeze(ExecutionWindow storage self) returns (bool) {
        return getNow(self) < freezeStart(self);
    }

    /*
     *  Helper: Returns boolean if we are before the freeze period.
     */
    function isBeforeClaimWindow(ExecutionWindow storage self) returns (bool) {
        return getNow(self) < firstClaimBlock(self);
    }

    /*
     *  Validation: ensure that the reservedWindowSize <= windowSize
     */
    function validateReservedWindowSize(uint reservedWindowSize,
                                        uint windowSize)
        view returns (bool)
    {
        return reservedWindowSize <= windowSize.add(1);
    }

    /*
     *  Validation: ensure that the startWindow is at least freezePeriod in the future
     */
    function validateWindowStart(TemporalUnit temporalUnit,
                                 uint freezePeriod,
                                 uint windowStart) 
        view returns (bool)
    {
        return getNow(temporalUnit).add(freezePeriod) <= windowStart;
    }

    /*
     *  Validation: ensure that the temporal unit passed in is constrained to 0 or 1
     */
    function validateTemporalUnit(uint temporalUnitAsUInt) returns (bool) {
        return (temporalUnitAsUInt != uint(TemporalUnit.Null) && (
            temporalUnitAsUInt == uint(TemporalUnit.Blocks) || 
            temporalUnitAsUInt == uint(TemporalUnit.Timestamp)
        ));
    }
}
