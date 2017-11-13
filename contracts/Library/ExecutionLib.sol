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

        // The stack depth this txn requires.
        // FIXME: remove
        uint requiredStackDepth;
    }

    function sendTransaction(ExecutionData storage self) returns (bool) {
        return self.toAddress.call.value(self.callValue)
                                  .gas(self.callGas)
                                  (self.callData);
    }

    // This is the *average* amount of gas needed to drill down one level in
    // the stack.
    uint constant _GAS_PER_DEPTH = 700;

    function GAS_PER_DEPTH() returns (uint) {
        return _GAS_PER_DEPTH;
    }

    uint constant _MAX_STACK_DEPTH_REQUIREMENT = 1000;

    function MAX_STACK_DEPTH_REQUIREMENT() returns (uint) {
        return _MAX_STACK_DEPTH_REQUIREMENT;
    }

    /*
     * Validation: ensure that the required stack depth is not above the
     * MAX_STACK_DEPTH_REQUIREMENT
     */
    function validateRequiredStackDepth(uint requiredStackDepth) returns (bool) {
        return requiredStackDepth <= _MAX_STACK_DEPTH_REQUIREMENT;
    }

    /*
     * Returns the maximum possible gas consumption that a transaction request
     * may consume.  The EXTRA_GAS value represents the overhead involved in
     * request execution.
     */
    function CALL_GAS_CEILING(uint EXTRA_GAS) returns (uint) {
        return block.gaslimit - EXTRA_GAS;
    }

    /*
     * Validation: ensure that the callGas is not above the total possible gas
     * for a call.
     */
     function validateCallGas(uint callGas, uint EXTRA_GAS) returns (bool) {
         return callGas < CALL_GAS_CEILING(EXTRA_GAS);
     }

    /*
     * Validation: ensure that the toAddress is not set to the empty address.
     */
     function validateToAddress(address toAddress) returns (bool) {
         return toAddress != 0x0;
     }
}
