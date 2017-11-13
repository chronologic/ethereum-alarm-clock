pragma solidity ^0.4.17;

contract RequestFactoryInterface {
    event RequestCreated(address request);

    function createRequest(address[3] addressArgs,
                           uint[10] uintArgs,
                           bytes32 callData) public payable returns (address);
    function validateRequestParams(address[3] addressArgs,
                                   uint[10] uintArgs,
                                   bytes32 callData,
                                   uint endowment) internal returns (bool[6]);
    function createValidatedRequest(address[3] addressArgs,
                                    uint[10] uintArgs,
                                    bytes32 callData) payable returns (address);
    function isKnownRequest(address _address) view returns (bool);
}
