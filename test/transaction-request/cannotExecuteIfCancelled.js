require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect

/// Contracts
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Bring in config.web3 (v1.0.0)
const config = require('../../config')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
const toBN = config.web3.utils.toBN 

contract('tests execution rejected if cancelled', async function(accounts) {

    it('will reject the execution if it was cancelled', async function() {
        const Owner = accounts[0]

        /// TransactionRequest constants
        const claimWindowSize = 25 //blocks
        const freezePeriod = 5 //blocks
        const reservedWindowSize = 10 //blocks
        const executionWindow = 10 //blocks
        
        const curBlockNum = await config.web3.eth.getBlockNumber()
        const windowStart = curBlockNum + 38

        const transactionRecorder = await TransactionRecorder.new()

        const transactionRequest = await TransactionRequest.new(
            [
                Owner, //createdBy
                Owner, //owner
                accounts[1], //donationBenefactor
                transactionRecorder.address //toAddress
            ], [
                0, //donation
                0, //payment
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                1, //temporalUnit = 1, aka blocks
                executionWindow,
                windowStart,
                2000000, //callGas
                0 //callValue
            ],
            'some-call-data-could-be-anything'
        )

        const wasCalled = await transactionRecorder.wasCalled()
        assert(wasCalled === false)

        const requestData = await transactionRequest.requestData()
        const logs = requestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === false
        assert(logs.args.bools[0] === false)
        // requestData.meta.wasCalled === false
        assert(logs.args.bools[1] === false)

        const cancelTx = await transactionRequest.cancel({from: Owner})
        expect(cancelTx.receipt).to.exist

        const updatedRequestData = await transactionRequest.requestData()
        const updatedLogs = updatedRequestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.isCancelled === true
        assert(updatedLogs.args.bools[0] === true)

        await waitUntilBlock(0, windowStart)

        const executeTx = await transactionRequest.execute({gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
        /// TODO: Either change the smart contracts to revert the transaction or
        ///       pull out the logs here and check the abort reason.
        
        const mostUpdatedRequestData = await transactionRequest.requestData()
        const mostUpdatedLogs = mostUpdatedRequestData.logs.find(e => e.event === 'RequestData')
        // requestData.meta.wasCalled === false
        assert(mostUpdatedLogs.args.bools[1] === false)

        const updatedWasCalled = await transactionRecorder.wasCalled()
        assert(updatedWasCalled === false)
    })
})