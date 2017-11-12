pragma solidity ^0.4.17;

contract RequestFactoryInterface {
    event RequestCreated(address request);

    function createRequest(address[3] addressArgs,
                           uint[11] uintArgs,
                           bytes32 callData) returns (address);
    function validateRequestParams(address[3] addressArgs,
                                   uint[11] uintArgs,
                                   bytes32 callData,
                                   uint endowment) returns (bool[7]);
    function createValidatedRequest(address[3] addressArgs,
                                    uint[11] uintArgs,
                                    bytes32 callData) payable returns (address);
    function isKnownRequest(address _address) returns (bool);
}
