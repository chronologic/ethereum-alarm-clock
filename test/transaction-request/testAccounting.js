require('chai')
    .use(require('chai-as-promised'))
    .should()

const expect = require('chai').expect 

/// Contracts
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Brings in config.web3 (v1.0.0)
const config = require('../../config')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
const toBN = config.web3.utils.toBN

const MINUTE = 60 //seconds
const HOUR = 60*MINUTE 
const DAY = 24*HOUR

contract('Test accounting', async function(accounts) {

    let transactionRecorder 
    // let transactionRequest 

    // let firstClaimStamp
    // let lastClaimStamp
    // let timestamp
    
    /// Constant variables we need in each test
    const claimWindowSize = 5*MINUTE 
    const freezePeriod = 2*MINUTE
    const reservedWindowSize = 1*MINUTE
    const executionWindow = 2*MINUTE

    const donationVar = 12345
    const paymentVar = 232323

    beforeEach(async function() {
        // Deploy a fresh transactionRecorder
        transactionRecorder = await TransactionRecorder.new()
        expect(transactionRecorder.address, 'transactionRecorder was deployed').to.exist 
    })

    /////////////
    /// Tests ///
    /////////////

    it('tests transaction request payments', async function() {
    //     const curBlock = await config.web3.eth.getBlock('latest')
    //     const timestamp = curBlock.timestamp 

    //     const windowStart = timestamp + DAY 

    //     const donationBalBefore = await config.web3.eth.getBalance(accounts[1])

    //     const paymentBalBefore = await config.web3.eth.getBalance(accounts[2])

    //     /// Make a transactionRequest
    //     const transactionRequest = await TransactionRequest.new(
    //         [
    //             accounts[0], //createdBy
    //             accounts[0], //owner
    //             accounts[1], //donationBenefactor
    //             transactionRecorder.address //toAddress
    //         ], [
    //             donationVar, //donation
    //             0, //payment
    //             claimWindowSize,
    //             freezePeriod,
    //             reservedWindowSize,
    //             2, // temporalUnit
    //             executionWindow,
    //             windowStart,
    //             2000000, //callGas
    //             0  //callValue
    //         ],
    //         'some-call-data-goes-here',
    //         {from: accounts[0], value: config.web3.utils.toWei(1)}
    //     )

    //     expect(transactionRequest.address, 'transactionRequest was deployed').to.exist

    //     const secondsToWait = windowStart - timestamp 
    //     await waitUntilBlock(secondsToWait, 0)

    //     const gasPrice = 10
    //     const executeTx = await transactionRequest.execute({from: accounts[2], gas: 3000000, gasPrice: gasPrice})
    //     const execute = executeTx.logs.find(e => e.event === 'Executed')
    //     expect(execute, 'should have fired off the execute log').to.exist

    //     const donationBalAfter = await config.web3.eth.getBalance(accounts[1])
    //     const paymentBalAfter = await config.web3.eth.getBalance(accounts[2])

    //     const donation = execute.args.donation.toNumber()
    //     const payment = execute.args.payment.toNumber()       
    //     assert(toBN(donationBalAfter).sub(toBN(donationBalBefore)).toNumber() === donation, 'the donation should have been sent to donationBenefactor')

    //     const gasUsed = executeTx.receipt.gasUsed
    //     const gasCost = gasUsed * gasPrice

    //     const expectedPayment = gasCost
        
    //     assert(payment > expectedPayment)
    //     assert(payment - expectedPayment < 120000*gasPrice)
        
    //     assert(toBN(paymentBalBefore).sub(toBN(paymentBalAfter)).toNumber() === payment - (payment - gasCost))
    })

    it('tests transaction request payments when claimed', async function() {
        // const curBlock = await config.web3.eth.getBlock('latest')
        // const timestamp = curBlock.timestamp 

        // const windowStart = timestamp + DAY 

        // const paymentBalBefore = await config.web3.eth.getBalance(accounts[1])

        // /// Make a transactionRequest
        // const transactionRequest = await TransactionRequest.new(
        //     [
        //         accounts[0], //createdBy
        //         accounts[0], //owner
        //         accounts[1], //donationBenefactor
        //         transactionRecorder.address //toAddress
        //     ], [
        //         donationVar, //donation
        //         paymentVar, //payment
        //         claimWindowSize,
        //         freezePeriod,
        //         reservedWindowSize,
        //         2, // temporalUnit
        //         executionWindow,
        //         windowStart,
        //         2000000, //callGas
        //         12345  //callValue
        //     ],
        //     'some-call-data-goes-here',
        //     {from: accounts[0], value: config.web3.utils.toWei(1)}
        // )

        // expect(transactionRequest.address, 'transactionRequest was deployed').to.exist

        // const firstClaimStamp = windowStart - freezePeriod - claimWindowSize
        
        // const claimDeposit = 2 * paymentVar
        // assert(claimDeposit > 0)

        // const secondsToWait = firstClaimStamp - timestamp 
        // await waitUntilBlock(secondsToWait, 0)

        // const claimTx = await transactionRequest.claim({from: accounts[1], value: config.web3.utils.fromWei(claimDeposit, 'wei')})
        
        // const claimed = claimTx.logs.find(e => e.event = 'Claimed')
        // expect(claimed, 'The claimed event should have fired off').to.exist



    })
})