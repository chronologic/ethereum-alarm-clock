pragma solidity ^0.4.17;

contract TransactionRequestInterface {
    /*
     * @dev Primary actions
     */
    function execute() public returns (bool);
    function cancel() public returns (bool);
    function claim() public payable returns (bool);

    /*
     * @dev Proxy function
     */
    function proxy(address recipient, bytes callData)
        public payable returns (bool);

    /*
     * @dev Data accessors
     */
    function requestData() public view returns (address[6],
                                                bool[3],
                                                uint[15],
                                                uint8[1]);

    function callData() public view returns (bytes);

    /*
     * @dev Pull mechanisms for payments.
     */
    function refundClaimDeposit() public;
    function sendDonation() public returns (bool);
    function sendPayment() public returns (bool);
    function sendOwnerEther() public returns (bool);
}
