const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const RopstenAddresses = require('../deployed.json')

const RequestFactoryABI = require('../build/contracts/RequestFactory.json').abi
const RequestTrackerABI = require('../build/contracts/RequestTracker.json').abi
const TransactionRequestABI = require('../build/contracts/TransactionRequest.json').abi

const { RequestData } = require('./requestData.js')

const { Cache22 } = require('./cache22.js')
const cache = new Cache22(true)

const { Config } = require('./config.js')
const { scanToExecute, scanToStore } = require('./scanning.js')
const { TxRequest } = require('./txRequest.js')

const verbose = true 
const log = (msg) => {
    if (verbose) console.log(msg)
}

const startScanning = (ms, conf) => {
    setInterval(async () => {
        await scanToStore(conf)
    }, ms)

    setInterval(async () => {
        await scanToExecute(conf)
    }, ms + 1000)
}

const main = async (ms) => {
    const me = (await web3.eth.getAccounts())[0]
    web3.eth.defaultAccount = me 

    const rfAddr = RopstenAddresses.requestFactory
    const requestFactory = new web3.eth.Contract(RequestFactoryABI, rfAddr)
    const requestTracker = new web3.eth.Contract(RequestTrackerABI, RopstenAddresses.requestTracker)

    const conf = new Config(
        cache,
        requestFactory,
        requestTracker,
        web3
    )

    startScanning(ms, conf)

    // setInterval(() => {
    //     console.log('yo')
    // }, 6000)
}

// main()
// .catch((err) => log(err))
module.exports = main 