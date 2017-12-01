pragma solidity ^0.4.17;

import "contracts/Library/ExecutionLib.sol";
import "contracts/Library/MathLib.sol";
import "contracts/zeppelin/SafeMath.sol";

library PaymentLib {
    using SafeMath for uint;

    struct PaymentData {
        uint gasPrice;              /// The gasPrice needed to execute this TransactionRequest.

        uint payment;               /// The amount in wei to be paid to the executor of this TransactionRequest.

        address paymentBenefactor;  /// The address that the payment should be sent to.

        uint paymentOwed;           /// The amount that is owed to the paymentBenefactor.

        uint donation;              /// The amount in wei that will be paid to the donationBenefactor address.

        address donationBenefactor; /// The address that the donation should be sent to.

        uint donationOwed;          /// The amount that is owed to the donationBenefactor.
    }

    ///---------------
    /// GETTERS
    ///---------------

    /**
     * @dev Getter function that returns true if a request has a benefactor.
     */
    function hasBenefactor(PaymentData storage self)
        internal view returns (bool)
    {
        return self.donationBenefactor != 0x0;
    }

    /**
     * @dev Computes the amount to send to the donationBenefactor. 
     */
    function getDonation(PaymentData storage self) 
        internal view returns (uint)
    {
        return self.donation;
    }

    /**
     * @dev Computes the amount to send to the address that fulfilled the request.
     */
    function getPayment(PaymentData storage self)
        internal view returns (uint)
    {
        return self.payment;
    }
 
    /**
     * @dev Computes the amount to send to the address that fulfilled the request
     *       with an additional modifier. This is used when the call was claimed.
     */
    function getPaymentWithModifier(PaymentData storage self,
                                    uint8 _paymentModifier)
        internal view returns (uint)
    {
        return getPayment(self).mul(_paymentModifier).div(100);
    }

    ///---------------
    /// SENDERS
    ///---------------

    /**
     * @dev Send the donationOwed amount to the donationBenefactor.
     */
    function sendDonation(PaymentData storage self) 
        internal returns (bool)
    {
        uint donationAmount = self.donationOwed;
        if (donationAmount > 0) {
            // re-entrance protection.
            self.donationOwed = 0;
            self.donationBenefactor.transfer(donationAmount);
        }
        return true;
    }

    /**
     * @dev Send the paymentOwed amount to the paymentBenefactor.
     */
    function sendPayment(PaymentData storage self)
        internal returns (bool)
    {
        uint paymentAmount = self.paymentOwed;
        if (paymentAmount > 0) {
            // re-entrance protection.
            self.paymentOwed = 0;
            self.paymentBenefactor.transfer(paymentAmount);
        }
        return true;
    }

    ///---------------
    /// HELPERS
    ///---------------

    /**
     * @dev Compute the endowment value for the given TransactionRequest parameters.
     */
    function computeEndowment(uint _payment,
                              uint _donation,
                              uint _callGas,
                              uint _callValue,
                              uint _gasPrice,
                              uint _gasOverhead) 
        internal pure returns (uint)
    {
        return _payment.add(_donation)
                       .mul(2)
                       .add(_computeHelper(_callGas, _callValue, _gasOverhead, _gasPrice));
    }

    /// Was getting a stack depth error after replacing old MathLib with Zeppelin's SafeMath.
    ///  Added this function to fix it.
    ///  See for context: https://ethereum.stackexchange.com/questions/7325/stack-too-deep-try-removing-local-variables 
    function _computeHelper(uint _callGas,
                            uint _callValue,
                            uint _gasOverhead,
                            uint _gasPrice)
        internal pure returns (uint)
    {
        return _callGas.mul(_gasPrice).mul(2)
                      .add(_gasOverhead.mul(_gasPrice).mul(2))
                      .add(_callValue);
    }
    /*
     * Validation: ensure that the request endowment is sufficient to cover.
     * - payment * maxMultiplier
     * - donation * maxMultiplier
     * - stack depth checking
     * - gasReimbursment
     * - callValue
     */
    function validateEndowment(uint endowment,
                               uint payment,
                               uint donation,
                               uint callGas,
                               uint callValue,
                               uint gasOverhead)
        public pure returns (bool)
    {
        return endowment >= computeEndowment(payment,
                                             donation,
                                             callGas,
                                             callValue,
                                             gasOverhead,
                                             0);//for now);
    }
}
