require('chai')
    .use(require('chai-as-promised'))
    .should() 

const expect = require('chai').expect 

/// Contracts 
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')
const TransactionRequest = artifacts.require('./TransactionRequest.sol')

/// Bring in config.web3 (v1.0.0)
const config = require('../../config')
const { wait, waitUntilBlock } = require('@digix/tempo')(web3)
const toBN = config.web3.utils.toBN 

contract('Execution', async function(accounts) {

    it('tests transaction sent as specified', async function() {

        /// Deploy the transactionRecorder
        const transactionRecorder = await TransactionRecorder.new()
        expect(transactionRecorder.address).to.exist 

        /// TransactionRequest constants
        const claimWindowSize = 25 //blocks
        const freezePeriod = 5 //blocks
        const reservedWindowSize = 10 //blocks
        const executionWindow = 10 //blocks

        const curBlockNum = await config.web3.eth.getBlockNumber()
        const windowStart = curBlockNum + 38

        const transactionRequest = await TransactionRequest.new(
            [
                accounts[0], //createdBy
                accounts[0], //owner
                accounts[1], //donationBenefactor
                transactionRecorder.address //toAddress
            ], [
                0, //donation
                0, //payment
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                1, //temporalUnit = 1, aka blocks
                executionWindow,
                windowStart,
                2000000, //callGas
                0 //callValue
            ],
            'some-call-data-could-be-anything',
            {value: config.web3.utils.toWei('1')}
        )

        await waitUntilBlock(0, windowStart)

        const executeTx = await transactionRequest.execute({gas: 3000000})
        expect(executeTx.receipt).to.exist 

        assert(await transactionRecorder.wasCalled() === true)
        assert(await transactionRecorder.lastCaller() === transactionRequest.address)
        assert((await transactionRecorder.lastCallValue()).toNumber() === 0)
        expect(await transactionRecorder.lastCallData()).to.exist
        assert(Math.abs(await transactionRecorder.lastCallGas() - 2000000) < 10000)
    })
})