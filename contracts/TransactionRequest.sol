pragma solidity ^0.4.17;

import "contracts/Library/RequestLib.sol";

import "contracts/Interface/TransactionRequestInterface.sol";


contract TransactionRequest is TransactionRequestInterface {
    using RequestLib for RequestLib.Request;

    RequestLib.Request txnRequest; // TODO: Public? This is a data struct

    /*
     *  addressArgs[0] - meta.owner
     *  addressArgs[1] - paymentData.donationBenefactor
     *  addressArgs[2] - txnData.toAddress
     *
     *  uintArgs[0]  - paymentData.donation
     *  uintArgs[1]  - paymentData.payment
     *  uintArgs[2]  - schedule.claimWindowSize
     *  uintArgs[3]  - schedule.freezePeriod
     *  uintArgs[4]  - schedule.reservedWindowSize
     *  uintArgs[5]  - schedule.temporalUnit
     *  uintArgs[7]  - schedule.executionWindowSize
     *  uintArgs[6]  - schedule.windowStart
     *  uintArgs[8]  - txnData.callGas
     *  uintArgs[9]  - txnData.callValue
     */
    function TransactionRequest(address[4] addressArgs,
                                uint[10] uintArgs,
                                bytes32 callData)
        public payable
    {
        txnRequest.initialize(addressArgs, uintArgs, callData);
    }

    /*
     *  Allow receiving ether.  This is needed if there is a large increase in
     *  network gas prices.
     */
    function() public payable {}

    /*
     *  Actions
     */
    function execute() public returns (bool) {
        require( txnRequest.execute() );
        return true;
        // return txnRequest.execute();
    }

    function executeNew() public returns (bool) {
        return txnRequest.executeNew();
    }

    function cancel() public returns (bool) {
        return txnRequest.cancel();
    }

    function claim() public payable returns (bool) {
        return txnRequest.claim();
    }

    /*
     *  Data accessor functions.
     */
     
    // TODO: figure out why returning RequestLib.serialize() isn't working.
    // FIXME: This needs to bubble up an event with all this data instead.
    function requestData() 
        public returns (address[6], bool[3], uint[14], uint8[1])
    {
        if (txnRequest.serialize()) {
            RequestData(txnRequest.serializedValues.addressValues,
                        txnRequest.serializedValues.boolValues,
                        txnRequest.serializedValues.uintValues,
                        txnRequest.serializedValues.uint8Values);
            return (
                txnRequest.serializedValues.addressValues,
                txnRequest.serializedValues.boolValues,
                txnRequest.serializedValues.uintValues,
                txnRequest.serializedValues.uint8Values
            );
        } else {
            revert();
        }
    }

    event RequestData(address[6] addressArgs, bool[3] bools, uint[14] uintArgs, uint8[1] uint8Args);

    function callData() public view returns (bytes32) {
        return txnRequest.txnData.callData;
    }

    /*
     *  Pull based payment functions.
     */
    function refundClaimDeposit() public {
        txnRequest.refundClaimDeposit(); // Will revert() if cannot be called.
    }

    function sendDonation() public returns (bool) {
        return txnRequest.sendDonation();
    }

    function sendPayment() public returns (bool) {
        return txnRequest.sendPayment();
    }

    function sendOwnerEther() public returns (bool) {
        return txnRequest.sendOwnerEther();
    }
}
