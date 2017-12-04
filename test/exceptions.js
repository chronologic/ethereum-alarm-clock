require('chai')
    .use(require('chai-as-promised'))
    .should() 

const expect = require('chai').expect 

/// Contracts
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Bring in config.web3 (v1.0.0)
const config = require('../config')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
const toBN = config.web3.utils.toBN

const { parseRequestData } = require('./requestData')

contract('Exceptions', async function(accounts) {
    const Owner = accounts[0]

    let transactionRequest 

    /// TransactionRequest constants
    const claimWindowSize = 25 //blocks
    const freezePeriod = 5 //blocks
    const reservedWindowSize = 10 //blocks
    const executionWindow = 10 //blocks
    let windowStart
    let firstClaimBlock

    beforeEach(async function() {
        const curBlockNum = await config.web3.eth.getBlockNumber()
        windowStart = curBlockNum + 38

        transactionRequest = await TransactionRequest.new(
            [
                Owner, //createdBy
                Owner, //owner
                accounts[1], //donationBenefactor
                accounts[3] //toAddress
            ], [
                12345, //donation
                0, //payment
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                1, //temporalUnit = 1, aka blocks
                executionWindow,
                windowStart,
                43324, //callGas
                0 //callValue
            ],
            'some-call-data-could-be-anything'
        )

        firstClaimBlock = windowStart - freezePeriod - claimWindowSize
    })

    it('tests transactionRequest for transactions that throw exception', async function() {
    
        const requestData = await parseRequestData(transactionRequest)
        await waitUntilBlock(0, requestData.schedule.windowStart)

        const executeTx = await transactionRequest.execute({
            from: accounts[1],
            gas: 3000000,
            gasPrice: requestData.paymentData.gasPrice
        })

        expect(executeTx.receipt)
        .to.exist 
        
        const gasUsed = executeTx.receipt.gasUsed 
        const newRequestData = await parseRequestData(transactionRequest)

        expect(newRequestData.meta.wasCalled)
        .to.be.true 

        // expect(newRequestData.meta.wasSuccessful)
        // .to.be.false

        const logExecuted = executeTx.logs.find(e => e.event === 'Executed')
        const measuredGasConsumption = logExecuted.args.measuredGasConsumption.toNumber()

        expect(measuredGasConsumption)
        .to.be.above(gasUsed)

        expect(measuredGasConsumption - gasUsed)
        .to.be.below(120000)

    })

    it('tests transactionRequest when everything throws', async function() {
        /// TODO
    })
})