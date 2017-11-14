/// Contracts
const TransactionRequest = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Libraries
const SchedulerLib = artifacts.require('./SchedulerLib.sol')

/// Brings in config.web3...
let config = require("../../config");

contract('Test Accounting...', function(accounts) {
    const Owner = accounts[0]
    const User1 = accounts[1]
    const User2 = accounts[2]
    const User3 = accounts[3]

    let transactionRequest


    /// Defaults (TODO abstract this out to a helper file)
    let donation           = 0,
        payment            = 0,
        claimWindowSize    = 255,
        freezePeriod       = 10,
        reservedWindowSize = 0,
        temporalUnit       = 0,
        windowSize         = 0,
        windowStart        = 0,
        callGas            = 300000,
        callValue          = 12345

    let testCallData = 'this-is-the-call-data'


    it('Should deploy a new instance of transaction request contract', async function() {

        let curBlock = await config.web3.eth.getBlockNumber()
        
        /// Create a new instance of Transaction Request directly.
        transactionRequest = await TransactionRequest.new([
                Owner,
                User1,
                User2,
                User3
            ],
            [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                curBlock,   // windowStart
                callGas,
                callValue
            ],
            testCallData)
        })

        console.log(transactionRequest)
})