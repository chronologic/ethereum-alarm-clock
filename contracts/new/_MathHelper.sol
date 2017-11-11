pragma solidity ^0.4.18;

library MathHelper {

    /// Finds the max of two uints.
    function max(uint a, uint b)
        internal pure returns (uint)
    {
        return a >= b ? a : b;
    }
S
}