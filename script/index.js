const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const RopstenAddresses = require('../deployed.json')

const RequestFactoryABI = require('../build/contracts/RequestFactory.json').abi
const RequestTrackerABI = require('../build/contracts/RequestTracker.json').abi
const TransactionRequestABI = require('../build/contracts/TransactionRequest.json').abi

const { RequestData } = require('./requestData.js')
const { executeTxRequest } = require('./handlers.js')

const { Cache22 } = require('./cache22.js')
const cache = new Cache22(true)

// const { Cache } = require('./cache.js')
// const cache = new Cache(true)
// cache.cache.clear()

const { Conf, scanToStore } = require('./scanning.js')
const { TxRequest } = require('./txRequest.js')

const verbose = true 
const log = (msg) => {
    if (verbose) console.log(msg)
}

async function main () {
    const me = (await web3.eth.getAccounts())[0]
    web3.eth.defaultAccount = me 

    const rfAddr = RopstenAddresses.requestFactory
    const requestFactory = new web3.eth.Contract(RequestFactoryABI, rfAddr)
    const requestTracker = new web3.eth.Contract(RequestTrackerABI, RopstenAddresses.requestTracker)

    const conf = new Conf(
        cache,
        requestFactory,
        requestTracker,
        web3
    )

    setInterval(async () => {
        await scanToStore(conf)
    }, 4000)

    // const found = conf.cache.stored()

    // found.filter(async (txRequestAddr) => {
    //     const txR = new TxRequest(txRequestAddr, conf.web3)
    //     await txR.fillData()
    //     if (await conf.web3.eth.getBlockNumber() <= txR.getWindowStart()) {
    //         await executeTxRequest(conf, txR)
    //     }
    // })
}

main()
.catch((err) => log(err))
