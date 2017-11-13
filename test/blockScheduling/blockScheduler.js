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

        let scheduleTx = await blockScheduler.scheduleTransaction(transactionRecorder.address,
                                                                     "this-is-call-data",
                                                                     [
                                                                        4e15, //callGas
                                                                        123454321, //callValue
                                                                        98765, //donation
                                                                        80008, //payment
                                                                        123, //requiredStackDepth
                                                                        54321, //windowSize
                                                                        windowStart //windowStart
                                                                     ],
                                                                     {from: User2, value: config.web3.utils.toWei(10)}
        )
      
        assert(scheduleTx.tx)
        // console.log(receipt)
    })

    it('should do block scheduling with simplified args', async function() {
        let startBlockNum = await config.web3.eth.getBlockNumber()
        let windowStart = startBlockNum + 20

        let scheduleTx = await blockScheduler.scheduleTransaction(transactionRecorder.address,
                                                                      'this-is-call-data',
                                                                      [
                                                                          4e15, //callGas
                                                                          123454321, //callValue
                                                                          255, //windowSize
                                                                          windowStart
                                                                      ],
                                                                      {from: Owner, value: config.web3.utils.toWei(10)}
        )

        assert(scheduleTx.tx)

        let receipt = scheduleTx.receipt
        assert(receipt.gasUsed < 1300000) //226061

        // let txRequest = 

    })

    it('should return ether on invalid transaction', async function() {
        let lastBlock = await config.web3.eth.getBlockNumber()
        let windowStart = lastBlock + 20

        let balBefore = await config.web3.eth.getBalance(User1)
        let gasPrice = await config.web3.eth.getGasPrice()        

        let scheduleTx = await blockScheduler.scheduleTransaction(transactionRecorder.address,
                                                                      'this-is-the-call-data',
                                                                      [
                                                                          4e15, //callGas set crazy high
                                                                          123454321, //callValue
                                                                          0, //windowSize
                                                                          windowStart
                                                                      ],
                                                                      {from: User1, value: config.web3.utils.toWei(10), gasPrice: gasPrice}
        )

        assert(scheduleTx.tx, "Should have a transaction hash.")
        let gasUsed = scheduleTx.receipt.gasUsed

        let balAfter = await config.web3.eth.getBalance(User1)
 
        assert((balBefore - balAfter <= config.web3.utils.toWei(10)), "Should have sent back the 10 ether.")
        
        /// These numbers aren't exactly equal but are close, need a way to fuzz them
        console.log(balBefore - balAfter)
        console.log(gasUsed * gasPrice)
        // assert((balBefore - balAfter <= gasUsed * gasPrice), "Should have only subtracted the amount of gas for failed instantiation")
    })
})