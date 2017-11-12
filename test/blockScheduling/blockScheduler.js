const BigNumber = require('bignumber.js')
const assertFail = require('../_helpers/assertFail.js')

/// Contracts
const BlockScheduler = artifacts.require('./BlockScheduler.sol')
const RequestFactory = artifacts.require('./RequestFactory.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Libraries
const SchedulerLib = artifacts.require('./SchedulerLib.sol')

/// Brings in config.web3...
let config = require("../../config");

contract('BlockScheduler', function(accounts) {
    const Owner = accounts[0]
    const User1 = accounts[1]
    const User2 = accounts[2]

    let blockScheduler
    let requestFactory
    let transactionRecorder

    const checkIsNotEmptyAddress = (address) => {
        if (address == "0x0000000000000000000000000000000000000000") {
            return false;
        }
        return true;
    }
    
    /////////////
    /// Tests ///
    /////////////

    it('should instantiate contracts', async function() {
        transactionRecorder = await TransactionRecorder.deployed()
        assert(checkIsNotEmptyAddress(transactionRecorder.address), "Transaction Recorder was not deployed.")

        requestFactory = await RequestFactory.deployed()
        blockScheduler = await BlockScheduler.new(requestFactory.address)        

        /// Get the factory address
        let factoryAddress = await blockScheduler.factoryAddress()
        assert(checkIsNotEmptyAddress(factoryAddress), "BlockScheduler is linked to empty requestFactory.")
    })

    it('should do block scheduling with full args', async function() {
        let startBlockNum = await config.web3.eth.getBlockNumber()
        let windowStart = startBlockNum + 20

        // let txReceipt
        let scheduleTxHash = await blockScheduler.scheduleTransaction(transactionRecorder.address,
                                                                     "this-is-call-data",
                                                                     [
                                                                        1212121, //callGas
                                                                        123454321, //callValue
                                                                        98765, //donation
                                                                        80008, //payment
                                                                        123, //requiredStackDepth
                                                                        54321, //windowSize
                                                                        windowStart //windowStart
                                                                     ],
                                                                     {from: Owner, value: config.web3.utils.toWei(10)}
        )
      
        console.log(scheduleTxHash)
        // console.log(receipt)
    })

    it()

})