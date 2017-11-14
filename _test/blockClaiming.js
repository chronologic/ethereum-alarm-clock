const assertFail = require('./_helpers/assertFail.js')

/// Contracts
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')
const TransactionRecorder = artifacts.require('./TransactionRecorder.sol')

/// Libraries
const SchedulerLib = artifacts.require('./SchedulerLib.sol')

/// Brings in config.web3...
let config = require("../config");

contract('Block claiming', function(accounts) {
    const Owner = accounts[0]
    const Benefactor = accounts[1]
    const ToAddress = accounts[2]

    let transactoinRequest
    let transactionRecorder

    const mine = async () => await web3.currentProvider.send({ jsonrpc: "2.0", method: "evm_mine", params: [], id: 0 })

    const checkIsNotEmptyAddress = (address) => {
        if (address == "0x0000000000000000000000000000000000000000") {
            return false;
        }
        return true;
    }

    /////////////
    /// Tests ///
    /////////////

    it('should not claim before first claim block', async function() {
        let curBlock = await config.web3.eth.getBlockNumber()

        transactionRequest = await TransactionRequest.new(
            [
                Owner, // created by
                Owner, // owner
                Benefactor, // donation benefactor
                ToAddress // To
            ], [
                0, //donation
                0, //payment
                255, //claim window size
                10, //freeze period
                0, //reserved window size
                0, // temporal unit
                0, //window size
                curBlock + 1000, //windowStart
                300000, //callGas
                12345 //callValue
            ],
            'this-is-the-call-data'
        )

        let firstClaimBlock  = (curBlock + 1000) - 10 - 255
        curBlock = await config.web3.eth.getBlockNumber()
        assert(firstClaimBlock > curBlock, "Sanity check")
        
        // assert(curBlock == firstClaimBlock - 1, "Another sanity check")

        assertFail(await transactionRequest.claim(), "Should revert.")        

    })
})