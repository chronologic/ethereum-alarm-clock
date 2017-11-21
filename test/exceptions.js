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
                12345 //callValue
            ],
            'some-call-data-could-be-anything'
        )

        firstClaimBlock = windowStart - freezePeriod - claimWindowSize
    })

    it('tests transactionRequest for transactions that throw exception', async function() {
        /// TODO
    })

    it('tests transactionRequest when everything throws', async function() {
        /// TODO
    })
})