pragma solidity ^0.4.18;

library MathHelper {

    /// Finds the max of two uints.
    function max(uint a, uint b)
        internal pure returns (uint)
    {
        return a >= b ? a : b;
    }

    string constant GT = ">";
    string constant LT = "<";
    string constant GTE = ">=";
    string constant LTE = "<=";
    string constant EQ = "==";

    function _compare(int _left, string _operator, int _right)
        internal pure returns (bool)
    {
        if (_operator == GT) {
            return _left > _right;
        }
    }
}