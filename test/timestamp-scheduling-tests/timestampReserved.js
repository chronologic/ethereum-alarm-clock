require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')

/// Brings in config.web3 (v1.0.0)
const config = require('../../config');
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

const MINUTE = 60 //seconds
const HOUR = 60*MINUTE 
const DAY = 24*HOUR

contract('Timestamp reserved window', async function(accounts) {

    it('should reject execution if claimed by another', async function() {
        // const block = await config.web3.eth.getBlock('latest')
        // const timestamp = block.timestamp

        // const windowStart = timestamp + DAY
        // const executionWindow = 2 * MINUTE 
        // const freezePeriod = 2 * MINUTE
        // const claimWindowSize = 5 * MINUTE
        // const reservedWindowSize = 1*MINUTE

        // const transactionRequest = await TransactionRequest.new(
        //     [
        //         accounts[0], // createdBy
        //         accounts[0], // owner
        //         accounts[1], // donationBenefactor
        //         accounts[2]  // toAddress
        //     ], [
        //         0, //donation
        //         0, //payment
        //         claimWindowSize,
        //         freezePeriod,
        //         reservedWindowSize,
        //         2, // temporal unit
        //         executionWindow,
        //         windowStart,
        //         1200000, //callGas
        //         0   //callValue
        //     ],
        //     'just-some-call-data'
        // )

        // const lastClaimStamp = windowStart - freezePeriod - 1
        // const secondsToWait = lastClaimStamp - timestamp
        // await waitUntilBlock(secondsToWait, 0)

        // // Claim it from account[8]
        // const claimTx = await transactionRequest.claim({from: accounts[8], value: config.web3.utils.toWei(1)})

        // /// Search for the claimed function and expect it to exist.
        // const claimed = claimTx.logs.find(e => e.event === 'Claimed')
        // expect(claimed).to.exist

        // const secondsToWaitAgain = claimWindowSize + 2
        // await waitUntilBlockl(secondsToWaitAgain, 0)

        // /// Now let's try to execute it from a third party account
        // await transactionRequest.execute({from: accounts[3], gas: 3000000})
        //     .should.be.rejectedWith('VM Exception while processing transaction: revert')

        // /// That shouldn't work, because accounts[8] claimed it...
        // /// But this should!
        // const executeTx = await transactionRequest.execute({from: accounts[8], gas: 3000000})

        // // /// Find the logs to prove it.
        // const executed = executeTx.logs.find(e => e.event === 'Executed')
        // expect(executed).to.exist
    })
})