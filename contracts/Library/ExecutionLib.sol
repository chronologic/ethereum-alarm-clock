pragma solidity ^0.4.17;

library ExecutionLib {
    struct ExecutionData {
        // The address that the txn will be sent to.
        address toAddress;

        // The bytes32 value that will be sent with the txn.
        bytes32 callData;

        // The value in wei that will be sent with the txn.
        uint callValue;

        // The amount of gas that will be sent with the txn
        // FIXME: add callGasPrice

        uint callGas;

<<<<<<< HEAD
        // The stack depth this txn requires.
        // FIXME: remove
        uint requiredStackDepth;
=======
        // FIXME: Add callGasPrice
        // uint callGasPrice;
>>>>>>> dev
    }

    function sendTransaction(ExecutionData storage self)
        public returns (bool)
    {
        return self.toAddress.call.value(self.callValue)
                                  .gas(self.callGas)
                                  (self.callData);
    }


    /*
     * Returns the maximum possible gas consumption that a transaction request
     * may consume.  The EXTRA_GAS value represents the overhead involved in
     * request execution.
     */
    function CALL_GAS_CEILING(uint EXTRA_GAS) 
        internal view returns (uint)
    {
        return block.gaslimit - EXTRA_GAS;
    }

    /*
     * Validation: ensure that the callGas is not above the total possible gas
     * for a call.
     */
     function validateCallGas(uint callGas, uint EXTRA_GAS)
        internal view returns (bool)
    {
         return true;
         //callGas < CALL_GAS_CEILING(EXTRA_GAS);
     }

    /*
     * Validation: ensure that the toAddress is not set to the empty address.
     */
     function validateToAddress(address toAddress)
        view returns (bool)
    {
         return toAddress != 0x0;
    }
}
