require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect 

/// Contracts
const RequestFactory = artifacts.require('./RequestFactory.sol')
const RequestTracker = artifacts.require('./RequestTracker.sol')
const TimestampScheduler = artifacts.require('./TimestampScheduler.sol')

/// Brings in config.web3
const config = require('../config')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3) // just pass truffle web3


contract('Timestamp Scheduler', async function(accounts) {

    const MINUTE = 60 //seconds
    const testData32 = "32".padEnd(32, "AF01")

    let requestFactory
    let requestTracker 
    let timestampScheduler 

    /// Deploy a fresh instance of contracts for each test.
    beforeEach(async function() {

        // Request tracker
        requestTracker = await RequestTracker.new()
        expect(requestTracker.address).to.exist 

        // Request factory
        requestFactory = await RequestFactory.new(requestTracker.address)
        expect(requestFactory.address).to.exist 

        // Timestamp scheduler
        timestampScheduler = await TimestampScheduler.new(requestFactory.address)
        expect(timestampScheduler.address).to.exist
    })

    it('successfully timestamp schedules using `scheduleTxSimple`', async function() {
        const curBlock = await config.web3.eth.getBlock('latest')
        const timestamp = curBlock.timestamp 

        const windowStart = timestamp + 10*MINUTE

        let scheduleTx = await timestampScheduler.scheduleTxSimple(accounts[4],
                                                                   testData32,
                                                                   [
                                                                       4e15, //callGas
                                                                       123123, //callValue
                                                                       55*MINUTE, //windowSize
                                                                       windowStart
                                                                   ],
                                                                //    {from: accounts[0], value: config.web3.utils.toWei(10)}
                                                                   )
        expect(scheduleTx.receipt).to.exist

        // Dig the logs out for proof
        const event = scheduleTx.logs.find(e => e.event === 'NewRequest')
        expect(event.args.request).to.exist 
    })

    it('successfully timestamp schedules using `scheduleTxFull', async function() {
        const curBlock = await config.web3.eth.getBlock('latest')
        const timestamp = curBlock.timestamp 

        const windowStart = timestamp + 10*MINUTE
        const donation = config.web3.utils.toWei(1)
        const payment = config.web3.utils.toWei(2)

        let scheduleTx = await timestampScheduler.scheduleTxSimple(accounts[4],
                                                                   testData32,
                                                                   [
                                                                       4e15, //callGas
                                                                       123123, //callValue
                                                                       donation,
                                                                       payment,
                                                                       55*MINUTE, //windowSize
                                                                       windowStart
                                                                   ],
                                                                //    {from: accounts[0], value: config.web3.utils.toWei(10)}
                                                                   )
        expect(scheduleTx.receipt).to.exist

        // Dig the logs out for proof
        const event = scheduleTx.logs.find(e => e.event === 'NewRequest')
        expect(event.args.request).to.exist 
    })

    it('should revert an invalid transaction', async function() {
        const curBlock = await config.web3.eth.getBlock('latest')
        const timestamp = curBlock.timestamp 

        const windowStart = timestamp + 10*MINUTE

        let scheduleTx = await timestampScheduler.scheduleTxSimple(accounts[4],
                                                                   testData32,
                                                                   [
                                                                       4e15, //callGas
                                                                       123123, //callValue
                                                                       55*MINUTE, //windowSize
                                                                       windowStart
                                                                   ],
                                                                   {from: accounts[0], value: config.web3.utils.toWei(10)}
                                                                   )
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

})
