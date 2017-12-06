require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect
    
/// Contracts
const BlockScheduler        = artifacts.require('./BlockScheduler.sol')
const RequestFactory        = artifacts.require('./RequestFactory.sol')
const RequestTracker        = artifacts.require('./RequestTracker.sol')
const TransactionRecorder   = artifacts.require('./TransactionRecorder.sol')
const TransactionRequest    = artifacts.require('./TransactionRequest.sol')

/// Brings in config.web3 (v1.0.0)
const config = require('../../config')
const { parseRequestData } = require('../dataHelpers.js')

const ethUtil = require('ethereumjs-util')

contract('Block scheduling', function(accounts) {
    const Owner = accounts[0]
    const User1 = accounts[1]
    const User2 = accounts[2]
    const gasPrice = 20000

    let blockScheduler
    let requestFactory
    let requestTracker
    let transactionRecorder

    const checkIsNotEmptyAddress = (address) => {
        if (address == '0x0000000000000000000000000000000000000000') {
            return false;
        }
        return true;
    }
    
    /////////////
    /// Tests ///
    /////////////

    it('should instantiate contracts', async function() {
        transactionRecorder = await TransactionRecorder.deployed()
        assert(checkIsNotEmptyAddress(transactionRecorder.address), 'Transaction Recorder was deployed.')

        requestTracker = await RequestTracker.deployed()
        assert(checkIsNotEmptyAddress(requestTracker.address), 'Request Tracker was deployed.')

        requestFactory = await RequestFactory.new(requestTracker.address)
        blockScheduler = await BlockScheduler.new(requestFactory.address)        

        /// Get the factory address
        const factoryAddress = await blockScheduler.factoryAddress()
        assert(checkIsNotEmptyAddress(factoryAddress), 'BlockScheduler is instantiated and linked to requestFactory.')
    })

    it('blockScheduler should arbitrarily accept payments sent to it', async function() {
        const balBefore = await config.web3.eth.getBalance(blockScheduler.address)        
        const tx = await blockScheduler.sendTransaction({
            from: Owner, 
            value: 1000
        })
        
        const balAfter = await config.web3.eth.getBalance(blockScheduler.address)
        assert(balBefore < balAfter, 'It sent 1000 wei correctly.')
    })

    it('should do block scheduling with `scheduleTxSimple`', async function() {
        const curBlockNum = await config.web3.eth.getBlockNumber()
        const windowStart = curBlockNum + 20
        const testData32 = ethUtil.bufferToHex(
            Buffer.from('A1B2'.padEnd(32, 'FF'))
        )

        /// Now let's send it an actual transaction
        const scheduleTx = await blockScheduler.scheduleTxSimple(
            transactionRecorder.address,
            testData32,     //callData
            [
                1212121,      //callGas
                123454321,     //callValue
                255,        //windowSize
                windowStart,
                gasPrice

            ],
            {from: accounts[0], value: config.web3.utils.toWei(20)}
        )

        expect(scheduleTx.receipt)
        .to.exist

        expect(scheduleTx.receipt.gasUsed)
        .to.be.below(3000000)

        // Let's get the logs so we can find the transaction request address.
        const logNewRequest = scheduleTx.logs.find(e => e.event === 'NewRequest')

        expect(logNewRequest.args.request, "Couldn't find the `NewRequest` log in receipt...")
        .to.exist

        const txRequest = await TransactionRequest.at(logNewRequest.args.request)
        const requestData = await parseRequestData(txRequest)
        
        expect(requestData.txData.toAddress)
        .to.equal(transactionRecorder.address)

        expect(await txRequest.callData())
        .to.equal(testData32)

        expect(requestData.schedule.windowSize)
        .to.equal(255)

        expect(requestData.txData.callGas)
        .to.equal(1212121)

        expect(requestData.schedule.windowStart)
        .to.equal(windowStart)
    })

    it('should do block scheduling with `scheduleTxFull`', async function() {
        const curBlockNum = await config.web3.eth.getBlockNumber()
        const windowStart = curBlockNum + 20
        const testData32 = ethUtil.bufferToHex(
            Buffer.from('A1B2'.padEnd(32, 'FF'))
        )

        /// Now let's send it an actual transaction
        const scheduleTx = await blockScheduler.scheduleTxFull(
            transactionRecorder.address,
            testData32,     //callData
            [
                1212121,    //callGas
                123454321,  //callValue
                54321,      //windowSize
                windowStart,
                gasPrice,
                98765,      //donation
                80008,      //payment
            ],
            {from: accounts[0], value: config.web3.utils.toWei(10)}
        )

        expect(scheduleTx.receipt)
        .to.exist

        expect(scheduleTx.receipt.gasUsed)
        .to.be.below(3000000)

        // Let's get the logs so we can find the transaction request address.
        const logNewRequest = scheduleTx.logs.find(e => e.event === 'NewRequest')

        expect(logNewRequest.args.request)
        .to.exist

        const txRequest = await TransactionRequest.at(logNewRequest.args.request)
        const requestData = await parseRequestData(txRequest)

        expect(requestData.txData.toAddress)
        .to.equal(transactionRecorder.address)

        expect(await txRequest.callData())
        .to.equal(testData32)

        expect(requestData.schedule.windowSize)
        .to.equal(54321)

        expect(requestData.txData.callGas)
        .to.equal(1212121)

        expect(requestData.paymentData.donation)
        .to.equal(98765)

        expect(requestData.paymentData.payment)
        .to.equal(80008)

        expect(requestData.schedule.windowStart)
        .to.equal(windowStart)
    })

    // This test fails because the call gas is too high
    it('should revert on invalid transaction', async function() {
        const curBlockNum = await config.web3.eth.getBlockNumber()
        const windowStart = curBlockNum + 20

        await blockScheduler.scheduleTxSimple(
            transactionRecorder.address,
            'this-is-the-call-data',
            [
                4e20, //callGas set crazy high
                123454321, //callValue
                0, //windowSize
                windowStart
            ],
            {from: User2, value: config.web3.utils.toWei(10)}
        ).should.be.rejectedWith('VM Exception while processing transaction: revert')
    })
})
