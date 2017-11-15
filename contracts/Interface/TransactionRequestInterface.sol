pragma solidity ^0.4.17;

contract TransactionRequestInterface {
    /*
     * @dev Primary actions
     */
    function execute() public returns (bool);
    function cancel() public returns (bool);
    function claim() public payable returns (bool);

    /*
     * @dev Data accessors
     */
    function requestData() returns (address[6],
                                    bool[3],
                                    uint[14],
                                    uint8[1]);
    function callData() constant returns (bytes32);

    /*
     * @dev Pull mechanisms for payments.
     */
    function refundClaimDeposit() public returns (bool);
    function sendDonation() public returns (bool);
    function sendPayment() public returns (bool);
    function sendOwnerEther() public returns (bool);
}
