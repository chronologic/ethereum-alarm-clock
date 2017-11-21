require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect 

/// Contracts
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Bring in config.web3 (v1.0.0)
const config = require("../../config")
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
const toBN = config.web3.utils.toBN

contract('Cancelling', async function(accounts) {
    const Owner = accounts[0]

    let transactionRequest 

    /// TransactionRequest constants
    const claimWindowSize = 25 //blocks
    const freezePeriod = 5 //blocks
    const reservedWindowSize = 10 //blocks
    const executionWindow = 10 //blocks
    let windowStart
    let firstClaimBlock

    beforeEach(async function() {
        const curBlockNum = await config.web3.eth.getBlockNumber()
        windowStart = curBlockNum + 38

        transactionRequest = await TransactionRequest.new(
            [
                Owner, //createdBy
                Owner, //owner
                accounts[1], //donationBenefactor
                accounts[3] //toAddress
            ], [
                0, //donation
                0, //payment
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                1, //temporalUnit = 1, aka blocks
                executionWindow,
                windowStart,
                43324, //callGas
                12345 //callValue
            ],
            'some-call-data-could-be-anything'
        )

        firstClaimBlock = windowStart - freezePeriod - claimWindowSize
    })

    /////////////
    /// Tests ///
    /////////////

    it('tests cancelling before the claim window', async function() {
        const cancelAt = firstClaimBlock - 3

        /// Some sanity checks
        assert(cancelAt > await config.web3.eth.getBlockNumber())

        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await transactionRequest.cancel({from: Owner})
        expect(cancelTx.receipt).to.exist

        const updatedRequestData = await transactionRequest.requestData()
        const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === true
        assert(updatedLogs.args.bools[0] === true)
    })

    it('tests non-owner cannot cancel before the claim window', async function() {
        const cancelAt = firstClaimBlock - 3
        assert(cancelAt > await config.web3.eth.getBlockNumber())

        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await transactionRequest.cancel({from: accounts[6]})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('tests cancelling during claim window when unclaimed', async function() {
        const cancelAt = windowStart - freezePeriod -20
        assert(cancelAt > await config.web3.eth.getBlockNumber())

        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, cancelAt)


        const cancelTx = await transactionRequest.cancel({from: Owner})
        expect(cancelTx.receipt).to.exist

        const updatedRequestData = await transactionRequest.requestData()
        const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === true
        assert(updatedLogs.args.bools[0] === true)
    })

    it('tests not cancellable once claimed', async function() {
        const cancelAt = windowStart - freezePeriod -20
        const claimAt = cancelAt - 5

        assert(cancelAt > await config.web3.eth.getBlockNumber())
        
        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, claimAt)

        const claimTx = await transactionRequest.claim({value: config.web3.utils.toWei(2), from: accounts[1]})
        // console.log(claimTx)
        expect(claimTx.receipt).to.exist


        const updatedRequestData = await transactionRequest.requestData()
        const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
     
        /// The claim address should match up
        assert(updatedLogs.args.addressArgs[0] === accounts[1])

        /// Should revert
        const cancelTx = await transactionRequest.cancel({from: Owner})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('tests not cancellable during the freeze window', async function() {
        const cancelAt = windowStart - freezePeriod

        assert(cancelAt > await config.web3.eth.getBlockNumber())
        
        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await transactionRequest.cancel({from: Owner})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('tests not cancellable during the execution window', async function() {
        const cancelAt = windowStart 

        assert(cancelAt > await config.web3.eth.getBlockNumber())
        
        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await transactionRequest.cancel({from: Owner})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('tests not cancellable if was called', async function() {
        const executeAt = windowStart 
        const cancelAtFirst = windowStart + 10
        const cancelAtSecond = windowStart + executionWindow + 5

        assert(executeAt > await config.web3.eth.getBlockNumber())
        
        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, executeAt)

        const executeTx = await transactionRequest.execute({gas: 3000000})
        expect(executeTx.receipt).to.exist

        const afterExecuteRequestData = await transactionRequest.requestData()
        const afterExecutedLogs = afterExecuteRequestData.logs.find(e => e.event === 'RequestData')
        /// wasCalled === true
        assert(afterExecutedLogs.args.bools[1] === true)
        // isCancelled === false 
        assert(afterExecutedLogs.args.bools[0] === false)

        await waitUntilBlock(0, cancelAtFirst)

        const firstCancelTx = await transactionRequest.cancel({from: Owner})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')

        await waitUntilBlock(0, cancelAtSecond)

        const secondCancelTx = await transactionRequest.cancel({from: Owner})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('tests cancellable if call is missed', async function() {
        const cancelAt = windowStart + executionWindow + 10

        assert(cancelAt > await config.web3.eth.getBlockNumber())
        
        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, cancelAt)

        const cancelTx = await transactionRequest.cancel({from: Owner})

        const updatedRequestData = await transactionRequest.requestData()
        const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === true
        assert(updatedLogs.args.bools[0] === true)
    })

    /// TODO
    it('tests accounting for pre-execution cancellation', async function() {
        const cancelAt = windowStart - freezePeriod - 5

        assert(cancelAt > await config.web3.eth.getBlockNumber())
        
        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        await waitUntilBlock(0, cancelAt)

        const beforeCancelBal = await config.web3.eth.getBalance(Owner)
        const beforeContractBal = await config.web3.eth.getBalance(transactionRequest.address)

        const cancelTx = await transactionRequest.cancel({from: Owner})

        const afterCancelBal = await config.web3.eth.getBalance(Owner)
        const afterContractBal = await config.web3.eth.getBalance(transactionRequest.address)

        const updatedRequestData = await transactionRequest.requestData()
        const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
        // isCancelled === true
        assert(updatedLogs.args.bools[0] === true)

        // console.log(beforeCancelBal, afterCancelBal)
        // console.log(beforeContractBal, afterContractBal)
    })

    /// TODO
    it('tests accounting for missed execution cancellation by owner', async function() {
        const cancelAt = windowStart + executionWindow + 1

        /// Sanity checks
        assert(cancelAt > await config.web3.eth.getBlockNumber())

        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        /// Get the balances before the cancellation calls
        const beforeCancelBal = await config.web3.eth.getBalance(Owner)
        const beforeContractBal = await config.web3.eth.getBalance(transactionRequest.address)

        /// Wait until the cancellation block and cancel the transaction
        await waitUntilBlock(0, cancelAt)
        const cancelTx = await transactionRequest.cancel({from: Owner})
        expect(cancelTx.receipt).to.exist 

        /// Get the balances after the cancellation calls
        const afterCancelBal = await config.web3.eth.getBalance(Owner)
        const afterContractBal = await config.web3.eth.getBalance(transactionRequest.address)

        const updatedRequestData = await transactionRequest.requestData()
        const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
        // isCancelled === true
        assert(updatedLogs.args.bools[0] === true)

        // console.log(beforeCancelBal, afterCancelBal)
        // console.log(beforeContractBal, afterContractBal)

    })

    /// TODO
    it('tests accounting for missed execution cancellation not by owner', async function() {
        const cancelAt = windowStart + executionWindow + 1

        /// Sanity checks
        assert(cancelAt > await config.web3.eth.getBlockNumber())
        
        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.owner === Owner
        assert(logs.args.addressArgs[2] === Owner)

        /// Get the balances before the cancellation calls
        const beforeCancelBal = await config.web3.eth.getBalance(Owner)
        const beforeContractBal = await config.web3.eth.getBalance(transactionRequest.address)

        /// Wait until the cancellation block and cancel the transaction
        await waitUntilBlock(0, cancelAt)
        const cancelTx = await transactionRequest.cancel({from: Owner})
        expect(cancelTx.receipt).to.exist 

        /// Get the balances after the cancellation calls
        const afterCancelBal = await config.web3.eth.getBalance(Owner)
        const afterContractBal = await config.web3.eth.getBalance(transactionRequest.address)

    })
})