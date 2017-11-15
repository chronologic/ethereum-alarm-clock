pragma solidity ^0.4.17;

import "contracts/TransactionRequest.sol";

/**
 * A simple wrapper around TransactionRequest that lets 
 * us travel in time by artificially managing the block number.
 */
contract TxRequestTester is TransactionRequest {
    uint private mockBlock = 1;

    function TxRequestTester(address[4] addressArgs,
                                uint[10] uintArgs,
                                bytes32 callData) 
             TransactionRequest(addressArgs,
                                uintArgs,
                                callData)
        public payable
    {}

    function getMockBlock()
        public view returns (uint)
    {
        return mockBlock;
    }

    function setMockBlock(uint _blockNum)
        public
    {
        mockBlock = _blockNum;
    }
}