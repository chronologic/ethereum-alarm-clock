pragma solidity ^0.4.17;

import 'contracts/zeppelin/SafeMath.sol';

library ClaimLib {
    using SafeMath for uint;

    struct ClaimData {
        address claimedBy;        // The address that has claimed this request.

        uint claimDeposit;        // The deposit amount that was put down by the claimer.

        // TODO: add `requiredDeposit` and remove the hard-coding of the `2 *
        // payment` minimum deposit size.
        uint minimumDeposit;

        // An integer constrained between 0-100 that will be applied to the
        // request payment as a percentage.
        uint8 paymentModifier;
    }

    /*
     * @dev Mark the request as being claimed.
     * @param self The ClaimData that is being accessed.
     * @param paymentModifier The payment modifier.
     */
    function claim(ClaimData storage self, uint8 paymentModifier) returns (bool) {
        self.claimedBy = msg.sender;
        self.claimDeposit = msg.value;
        self.paymentModifier = paymentModifier;
    }

    /*
     * Helper: returns whether this request is claimed.
     */
    function isClaimed(ClaimData storage self) returns (bool) {
        return self.claimedBy != 0x0;
    }

    /*
     * @dev Calculates the amount that must be supplied as a deposit to claim.  
     * This is set to the maximum possible payment value that could be paid out by this request.
     */
    function minimumDeposit(uint payment) 
        pure returns (uint)
    {
        return payment.mul(2);
    }

    /*
     * @dev Refund the claim deposit to claimer.
     * @param self The Request.ClaimData
     * Called in RequestLib's `cancel()` and `refundClaimDeposit()`
     */
    function refundDeposit(ClaimData storage self) 
        internal returns (bool)
    {
        // Check that the claim deposit is non-zero.
        if (self.claimDeposit > 0) {
            uint depositAmount;
            depositAmount = self.claimDeposit;
            self.claimDeposit = 0;
            
            self.claimedBy.transfer(depositAmount);
        }
        return true;
    }
}
