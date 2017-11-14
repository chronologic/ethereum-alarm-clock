/// Contracts
const BlockScheduler = artifacts.require('./BlockScheduler.sol')
const RequestFactory = artifacts.require('./RequestFactory.sol')
const RequestTracker = artifacts.require('./RequestTracker.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Libraries
const SchedulerLib = artifacts.require('./SchedulerLib.sol')

/// Brings in config.web3...
let config = require("../config");

contract('BlockScheduler', function(accounts) {
    const Owner = accounts[0]
    const User1 = accounts[1]
    const User2 = accounts[2]

    let blockScheduler
    let requestFactory
    let requestTracker
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
        assert(checkIsNotEmptyAddress(transactionRecorder.address), "Transaction Recorder was deployed.")

        requestTracker = await RequestTracker.deployed()
        assert(checkIsNotEmptyAddress(requestTracker.address), "Request Tracker was deployed.")
        
        /// I was running into an annoying bug that I had to dig through the contracts for,
        ///  eventually I solved it by making sure I deployed a new instance of RequestFactory
        ///  and passing in the requestTracker address. - Logan

        requestFactory = await RequestFactory.new(requestTracker.address)
        blockScheduler = await BlockScheduler.new(requestFactory.address)        

        /// Get the factory address
        let factoryAddress = await blockScheduler.factoryAddress()
        assert(checkIsNotEmptyAddress(factoryAddress), "BlockScheduler is instantiated and linked to requestFactory.")
    })

    it('should do block scheduling with `scheduleTxSimple`', async function() {
        let startBlockNum = await config.web3.eth.getBlockNumber()
        let windowStart = startBlockNum + 20

        let testData32 ="2323".padEnd(32, "FF")

        /// First let's see if we can send it ether.
        let balBefore = await config.web3.eth.getBalance(blockScheduler.address)        
        let tx = await blockScheduler.sendTransaction({from: Owner, value: 1000})
        let balAfter = await config.web3.eth.getBalance(blockScheduler.address)
        assert(balBefore < balAfter, "It sent 1000 wei correctly.")

        /// Let's start watching events from our scheduler so that we can get the new transaction
        ///  request address.
        const events = await blockScheduler.allEvents()
        events.watch((err, event) => {
            if (!err) {
                console.log(event);
            }
        })

        /// Now let's send it an actual transaction ;-)
        let scheduleTx = await blockScheduler.scheduleTxSimple(transactionRecorder.address,
                                                            testData32,
                                                            [
                                                                4e15, //callGas
                                                                123123, //callValue
                                                                300, //windowSize
                                                                windowStart
                                                            ])

        // console.log(scheduleTx)

        assert(scheduleTx.tx, "The transaction fired off and returned.")
        // console.log(scheduleTx)
        // // let txRequest = 
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
                                                                      {from: User1, value: config.web3.utils.toWei(10)}
        )

        assert(scheduleTx.tx)

    //     // let receipt = scheduleTx.receipt
    //     // assert(receipt.gasUsed < 1300000) //226061

    //     // let txRequest = 

    })

    // it('should return ether on invalid transaction', async function() {
    //     let lastBlock = await config.web3.eth.getBlockNumber()
    //     let windowStart = lastBlock + 20

    //     let balBefore = await config.web3.eth.getBalance(User1)
    //     let gasPrice = await config.web3.eth.getGasPrice()        

    //     let scheduleTx = await blockScheduler.scheduleTransaction(transactionRecorder.address,
    //                                                                   'this-is-the-call-data',
    //                                                                   [
    //                                                                       4e15, //callGas set crazy high
    //                                                                       123454321, //callValue
    //                                                                       0, //windowSize
    //                                                                       windowStart
    //                                                                   ],
    //                                                                   {from: User2, value: config.web3.utils.toWei(10), gasPrice: gasPrice}
    //     )

        // assert(scheduleTx.tx, "Should have a transaction hash.")
        // let gasUsed = scheduleTx.receipt.gasUsed

        // let balAfter = await config.web3.eth.getBalance(User1)
 
        // assert((balBefore - balAfter <= config.web3.utils.toWei(10)), "Should have sent back the 10 ether.")
        
        // /// These numbers aren't exactly equal but are close, need a way to fuzz them
        // console.log(balBefore - balAfter)
        // console.log(gasUsed * gasPrice)
        // assert((balBefore - balAfter <= gasUsed * gasPrice), "Should have only subtracted the amount of gas for failed instantiation")
    // })
})