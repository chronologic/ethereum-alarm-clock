require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect 

// Contracts
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

// Bring in config.web3 
const config = require('../../config')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)

const MINUTE = 60 //seconds
const HOUR = 60*MINUTE 
const DAY = 24*HOUR 

contract('Timestamp execution', async function(accounts) {

    let transactionRecorder 
    let transactionRequest

    let firstClaimStamp
    let lastClaimStamp
    let timestamp
    
    /// Constant variables we need in each test
    const claimWindowSize = 5*MINUTE 
    const freezePeriod = 2*MINUTE
    const reservedWindowSize = 1*MINUTE
    const executionWindow = 2*MINUTE

    beforeEach(async function() {
        const curBlock = await config.web3.eth.getBlock('latest')
        timestamp = curBlock.timestamp 

        const windowStart = timestamp + DAY        

        /// Deploy a fresh transactionRecorder
        transactionRecorder = await TransactionRecorder.new()
        expect(transactionRecorder.address, 'transactionRecorder should be fresh for each test').to.exist

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
                43324, //callGas
                12345  //callValue
            ],
            'some-call-data-goes-here'
        )

        firstClaimStamp = windowStart - freezePeriod - claimWindowSize
        lastClaimStamp = windowStart - freezePeriod - 1

        /// Should claim a transaction before each test
        const secondsToWait = firstClaimStamp - timestamp
        await waitUntilBlock(secondsToWait, 0)

    })

    /////////////
    /// Tests ///
    /////////////

    it('should reject execution if its before the execution window', async function() {
        /// Wait until just shy of the freeze period.
        const secondsToWait = claimWindowSize
        await waitUntilBlock(secondsToWait, 0)

        await transactionRequest.execute({from: accounts[1], gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('should reject execution if its after the execution window', async function() {
        // Wait for over the entire execution window
        const secondsToWait = freezePeriod + claimWindowSize + executionWindow +1
        await waitUntilBlock(secondsToWait, 0)

        await transactionRequest.execute({from: accounts[1], gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('should allow execution at the start of the execution window', async function() {
        const secondsToWait = freezePeriod + claimWindowSize + 1
        await waitUntilBlock(secondsToWait, 0)
        
        const executeTx = await transactionRequest.execute({from: accounts[1], gas: 3000000})
        const execute = executeTx.logs.find(e => e.event === 'Executed')
        expect(execute, 'should have fired off the execute log').to.exist
    })

    it('should allow execution at the end of the execution window', async function() {
        const secondsToWait = freezePeriod + claimWindowSize + executionWindow -1
        await waitUntilBlock(secondsToWait, 0)

        const executeTx = await transactionRequest.execute({from: accounts[1], gas: 3000000})
        const execute = executeTx.logs.find(e => e.event === 'Executed')
        expect(execute, 'should have fired off the execute log').to.exist
    })
})