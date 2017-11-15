require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Brings in config.web3...
const config = require("../config");

const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

contract('Block claiming', function(accounts) {
    const Owner = accounts[0]
    const Benefactor = accounts[1]
    const ToAddress = accounts[2]

    let transactoinRequest
    let transactionRecorder

    let firstClaimBlock

    /////////////
    /// Tests ///
    /////////////

    it('should not claim before first claim block', async function() {
        let curBlock = await config.web3.eth.getBlockNumber()

        /// When you instantiate a TransactionRequest like this it does not have a `temporalUnit`
        transactionRequest = await TransactionRequest.new(
            [
                Owner, // created by
                Owner, // owner
                Benefactor, // donation benefactor
                ToAddress // To
            ], [
                0, //donation
                0, //payment
                25, //claim window size
                5, //freeze period
                0, //reserved window size
                0, // temporal unit
                10, //window size
                curBlock + 38, //windowStart
                300000, //callGas
                12345 //callValue
            ],
            'this-is-the-call-data'
        )

        /// The first claim block is the current block + the number of blocks
        ///  until the window starts, minus the freeze period minus claim window size.
        firstClaimBlock  = (curBlock + 38) - 5 - 25

        curBlock = await config.web3.eth.getBlockNumber()
        assert(firstClaimBlock > curBlock, "the first claim block should be in the future.")
        
        // No claiming before the window starts!
        await transactionRequest.claim().should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('should allow claiming at the first claim block', async function() {
        await waitUntilBlock(0, firstClaimBlock);

        let res = await transactionRequest.claim({value: config.web3.utils.toWei(1)})
        console.log(res)
    })
})