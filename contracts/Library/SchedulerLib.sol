pragma solidity ^0.4.17;

import "contracts/Interface/RequestFactoryInterface.sol";

import "contracts/Library/PaymentLib.sol";
import "contracts/Library/RequestLib.sol";
import "contracts/Library/RequestScheduleLib.sol";

import "contracts/Library/MathLib.sol";
import "contracts/zeppelin/SafeMath.sol";

library SchedulerLib {
    using SafeMath for uint;

    address constant DONATION_BENEFACTOR = 0x246eB2e1E59b857678Bf0d0B7f25cC25b6106044;

    struct FutureTransaction {
        uint donation;
        uint payment;

        uint windowSize;
        uint windowStart;
        RequestScheduleLib.TemporalUnit temporalUnit;

        uint callGas;
        uint callValue;
        bytes32 callData;
        address toAddress;

        uint reservedWindowSize;
        uint freezePeriod;
        uint claimWindowSize;
    }

    /*
     * @dev Set common default values.
     */
    function resetCommon(FutureTransaction storage self) 
        public returns (bool)
    {
        uint defaultPayment = tx.gasprice.mul(1000000);
        if (self.payment != defaultPayment) {
            self.payment = defaultPayment;
        }

        uint defaultDonation = self.payment.div(100);
        if (self.donation != defaultDonation ) {
            self.donation = defaultDonation;
        }

        if (self.toAddress != msg.sender) {
            self.toAddress = msg.sender;
        }
        if (self.callGas != 90000) {
            self.callGas = 90000;
        }
        if (self.callData.length != 0) {
            self.callData = "";
        }
        return true;
    }

    /*
     * @dev Set default values for block based scheduling.
     */
    function resetAsBlock(FutureTransaction storage self)
        public returns (bool)
    {
        // assert(resetCommon(self));
        resetCommon(self);

        if (self.windowSize != 255) {
            self.windowSize = 255;
        }
        if (self.windowStart != block.number + 10) {
            self.windowStart = block.number + 10;
        }
        if (self.reservedWindowSize != 16) {
            self.reservedWindowSize = 16;
        }
        if (self.freezePeriod != 10) {
            self.freezePeriod = 10;
        }
        if (self.claimWindowSize != 255) {
            self.claimWindowSize = 255;
        }

        return true;
    }

    /*
     * Set default values for timestamp based scheduling.
     */
    function resetAsTimestamp(FutureTransaction storage self)
        public returns (bool)
    {
        assert(resetCommon(self));

        if (self.windowSize != 60 minutes) {
            self.windowSize = 60 minutes;
        }
        if (self.windowStart != now + 5 minutes) {
            self.windowStart = now + 5 minutes;
        }
        if (self.reservedWindowSize != 5 minutes) {
            self.reservedWindowSize = 5 minutes;
        }
        if (self.freezePeriod != 3 minutes) {
            self.freezePeriod = 3 minutes;
        }
        if (self.claimWindowSize != 60 minutes) {
            self.claimWindowSize = 60 minutes;
        }

        return true;
    }

    /*
     * @dev The low level interface for creating a transaction request.
     */
    function schedule(FutureTransaction storage self,
                      address factoryAddress) 
        public returns (address) 
    {
        RequestFactoryInterface factory = RequestFactoryInterface(factoryAddress);
        uint endowment = MathLib.min(PaymentLib.computeEndowment(
            self.payment,
            self.donation,
            self.callGas,
            self.callValue,
            RequestLib.EXECUTION_GAS_OVERHEAD() //180000, line 459 RequestLib
        ), this.balance);

        address newRequestAddress = factory.createValidatedRequest.value(endowment)(
            [
                msg.sender,           // meta.owner
                DONATION_BENEFACTOR,  // paymentData.donationBenefactor
                self.toAddress        // txnData.toAddress
            ],
            [
                self.donation,            // paymentData.donation
                self.payment,             // paymentData.payment
                self.claimWindowSize,     // scheduler.claimWindowSize
                self.freezePeriod,        // scheduler.freezePeriod
                self.reservedWindowSize,  // scheduler.reservedWindowSize
                uint(self.temporalUnit),  // scheduler.temporalUnit (1: block, 2: timestamp)
                self.windowSize,          // scheduler.windowSize
                self.windowStart,         // scheduler.windowStart
                self.callGas,             // txnData.callGas
                self.callValue            // txnData.callValue
            ],
            self.callData
        );

        if (newRequestAddress == 0x0) {
            // Something went wrong during creation (likely a ValidationError).
            // Try to return the ether that was sent.  If this fails then
            // resort to throwing an exception to force reversion.
            msg.sender.transfer(msg.value);
            return 0x0;
        }

        return newRequestAddress;
    }
}
