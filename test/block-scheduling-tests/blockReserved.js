require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Brings in config.web3 (v1.0.0)
const config = require('../../config');
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

contract('Block reserved window', async function(accounts) {

    it('should reject execution if claimed by another', async function() {
        let curBlock = await config.web3.eth.getBlockNumber()
        let windowStart = curBlock + 38
        let executionWindow = 10

        let txRequest = await TransactionRequest.new(
            [
                accounts[0], //created by
                accounts[0], //owner
                accounts[1], //donation benefactor
                accounts[7]  // to
            ], [
                0, //donation
                0, //payment
                25,//claim window size
                5, //freeze period
                10,//reserved window size
                1, // temporal unit... 1= block, 2=timestamp
                executionWindow,
                windowStart,
                120000, //callGas
                0 //callValue
            ],
            'this-is-the-call-data'
        )

        let firstClaimBlock  = windowStart - 5 - 25
        await waitUntilBlock(0, firstClaimBlock)

        /// Claim it from account[9]
        let claimTx = await txRequest.claim({from: accounts[9], value: config.web3.utils.toWei(1)})

        /// Search for the claimed function and expect it to exist.
        let claimed = claimTx.logs.find(e => e.event === 'Claimed')
        expect(claimed).to.exist

        await waitUntilBlock(0, windowStart)

        /// Now let's try to execute it from a third party account
        await txRequest.execute({from: accounts[3], gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')

        /// That shouldn't work, because accounts[4] claimed it...
        /// But this should!
        let executeTx = await txRequest.execute({from: accounts[9], gas: 3000000})

        /// Find the logs to prove it.
        let executed = executeTx.logs.find(e => e.event === 'Executed')
        expect(executed).to.exist
    })
})