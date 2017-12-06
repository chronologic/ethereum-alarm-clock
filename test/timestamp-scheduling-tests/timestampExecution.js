require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect 

// Contracts
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')

// Bring in config.web3 (v1.0.0)
const config = require('../../config')
const ethUtil = require('ethereumjs-util')
const { parseRequestData, parseAbortData, wasAborted } = require('../dataHelpers.js')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)

const MINUTE = 60 //seconds
const HOUR = 60*MINUTE 
const DAY = 24*HOUR 

contract('Timestamp execution', async function(accounts) {

    let txRecorder 
    let txRequest
    
    /// Constant variables we need in each test
    const claimWindowSize = 5*MINUTE 
    const freezePeriod = 2*MINUTE
    const reservedWindowSize = 1*MINUTE
    const executionWindow = 2*MINUTE

    beforeEach(async function() {
        const curBlock = await config.web3.eth.getBlock('latest')
        const timestamp = curBlock.timestamp 

        const windowStart = timestamp + DAY        

        /// Deploy a fresh transactionRecorder
        txRecorder = await TransactionRecorder.new()
        expect(txRecorder.address, 'transactionRecorder should be fresh for each test').to.exist

        /// Make a transactionRequest
        txRequest = await TransactionRequest.new(
            [
                accounts[0], //createdBy
                accounts[0], //owner
                accounts[1], //donationBenefactor
                txRecorder.address //toAddress
            ], [
                0, //donation
                0, //payment
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                2, // temporalUnit
                executionWindow,
                windowStart,
                2000000, //callGas
                0  //callValue
            ],
            'some-call-data-goes-here'
        )

        const firstClaimStamp = windowStart - freezePeriod - claimWindowSize

        /// Should claim a transaction before each test
        const secondsToWait = firstClaimStamp - timestamp
        await waitUntilBlock(secondsToWait, 0)

        const claimTx = await txRequest.claim({from: accounts[1], value: config.web3.utils.toWei(1)})
        expect(claimTx.receipt)
        .to.exist
    })

    /////////////
    /// Tests ///
    /////////////

    it('should reject execution if its before the execution window', async function() {
        const requestData = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.false 

        expect(requestData.meta.wasCalled)
        .to.be.false 

        expect((await config.web3.eth.getBlock('latest')).timestamp)
        .to.be.below(requestData.schedule.windowStart)

        const executeTx = await txRequest.execute({from: accounts[1], gas: 3000000})

        const requestDataRefresh = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.false 

        expect(requestDataRefresh.meta.wasCalled)
        .to.be.false 

        expect(wasAborted(executeTx))
        .to.be.true 

        expect(parseAbortData(executeTx).find(reason => reason === 'BeforeCallWindow'))
        .to.exist
    })

    it('should reject execution if its after the execution window', async function() {
        const requestData = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.false 

        expect(requestData.meta.wasCalled)
        .to.be.false 

        const endExecutionWindow = requestData.schedule.windowStart + requestData.schedule.windowSize
        const secsToWait = endExecutionWindow - (await config.web3.eth.getBlock('latest')).timestamp 

        await waitUntilBlock(secsToWait + 1, 1)

        const executeTx = await txRequest.execute({from: accounts[1], gas: 3000000})

        const requestDataRefresh = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.false 

        expect(requestDataRefresh.meta.wasCalled)
        .to.be.false 

        expect(wasAborted(executeTx))
        .to.be.true 

        expect(parseAbortData(executeTx).find(reason => reason === 'AfterCallWindow'))
        .to.exist
    })

    it('should allow execution at the start of the execution window', async function() {
        const requestData = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.false 

        expect(requestData.meta.wasCalled)
        .to.be.false 

        const startExecutionWindow = requestData.schedule.windowStart 
        const secsToWait = startExecutionWindow - (await config.web3.eth.getBlock('latest')).timestamp 
        await waitUntilBlock(secsToWait, 1)

        const executeTx = await txRequest.execute({from: accounts[1], gas: 3000000})

        const requestDataRefresh = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.true 

        expect(requestDataRefresh.meta.wasCalled)
        .to.be.true 
    })

    it('should allow execution at the end of the execution window', async function() {
        const requestData = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.false 

        expect(requestData.meta.wasCalled)
        .to.be.false 

        const endExecutionWindow = requestData.schedule.windowStart + requestData.schedule.windowSize 
        const secsToWait = endExecutionWindow - (await config.web3.eth.getBlock('latest')).timestamp 
        await waitUntilBlock(secsToWait - 1, 1)

        const executeTx = await txRequest.execute({from: accounts[1], gas: 3000000})
        expect(executeTx.receipt)
        .to.exist 

        const requestDataRefresh = await parseRequestData(txRequest)

        expect(await txRecorder.wasCalled())
        .to.be.true 

        expect(requestDataRefresh.meta.wasCalled)
        .to.be.true 
    })
})