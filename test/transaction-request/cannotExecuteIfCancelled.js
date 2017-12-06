require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect

/// Contracts
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Bring in config.web3 (v1.0.0)
const config = require('../../config')
const { parseRequestData, parseAbortData, wasAborted } = require('../dataHelpers.js')
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

        const txRecorder = await TransactionRecorder.new()

        const txRequest = await TransactionRequest.new(
            [
                Owner, //createdBy
                Owner, //owner
                accounts[1], //donationBenefactor
                txRecorder.address //toAddress
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
        const requestData = await parseRequestData(txRequest)         

        expect(await txRecorder.wasCalled())
        .to.be.false 

        expect(requestData.meta.wasCalled)
        .to.be.false 

        expect(requestData.meta.isCancelled)
        .to.be.false

        const cancelTx = await txRequest.cancel({from: Owner})
        expect(cancelTx.receipt).to.exist

        const requestDataRefresh = await parseRequestData(txRequest) 

        expect(requestDataRefresh.meta.isCancelled)
        .to.be.true

        await waitUntilBlock(0, windowStart)

        const executeTx = await txRequest.execute({gas: 3000000})

        const requestDataRefreshTwo = await parseRequestData(txRequest)
        
        expect(await txRecorder.wasCalled())
        .to.be.false

        expect(requestDataRefreshTwo.meta.wasCalled)
        .to.be.false

        expect(wasAborted(executeTx))
        .to.be.true 

        expect(parseAbortData(executeTx).find(reason => reason === 'WasCancelled'))
        .to.exist 
    })
})