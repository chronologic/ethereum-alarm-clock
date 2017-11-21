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

contract('Test already executed', async function(accounts) {
    it('rejects execution if already executed', async function() {

        /// Deploy a fresh transactionRecorder
        transactionRecorder = await TransactionRecorder.new()
        expect(transactionRecorder.address, 'transactionRecorder should be fresh for each test').to.exist

        const MINUTE = 60 //seconds
        const HOUR  = 60*MINUTE
        const DAY = 24*HOUR

        const claimWindowSize = 5*MINUTE 
        const freezePeriod = 2*MINUTE
        const reservedWindowSize = 1*MINUTE
        const executionWindow = 2*MINUTE
        
        const curBlock = await config.web3.eth.getBlock('latest')
        const timestamp = curBlock.timestamp 

        const windowStart = timestamp + DAY        

        /// Make a transactionRequest
        transactionRequest = await TransactionRequest.new(
            [
                accounts[0], //createdBy
                accounts[0], //owner
                accounts[1], //donationBenefactor
                transactionRecorder.address //toAddress
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

        const wasCalled = await transactionRecorder.wasCalled()
        expect(wasCalled).to.be.false

        /// Should claim a transaction before each test
        const secondsToWait = windowStart - timestamp
        await waitUntilBlock(secondsToWait, 0)

        const executeTx = await transactionRequest.execute({from: accounts[1], gas: 3000000})
        // console.log(executeTx)
        const execute = executeTx.logs.find(e => e.event === 'Executed')
        expect(execute, 'should have fired off the execute log').to.exist

        const wasCalledAfter = await transactionRecorder.wasCalled()
        // console.log(wasCalledAfter)        
        expect(wasCalledAfter).to.be.true 

        /// Now try to duplicate the call
        const executeTx2 = await transactionRequest.execute({from: accounts[1], gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })
})