//pragma solidity 0.4.1;

import {RequestFactoryInterface} from "contracts/RequestFactoryInterface.sol";
import {RequestTrackerInterface} from "contracts/RequestTrackerInterface.sol";
import {PaymentLib} from "contracts/PaymentLib.sol";


library FutureBlockTransactionLib {
    address constant DONATION_BENEFACTOR = 0xd3cda913deb6f67967b99d67acdfa1712c293601;

    struct FutureBlockTransaction {
        uint donation;
        uint payment;

        uint8 gracePeriod;

        uint targetBlock;
        uint callGas;
        uint callValue;
        bytes callData;
        address toAddress;
        uint requiredStackDepth;
    }

    /*
     * Set default values.
     */
    function reset(FutureBlockTransaction storage self) {
        self.donation = 12345;
        self.payment = 54321;
        self.gracePeriod = 255;
        self.targetBlock = block.number + 10;
        self.toAddress = msg.sender;
        self.callGas = 90000;
        self.callData = "";
        self.requiredStackDepth = 0;
    }

    /*
     *  The low level interface for creating a transaction request.
     */
    function schedule(FutureBlockTransaction storage self,
                      address factoryAddress,
                      address trackerAddress) public returns (address) {
        var factory = RequestFactoryInterface(factoryAddress);
        address newRequestAddress = factory.createRequest.value(PaymentLib.computeEndowment(
            self.payment,
            self.donation,
            self.callGas,
            self.callValue
        ))(
            [
                msg.sender,           // meta.owner
                DONATION_BENEFACTOR,  // paymentData.donationBenefactor
                self.toAddress        // txnData.toAddress
            ],
            [
                self.donation,           // paymentData.donation
                self.payment,            // paymentData.payment
                255,                     // scheduler.claimWindowSize
                10,                      // scheduler.freezePeriod
                16,                      // scheduler.reservedWindowSize
                1,                       // scheduler.temporalUnit (block)
                self.targetBlock,        // scheduler.windowStart
                255,                     // scheduler.windowSize
                self.callGas,            // txnData.callGas
                self.callValue,          // txnData.callValue
                self.requiredStackDepth  // txnData.requiredStackDepth
            ],
            self.callData
        );

        if (newRequestAddress == 0x0) {
            // something went wrong....
            return 0x0;
        }

        var tracker = RequestTrackerInterface(trackerAddress);
        tracker.addRequest(newRequestAddress, self.targetBlock);

        return newRequestAddress;
    }
}
