require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect 

/// Contracts
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Bring in config.web3 (v1.0.0)
const config = require('../../config')
const { parseRequestData, parseAbortData, wasAborted } = require('../dataHelpers.js')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
const toBN = config.web3.utils.toBN

contract('Cancelling', async function(accounts) {
    const Owner = accounts[0]

    const gasPrice = config.web3.utils.toWei('66', 'gwei')

    let txRequest 

    /// TransactionRequest constants
    const claimWindowSize = 25 //blocks
    const freezePeriod = 5 //blocks
    const reservedWindowSize = 10 //blocks
    const executionWindow = 10 //blocks
    let windowStart
    let firstClaimBlock

    beforeEach(async function() {
        const curBlockNum = await config.web3.eth.getBlockNumber()
        windowStart = curBlockNum + 38 + 10 + 5

        txRequest = await TransactionRequest.new(
            [
                Owner, //createdBy
                Owner, //owner
                accounts[1], //donationBenefactor
                accounts[3] //toAddress
            ], [
                0, //donation
                1, //payment
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                1, //temporalUnit = 1, aka blocks
                executionWindow,
                windowStart,
                43324, //callGas
                12345, //callValue
                gasPrice
            ],
            'some-call-data-could-be-anything',
            {value: config.web3.utils.toWei('1')}
        )

        firstClaimBlock = windowStart - freezePeriod - claimWindowSize
    })

    /////////////
    /// Tests ///
    /////////////

    it('tests cancelling before the claim window', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart - requestData.schedule.freezePeriod - 3

        expect(cancelAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        expect(requestData.meta.owner)
        .to.equal(Owner)

        expect(requestData.meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await txRequest.cancel({from: Owner})
        expect(cancelTx.receipt).to.exist

        const requestDataRefresh = await parseRequestData(txRequest)

        expect(requestDataRefresh.meta.isCancelled)
        .to.be.true
    })

    it('tests non-owner cannot cancel before the claim window', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart - requestData.schedule.freezePeriod - requestData.schedule.claimWindowSize - 3

        expect(cancelAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        expect(requestData.meta.owner)
        .to.equal(Owner)

        expect(requestData.meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, cancelAt)

        await txRequest.cancel({from: accounts[4]})
        .should.be.rejectedWith('VM Exception while processing transaction: revert')

        expect((await parseRequestData(txRequest)).meta.wasCalled)
        .to.be.false
    })

    it('tests cancelling during claim window when unclaimed', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart - requestData.schedule.freezePeriod - 20

        expect(cancelAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        expect(requestData.meta.owner)
        .to.equal(Owner)

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await txRequest.cancel({from: Owner})

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.true
    })

    it('tests not cancellable once claimed', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart - requestData.schedule.freezePeriod - 20
        const claimAt = cancelAt - 5

        await waitUntilBlock(0, claimAt)

        const claimTx = await txRequest.claim(
            {
                from: accounts[1],
                value: config.web3.utils.toWei(
                    (2 * requestData.paymentData.payment).toString()
                )
            }
        )

        expect(claimTx.receipt)
        .to.exist 

        expect((await parseRequestData(txRequest)).claimData.claimedBy)
        .to.equal(accounts[1])

        await waitUntilBlock(0, cancelAt)

        await txRequest.cancel()
        .should.be.rejectedWith('VM Exception while processing transaction: revert')

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.false
    })

    it('tests not cancellable during the freeze window', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart - requestData.schedule.freezePeriod 

        expect(cancelAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        expect(requestData.meta.owner)
        .to.equal(Owner)

        expect(requestData.meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, cancelAt)

        await txRequest.cancel()
        .should.be.rejectedWith('VM Exception while processing transaction: revert')

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.false 
    })

    it('tests not cancellable during the execution window', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart 

        expect(cancelAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        expect(requestData.meta.owner)
        .to.equal(Owner)

        expect(requestData.meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, cancelAt)

        await txRequest.cancel()
        .should.be.rejectedWith('VM Exception while processing transaction: revert')

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.false 
    })

    it('tests not cancellable if was called', async function() {
        const requestData = await parseRequestData(txRequest) 

        const executeAt = requestData.schedule.windowStart 
        const cancelFirst = requestData.schedule.windowStart + 10
        const cancelSecond = requestData.schedule.windowStart + requestData.schedule.windowSize + 5 

        expect(executeAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        expect(requestData.meta.owner)
        .to.equal(Owner)

        expect(requestData.meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, executeAt)

        const executeTx = await txRequest.execute({
            gas: 3000000,
            gasPrice: gasPrice
        })
        expect(executeTx.receipt)
        .to.exist 

        expect((await parseRequestData(txRequest)).meta.wasCalled)
        .to.be.true

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.false

        await waitUntilBlock(0, cancelFirst)

        await txRequest.cancel()
        .should.be.rejectedWith('VM Exception while processing transaction: revert')

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, cancelSecond)

        await txRequest.cancel()
        .should.be.rejectedWith('VM Exception while processing transaction: revert')

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.false 
    })

    it('tests cancellable if call is missed', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart + requestData.schedule.windowSize + 10

        expect(cancelAt)
        .to.be.above(await config.web3.eth.getBlockNumber())
        
        expect(requestData.meta.owner)
        .to.equal(Owner)

        expect(requestData.meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await txRequest.cancel() 
        expect(cancelTx.receipt)
        .to.exist 

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.true
    })

    it('tests accounting for pre-execution cancellation', async function() {
        const requestData = await parseRequestData(txRequest)

        const cancelAt = requestData.schedule.windowStart - requestData.schedule.freezePeriod - 3

        expect(cancelAt)
        .to.be.above(await config.web3.eth.getBlockNumber())

        expect(requestData.meta.owner)
        .to.equal(Owner)
        
        expect(requestData.meta.isCancelled)
        .to.be.false 

        await waitUntilBlock(0, cancelAt)

        const balanceBeforeCancel = await config.web3.eth.getBalance(accounts[1])
        const contractBalanceBefore = await config.web3.eth.getBalance(txRequest.address)

        const cancelTx = await txRequest.cancel({
            from: Owner // TODO: this throws if set to another account
        })
        expect(cancelTx.receipt)
        .to.exist 

        const balanceAfterCancel = await config.web3.eth.getBalance(accounts[1])
        const contractBalanceAfter = await config.web3.eth.getBalance(txRequest.address)

        expect((await parseRequestData(txRequest)).meta.isCancelled)
        .to.be.true 

        /// TODO: Get cancel data

        console.log(balanceBeforeCancel)
        console.log(balanceAfterCancel)
        console.log(contractBalanceBefore)
        console.log(contractBalanceAfter)
    })

    // /// TODO
    // it('tests accounting for missed execution cancellation by owner', async function() {
    //     const cancelAt = windowStart + executionWindow + 1

    //     /// Sanity checks
    //     assert(cancelAt > await config.web3.eth.getBlockNumber())

    //     const requestData = await transactionRequest.requestData()
    //     const logs = requestData.logs.find(e => e.event === 'RequestData')
    //     // requestData.meta.isCancelled === false
    //     assert(logs.args.bools[0] === false)
    //     // requestData.meta.owner === Owner
    //     assert(logs.args.addressArgs[2] === Owner)

    //     /// Get the balances before the cancellation calls
    //     const beforeCancelBal = await config.web3.eth.getBalance(Owner)
    //     const beforeContractBal = await config.web3.eth.getBalance(transactionRequest.address)

    //     /// Wait until the cancellation block and cancel the transaction
    //     await waitUntilBlock(0, cancelAt)
    //     const cancelTx = await transactionRequest.cancel({from: Owner})
    //     expect(cancelTx.receipt).to.exist 

    //     /// Get the balances after the cancellation calls
    //     const afterCancelBal = await config.web3.eth.getBalance(Owner)
    //     const afterContractBal = await config.web3.eth.getBalance(transactionRequest.address)

    //     const updatedRequestData = await transactionRequest.requestData()
    //     const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
    //     // isCancelled === true
    //     assert(updatedLogs.args.bools[0] === true)

    //     // console.log(beforeCancelBal, afterCancelBal)
    //     // console.log(beforeContractBal, afterContractBal)

    // })

    // /// TODO
    // it('tests accounting for missed execution cancellation not by owner', async function() {
    //     const cancelAt = windowStart + executionWindow + 1

    //     /// Sanity checks
    //     assert(cancelAt > await config.web3.eth.getBlockNumber())
        
    //     const requestData = await transactionRequest.requestData()
    //     const logs = requestData.logs.find(e => e.event === 'RequestData')
    //     // requestData.meta.isCancelled === false
    //     assert(logs.args.bools[0] === false)
    //     // requestData.meta.owner === Owner
    //     assert(logs.args.addressArgs[2] === Owner)

    //     /// Get the balances before the cancellation calls
    //     const beforeCancelBal = await config.web3.eth.getBalance(Owner)
    //     const beforeContractBal = await config.web3.eth.getBalance(transactionRequest.address)

    //     /// Wait until the cancellation block and cancel the transaction
    //     await waitUntilBlock(0, cancelAt)
    //     const cancelTx = await transactionRequest.cancel({from: Owner})
    //     expect(cancelTx.receipt).to.exist 

    //     /// Get the balances after the cancellation calls
    //     const afterCancelBal = await config.web3.eth.getBalance(Owner)
    //     const afterContractBal = await config.web3.eth.getBalance(transactionRequest.address)

    // })
})