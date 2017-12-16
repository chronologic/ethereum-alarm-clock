const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const { getABI } = require('./util.js')
const RequestFactoryABI = getABI('RequestFactory')
const RequestTrackerABI = getABI('RequestTracker')
const TransactionRequestABI = getABI('TransactionRequest')

const { Config } = require('./config.js')
const { scanToExecute, scanToStore } = require('./scanning.js')

/// Begins scanning
const startScanning = (ms, conf) => {
    setInterval(_ => {
        /// This is an async function
        scanToStore(conf)
    }, ms)

    setInterval(_ => {
        /// This is also an async function
        scanToExecute(conf)
    }, ms + 1000)
}

/// Main driver function
const main = async (ms, logfile, chain) => {

    /// loads our account
    /// FIXME - allow for a list of accounts from a json file
    const me = (await web3.eth.getAccounts())[0]
    web3.eth.defaultAccount = me 

    /// parses the chain argument 
    let contracts
    if (chain === 'ropsten') {
        contracts = require('../ropsten.json')
    } else {
        throw new Error(`chain: ${chain} not supported!`)
    }

    /// loads the contracts we need
    const requestFactory = new web3.eth.Contract(RequestFactoryABI, contracts.requestFactory)
    const requestTracker = new web3.eth.Contract(RequestTrackerABI, contracts.requestTracker)

    /// parses the logfile
    if (logfile === 'console') {
        console.log('logging to console...')
    }
    if (logfile === 'default') {
        // console.log(require('os').homedir())
        logfile = 'info.log'
    }

    /// loads the config
    const conf = new Config(
        logfile,            //conf.logfile
        requestFactory,     //conf.factory
        requestTracker,     //conf.tracker
        web3,               //conf.web3
    )

    /// Begins
    startScanning(ms, conf)
}

module.exports = main 