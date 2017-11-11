pragma solidity ^0.4.18;

import './GroveLib.sol';
import './MathLib.sol';

contract RequestTracker {
    /**
     * testnet:
     * mainnet:
     */
    using GroveLib for GroveLib.Index;
    using MathLib for uint;

    mapping (address => GroveLib.Index) requestsByAddress;

    /**
     * @dev Returns the window start value for the given request.
     * @param _factory Address of
     * @param _request Address of 
     * @return uint Window start value.
     */
    function getWindowStart(address _factory,
                            address _request)
        constant returns (uint)
    {
        return uint(requestsByAddress[_factory].getNodeValue(bytes32(_request)));
    }
}