require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Brings in config.web3...
const config = require("../../config");

const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

const MINUTE = 60 //seconds

contract('Block reserved window', async function(accounts) {
    it('should reject execution if claimed by another', async function() {
        let curBlock = await config.web3.eth.getBlock('latest')
        let timestamp = curBlock.timestamp

        let windowStart = timestamp + (5 * MINUTE)
        let executionWindow = 2 * MINUTE 
        let freezePeriod = 1 * MINUTE
        let claimWindowSize = 2 * MINUTE

        let txRequest = await TransactionRequest.new(
            [
                accounts[0], //created by
                accounts[0], //owner
                accounts[1], //donation benefactor
                accounts[7]  // to
            ], [
                0, //donation
                0, //payment
                claimWindowSize,//claim window size
                freezePeriod, //freeze period
                1 * MINUTE,//reserved window size
                2, // temporal unit... 1= block, 2=timestamp
                executionWindow,
                windowStart,
                300000, //callGas
                12345 //callValue
            ],
            'this-is-the-call-data'
        )

        let firstClaimTimestamp  = windowStart - freezePeriod - claimWindowSize
        await waitUntilBlock((firstClaimTimestamp - timestamp), 0)

        // Claim it from account[4]
        let claimTx = await txRequest.claim({from: accounts[4], value: config.web3.utils.toWei(2)})

        /// Search for the claimed function and expect it to exist.
        let claimed = claimTx.logs.find(e => e.event === "Claimed")
        expect(claimed).to.exist

        await waitUntilBlock((claimWindowSize + freezePeriod), 0)

        /// Now let's try to execute it from a third party account
        await txRequest.execute({from: accounts[3], gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')

        /// That shouldn't work, because accounts[4] claimed it...
        /// But this should!
        let executeTx = await txRequest.execute({from: accounts[4], gas: 3000000})

        // /// Find the logs to prove it.
        // let executed = executeTx.logs.find(e => e.event === "Executed")
        // expect(executed).to.exist
    })
})