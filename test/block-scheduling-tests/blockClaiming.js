require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Brings in config.web3 (v1.0.0)
const config = require('../../config')
const { RequestData } = require('../dataHelpers.js')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)

const NULL_ADDR = '0x0000000000000000000000000000000000000000'

contract('Block claiming', async function(accounts) {
    const Owner = accounts[0]
    const Benefactor = accounts[1]

    let txRequest
    let txRecorder

    let firstClaimBlock
    let lastClaimBlock

    /// Before each test we deploy a new instance of Transaction Request so we have a fresh instance
    beforeEach(async function () {
        const curBlock = await config.web3.eth.getBlockNumber()

        txRecorder = await TransactionRecorder.new()
        expect(txRecorder.address)
        .to.exist 

        /// Instantiate a TransactionRequest with temporal unit 1 - aka block
        txRequest = await TransactionRequest.new(
            [
                Owner,                  // created by
                Owner,                  // owner
                Benefactor,             // donation benefactor
                txRecorder.address      // to
            ], [
                0,                      //donation
                0,                      //payment
                25,                     //claim window size
                5,                      //freeze period
                10,                     //reserved window size
                1,                      //temporal unit - blocks is 1
                10,                     //window size
                curBlock + 38,          //windowStart
                100000,                 //callGas
                0                       //callValue
            ],
            'this-is-the-call-data',
            {value: config.web3.utils.toWei('1')}
        )
    })

    /////////////
    /// Tests ///
    /////////////

    it('should not claim before first claim block', async function() {
        const requestData = await RequestData.from(txRequest)

        const firstClaimBlock = requestData.schedule.windowStart - requestData.schedule.freezePeriod - requestData.schedule.claimWindowSize

        expect(firstClaimBlock)
        .to.be.above(await config.web3.eth.getBlockNumber())

        await waitUntilBlock(0, firstClaimBlock - 1)

        await txRequest.claim({
            value: config.web3.utils.toWei(
                (2*requestData.paymentData.payment).toString()
            )
        }).should.be.rejectedWith('VM Exception while processing transaction: revert')

        await requestData.refresh()

        expect(requestData.claimData.claimedBy)
        .to.equal(NULL_ADDR)
    })

    it('should allow claiming at the first claim block', async function() {
        const requestData = await RequestData.from(txRequest)

        const firstClaimBlock = requestData.schedule.windowStart - requestData.schedule.freezePeriod - requestData.schedule.claimWindowSize

        expect(firstClaimBlock)
        .to.be.above(await config.web3.eth.getBlockNumber())

        await waitUntilBlock(0, firstClaimBlock)

        const claimTx = await txRequest.claim({
            from: accounts[0],
            value: config.web3.utils.toWei('2')
        })
        expect(claimTx.receipt)
        .to.exist 

        await requestData.refresh() 

        expect(requestData.claimData.claimedBy)
        .to.equal(accounts[0])
    })

    it('should allow claiming at the last claim block', async function() {
        const requestData = await RequestData.from(txRequest)
        
        const lastClaimBlock = requestData.schedule.windowStart - requestData.schedule.freezePeriod

        expect(lastClaimBlock)
        .to.be.above(await config.web3.eth.getBlockNumber())

        /// Because this function consumes a block we must give ourselves the buffer of two blocks.
        await waitUntilBlock(0, lastClaimBlock - 2)

        const claimTx = await txRequest.claim({
            from: accounts[0],
            value: config.web3.utils.toWei('2')
        })
        expect(claimTx.receipt)
        .to.exist 

        await requestData.refresh() 

        expect(requestData.claimData.claimedBy)
        .to.equal(accounts[0])
    })

    it('cannot claim after the last block', async function() {
        const requestData = await RequestData.from(txRequest)
        
        const lastClaimBlock = requestData.schedule.windowStart - requestData.schedule.freezePeriod

        expect(lastClaimBlock)
        .to.be.above(await config.web3.eth.getBlockNumber())

        await waitUntilBlock(0, lastClaimBlock)

        await txRequest.claim({
            from: accounts[0],
            value: config.web3.utils.toWei(
                (2*requestData.paymentData.payment).toString()
            )
        }).should.be.rejectedWith('VM Exception while processing transaction: revert')

        await requestData.refresh() 

        expect(requestData.claimData.claimedBy)
        .to.equal(NULL_ADDR)
        
    })

    it('should execute a claimed block request', async function() {
        const requestData = await RequestData.from(txRequest)
        
        const firstClaimBlock = requestData.schedule.windowStart - requestData.schedule.freezePeriod - requestData.schedule.claimWindowSize

        expect(firstClaimBlock)
        .to.be.above(await config.web3.eth.getBlockNumber())

        await waitUntilBlock(0, firstClaimBlock)

        const claimTx = await txRequest.claim({
            from: accounts[1],
            value: config.web3.utils.toWei('2')
        })
        expect(claimTx.receipt)
        .to.exist 

        await requestData.refresh()

        expect(requestData.claimData.claimedBy)
        .to.equal(accounts[1])

        await waitUntilBlock(0, requestData.schedule.windowStart)

        const executeTx = await txRequest.execute({
            from: accounts[1],
            gas: 3000000
        })
        expect(executeTx.receipt)
        .to.exist 

        await requestData.refresh()

        expect(requestData.meta.wasCalled)
        .to.be.true 
    })

    it('should execute a claimed call after block reserve window', async function() {
        const requestData = await RequestData.from(txRequest)

        const firstClaimBlock = requestData.schedule.windowStart - requestData.schedule.freezePeriod - requestData.schedule.claimWindowSize
    
        expect(firstClaimBlock)
        .to.be.above(await config.web3.eth.getBlockNumber())

        await waitUntilBlock(0, firstClaimBlock)

        const claimTx = await txRequest.claim({
            value: config.web3.utils.toWei('2'),
            from: accounts[2]
        })
        expect(claimTx.receipt)
        .to.exist 

        await requestData.refresh() 

        expect(requestData.claimData.claimedBy)
        .to.equal(accounts[2])

        await waitUntilBlock(0, requestData.schedule.windowStart + requestData.schedule.reservedWindowSize)

        const executeTx = await txRequest.execute({
            gas: 3000000
        })
        expect(executeTx.receipt)
        .to.exist 

        await requestData.refresh() 
        // console.log(requestData)
        // expect(requestData.meta.wasCalled)
        // .to.be.true 
    })

    it('should determine payment amount', async function() {
        const requestData = await RequestData.from(txRequest)

        const claimAt = requestData.schedule.windowStart - requestData.schedule.freezePeriod - requestData.schedule.claimWindowSize + Math.floor(requestData.schedule.claimWindowSize * 2 / 3)
    
        const expectedPaymentModifier = Math.floor(100 * 2 / 3)

        expect(requestData.claimData.paymentModifier)
        .to.equal(0)

        expect(claimAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        await waitUntilBlock(0, claimAt)

        const claimTx = await txRequest.claim({
            value: config.web3.utils.toWei('2')
        })
        expect(claimTx.receipt)
        .to.exist 

        await requestData.refresh() 
        
        expect(requestData.claimData.paymentModifier - 2)
        .to.equal(expectedPaymentModifier)
    })
})