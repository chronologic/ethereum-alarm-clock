require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Bring in config.web3 (v1.0.0)
const config = require("../../config")
const { wait, waitUntilBlock } = require('@digix/tempo')(web3);

contract('Block execution', async function(accounts) {
    const Owner = accounts[0]
    const Benefactor = accounts[1]
    const ToAddress = accounts[2]

    let transactionRequest
    let transactionRecorder

    let curBlock // Holds the current block value before each test
    let firstClaimBlock
    let lastClaimBlock
    let executionWindow = 10
    let windowStart

    beforeEach(async function () {
        curBlock = await config.web3.eth.getBlockNumber()
        windowStart = curBlock + 38

        transactionRequest = await TransactionRequest.new(
            [
                Owner, //createdBy
                Owner, //owner
                Benefactor, //donationBenefactor
                ToAddress //toAddress
            ], [
                0, //donation
                0, //payment
                25, //claim window size
                5, //freeze period
                10, //reserved window size
                1, // temporal unit
                executionWindow, //window size
                windowStart, //windowStart
                300000, //callGas
                12345 //callValue
            ],
            'this-is-the-call-data'
        )

        /// The first claim block is the current block + the number of blocks
        ///  until the window starts, minus the freeze period minus claim window size.
        firstClaimBlock  = windowStart - 5 - 25
        /// The last claim block is the currenct block + the number of blocks
        ///  until the window starts, minus the freeze period minus 1
        lastClaimBlock = windowStart - 5 - 1  

        await waitUntilBlock(0, firstClaimBlock);
        
        let res = await transactionRequest.claim({value: config.web3.utils.toWei(1)})

        /// Search for the claimed function and expect it to exist.
        let claimed = res.logs.find(e => e.event === "Claimed")
        expect(claimed).to.exist
    })

    it('should reject the execution if its before the execution window', async function() {
        await waitUntilBlock(0, windowStart - 2)

        await transactionRequest.execute({gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('should reject the execution if its after the execution window', async function() {
        await waitUntilBlock(0, windowStart + executionWindow + 1)

        await transactionRequest.execute({gas: 3000000})
            .should.be.rejectedWith('VM Exception while processing transaction: revert')
    })

    it('should allow the execution at the start of the execution window', async function() {
        await waitUntilBlock(0, windowStart)

        let res = await transactionRequest.execute({gas: 3000000})
        let executed = res.logs.find(e => e.event === "Executed")
        expect(executed).to.exist
    })

    it('should allow the execution at the end of the execution window', async function() {
        await waitUntilBlock(0, windowStart + executionWindow -1)

        let res = await transactionRequest.execute({gas: 3000000})
        let executed = res.logs.find(e => e.event === "Executed")
        expect(executed).to.exist
    })
})