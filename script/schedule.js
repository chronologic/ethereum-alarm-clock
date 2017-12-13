const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const RopstenAddresses = require('../deployed.json')

const { getABI } = require('./util.js')
const BlockSchedulerABI = getABI('BlockScheduler')

/// Schedules a test transaction.
const main = async (v) => {
    const verbose = v 
    const log = (msg) => {
        if (verbose) console.log(msg)
    }

    const me = (await web3.eth.getAccounts())[0]

    const windowStart = await web3.eth.getBlockNumber() + 10
    const gasPrice = web3.utils.toWei('100', 'gwei')

    const blockScheduler = new web3.eth.Contract(
        BlockSchedulerABI, 
        RopstenAddresses.blockScheduler
    )
    log(RopstenAddresses.blockScheduler)

    log(await blockScheduler.methods.factoryAddress().call())

    await blockScheduler.methods.scheduleTxSimple(
        '0x009f7EfeD908c05df5101DA1557b7CaaB38EE4Ce',
        web3.utils.utf8ToHex('some-testing-data'),
        [
            1212121,
            123454321,
            255,
            windowStart,
            gasPrice
        ]
    ).send({from: me, gas: 3000000, value: web3.utils.toWei('500', 'finney')})
    .then((tx) => {
        console.log(`Transaction mined! ${tx.transactionHash}`)
    })
    .catch(err => console.error(err))
}

module.exports = main

// setInterval(() => {
//     main()
//     .catch(err => log(err))
// }, 30000)
