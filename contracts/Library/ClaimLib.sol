pragma solidity ^0.4.17;

import "contracts/Library/MathLib.sol";


library ClaimLib {
    using MathLib for uint;

    struct ClaimData {
        // The address that has claimed this request
        address claimedBy;

        // The deposit amount that was put down by the claimer.
        uint claimDeposit;

        // TODO: add `requiredDeposit` and remove the hard-coding of the `2 *
        // payment` minimum deposit size.

        // An integer constrained between 0-100 that will be applied to the
        // request payment as a percentage.
        uint8 paymentModifier;
    }

    /*
     * Mark the request as being claimed
     */
    function claim(ClaimData storage self, uint8 paymentModifier) returns (bool) {
        self.claimedBy = msg.sender;
        self.claimDeposit = msg.value;
        self.paymentModifier = paymentModifier;
    }

    /*
     * Helper: returns whether this request is claimed.
     */
    function isClaimed(ClaimData storage self) pure returns (bool) {
        return self.claimedBy != 0x0;
    }

    /*
     * Amount that must be supplied as a deposit to claim.  This is set to the
     * maximum possible payment value that could be paid out by this request.
     */
    function minimumDeposit(uint payment) pure returns (uint) {
        return payment.safeMultiply(2);
    }

    /*
     * Refund the claimer deposit.
     */
    function refundDeposit(ClaimData storage self) returns (bool) {
        return refundDeposit(self);
    }

    function refundDeposit(ClaimData storage self) returns (bool) {
        uint depositAmount;

        depositAmount = self.claimDeposit;
        if (depositAmount > 0) {
            // re-entrance protection. TODO: Is this still necessary? - Logan
            self.claimDeposit = 0;
            self.claimedBy.transfer(depositAmount);
            // self.claimDeposit = depositAmount.flooredSub(self.claimedBy.transfer(depositAmount));
        }

        return true;
    }
}
