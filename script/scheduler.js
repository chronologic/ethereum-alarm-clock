/// The schedule.js is just a testing script to pump out transactions.
/// The scheduler.js will be used to interface with the cli.
const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const RopstenAddresses = require('../deployed.json')

const { getABI } = require('./util.js')
const BlockSchedulerABI = getABI('BlockScheduler')

const schedule = async (
    toAddress,
    callData,
    callGas,
    callValue,
    windowSize,
    windowStart,
    gasPrice,
    donation,
    payment
) => {
    const me = (await web3.eth.getAccounts())[0]
    web3.eth.defaultAccount = me 

    const blockScheduler = new web3.eth.Contract(
        BlockSchedulerABI,
        RopstenAddresses.blockScheduler
    )

    await blockScheduler.methods.schedule(
        toAddress,
        callData,
        [
            callGas,
            callValue,
            windowSize,
            windowStart,
            gasPrice,
            donation,
            payment 
        ]
    ).send({
        from: web3.eth.defaultAccount,
        gas: 3000000,
        value: web3.utils.toWei('300', 'finney')
    }).then(tx => {
        console.log(`Transaction mined! ${tx.transactionHash}`)
    }).catch(err => console.error(err))
}

module.exports = schedule
