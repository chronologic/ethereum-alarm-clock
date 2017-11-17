require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Brings in config.web3...
const config = require("../../config");

const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

contract('Block claiming', function(accounts) {
    const Owner = accounts[0]
    const Benefactor = accounts[1]
    const ToAddress = accounts[2]

    let transactionRequest
    let transactionRecorder

    let curBlock // Holds the current block value before each test
    let firstClaimBlock
    let lastClaimBlock

    /////////////
    /// Tests ///
    /////////////

    /// Before each test we deploy a new instance of Transaction Request so we have a fresh instance
    beforeEach(async function () {
        curBlock = await config.web3.eth.getBlockNumber()
        
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
                10, //reserved window size
                1, // temporal unit - blocks is 1
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
        /// The last claim block is the currenct block + the number of blocks
        ///  until the window starts, minus the freeze period minus 1
        lastClaimBlock = (curBlock + 38) - 5 - 1
    })

    it('should not claim before first claim block', async function() {

        curBlock = await config.web3.eth.getBlockNumber()
        assert(firstClaimBlock > curBlock, "the first claim block should be in the future.")
        
        // No claiming before the window starts!
        await transactionRequest.claim().should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('should allow claiming at the first claim block', async function() {
        await waitUntilBlock(0, firstClaimBlock);

        let res = await transactionRequest.claim({value: config.web3.utils.toWei(1)})

        /// Search for the claimed function and expect it to exist.
        let claimed = res.logs.find(e => e.event === "Claimed")
        expect(claimed).to.exist
    })

    /// NOTICE THIS TEST IS OFF BY ONE ( SEE THE -1 ) NEEDS TO BE FIXED
    it('should allow claiming at the last claim block', async function() {
        assert(lastClaimBlock > await config.web3.eth.getBlockNumber(), "The last block should be in the future before we time travel to it.")
        await waitUntilBlock(0, lastClaimBlock -1)
        assert(lastClaimBlock -1 == await config.web3.eth.getBlockNumber(), "And after we time travel, it should be exactly the same.")

        let res = await transactionRequest.claim({value: config.web3.utils.toWei(1)})
        
        /// Search for the claimed function and expect it to exist.
        let claimed = res.logs.find(e => e.event === "Claimed")
        expect(claimed).to.exist

        let requestData = await transactionRequest.requestData()
        expect(requestData).to.exist
    })

    /// NOTICE THIS TEST IS CORRECT the +1 should be there
    it('cannot claim after the last block', async function() {
        assert(lastClaimBlock > await config.web3.eth.getBlockNumber(), "The last block should be in the future before we time travel to it.")
        await waitUntilBlock(0, lastClaimBlock +1)
        assert(lastClaimBlock +1 == await config.web3.eth.getBlockNumber(), "And after we time travel, it should be exactly the same.")

        await transactionRequest.claim({value: config.web3.utils.toWei(1)})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
        
    })

    it('should execute a claimed block request', async function() {
        await waitUntilBlock(0, firstClaimBlock)
        
        let res = await transactionRequest.claim({value: config.web3.utils.toWei(2)})

        /// Search for the claimed function and expect it to exist.
        let claimed = res.logs.find(e => e.event === "Claimed")
        expect(claimed).to.exist

        await waitUntilBlock(0, await config.web3.eth.getBlockNumber() + 30)


        let res2 = await transactionRequest.execute({gas: 3000000})
        // console.log(res2)

        // console.log(await config.web3.eth.getBalance(transactionRequest.address))
        
        let executed = res2.logs.find(e => e.event === "Executed")
        expect(executed).to.exist
        // console.log(executed.args)

        // console.log(await config.web3.eth.getBalance(transactionRequest.address))
    })

    it('should execute a claimed call after block reserve window', async function() {
        await waitUntilBlock(0, firstClaimBlock)
        
        let res = await transactionRequest.claim({value: config.web3.utils.toWei(2)})

        /// Search for the claimed function and expect it to exist.
        let claimed = res.logs.find(e => e.event === "Claimed")
        expect(claimed).to.exist

        await waitUntilBlock(0, lastClaimBlock+15)

        let res2 = await transactionRequest.execute({gas: 3000000})

        let executed = res2.logs.find(e => e.event === "Executed")
        expect(executed).to.exist
    })

    it('should determine payment amount', async function() {
        let claimBlock = Math.floor(firstClaimBlock + 25 * 2/3)
        let expectedPaymentModifier = Math.floor(100 * 2/3)

        await waitUntilBlock(0, claimBlock)

        let res = await transactionRequest.claim({value: config.web3.utils.toWei(2)})
        
        /// Search for the claimed function and expect it to exist.
        let claimed = res.logs.find(e => e.event === "Claimed")
        expect(claimed).to.exist

        //TODO: validate the payment modifier
        
    })
})