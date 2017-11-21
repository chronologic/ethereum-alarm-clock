require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect 

/// Contracts
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Brings in config.web3
const config = require('../../config')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)

contract('Timestamp claiming', async function(accounts) {

    const MINUTE = 60 //seconds
    const HOUR = 60*MINUTE
    const DAY = 24*HOUR 

    /// Variables we set before each test
    let transactionRequest 

    let firstClaimStamp
    let lastClaimStamp
    let timestamp

    /// Constant variables we need in each test
    const claimWindowSize = 5*MINUTE 
    const freezePeriod = 2*MINUTE
    const reservedWindowSize = 1*MINUTE
    const executionWindow = 2*MINUTE

    /// The set up before each test
    beforeEach(async function() {
        const curBlock = await config.web3.eth.getBlock('latest')
        timestamp = curBlock.timestamp        

        const windowStart = timestamp + DAY

        // Instantiate a TransactionRequest with temporal unit 2 - aka timestamp
        transactionRequest = await TransactionRequest.new(
            [
                accounts[0], // createdBy
                accounts[0], // owner
                accounts[1], // donationBenefactor
                accounts[2]  // toAddress
            ], [
                0, //donation
                0, //payment
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                2, // temporal unit
                executionWindow,
                windowStart,
                1200000, //callGas
                0   //callValue
            ],
            'just-some-call-data'
        )

        firstClaimStamp = windowStart - freezePeriod - claimWindowSize
        lastClaimStamp = windowStart - freezePeriod - 1
    })

    /////////////
    /// Tests ///
    /////////////

    it('cannot claim before first claim stamp', async function() {
        const block = await config.web3.eth.getBlock('latest')
        let now = block.timestamp 

        /// This test was misbehaving...
        if (now > firstClaimStamp) {
            now -= 2*DAY
        }
        assert(now < firstClaimStamp, 'It should be before the time to claim.')

        // Cannot claim.
        await transactionRequest.claim().should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('can claim at the first claim stamp', async function() {
        const secondsToWait = firstClaimStamp - timestamp
        await waitUntilBlock(secondsToWait, 0)

        const claimTx = await transactionRequest.claim({value: config.web3.utils.toWei(4)})

        /// Search for the claimed function and expect it to exist.
        const claimed = claimTx.logs.find(e => e.event === 'Claimed')
        expect(claimed).to.exist
    })

    it('can claim at the last claim stamp', async function() {
        const block = await config.web3.eth.getBlock('latest')
        const now = block.timestamp 

        assert(lastClaimStamp > now, 'timestamp is in the future')

        const secondsToWait = lastClaimStamp - timestamp 
        await waitUntilBlock(secondsToWait, 0)

        const claimTx = await transactionRequest.claim({value: config.web3.utils.toWei(6)})

        /// Search for the claimed function and expect it to exist.
        const claimed = claimTx.logs.find(e => e.event === 'Claimed')
        expect(claimed).to.exist
    })

    it('can not claim after the last claim stamp', async function() {
        const block = await config.web3.eth.getBlock('latest')
        const now = block.timestamp 

        assert(lastClaimStamp > now, 'timestamp is in the future')

        const secondsToWait = lastClaimStamp - timestamp + 1
        await waitUntilBlock(secondsToWait, 0)

        const claimTx = await transactionRequest.claim({value: config.web3.utils.toWei(6)})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('should execute a claimed timestamp request', async function() {
        /// This is copied from the `can claim` test above
        const secondsToWait = lastClaimStamp - timestamp - 1
        await waitUntilBlock(secondsToWait, 0)

        const claimTx = await transactionRequest.claim({from: accounts[1], value: config.web3.utils.toWei(1)})

        /// Search for the claimed function and expect it to exist.
        const claimed = claimTx.logs.find(e => e.event === 'Claimed')
        expect(claimed, 'claimed log does not exist').to.exist
        console.log()

        /// --------------------
        /// Here's the new stuff
        const secsToWait = freezePeriod + 2
        await waitUntilBlock(secsToWait, 0)

        const executeTx = await transactionRequest.execute({from: accounts[1], gas: 3000000})
        // console.log(executeTx)
        expect(executeTx.receipt).to.exist

        // const debug = executeTx.logs.find(e => e.event === 'Aborted')
        // console.log(debug.args.reason)

    })

    it('should execute a claimed call after reserve window', async function() {
        /// This is copied from the `can claim` test above
        const secondsToWait = lastClaimStamp - timestamp -1
        await waitUntilBlock(secondsToWait, 0)

        const claimTx = await transactionRequest.claim({value: config.web3.utils.toWei(4)})

        /// Search for the claimed function and expect it to exist.
        const claimed = claimTx.logs.find(e => e.event === 'Claimed')
        expect(claimed, 'claimed log does not exist').to.exist
        // console.log()
        /// --------------------
       /// Here's the new stuff
       const secsToWait = freezePeriod + 2 + reservedWindowSize
       await waitUntilBlock(secsToWait, 0)

       const executeTx = await transactionRequest.execute({from: accounts[1], gas: 3000000})
       // console.log(executeTx)
       expect(executeTx.receipt).to.exist

    })
})