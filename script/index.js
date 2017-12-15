const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const RopstenAddresses = require('../deployed.json')
const RequestFactoryABI = require('../build/contracts/RequestFactory.json').abi
const RequestTrackerABI = require('../build/contracts/RequestTracker.json').abi
const TransactionRequestABI = require('../build/contracts/TransactionRequest.json').abi

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
const main = async (ms, logfile) => {

    /// Loads our account
    /// FIXME - allow user to input an account ?
    const me = (await web3.eth.getAccounts())[0]
    web3.eth.defaultAccount = me 

    /// Loads the contracts we need
    const requestFactory = new web3.eth.Contract(RequestFactoryABI, RopstenAddresses.requestFactory)
    const requestTracker = new web3.eth.Contract(RequestTrackerABI, RopstenAddresses.requestTracker)

    if (logfile === 'undefined') {
        console.log('logging to console...')
    }
    if (logfile === 'default') {
        console.log(require('os').homedir())
        logfile = 'info.log'
    }

    /// Loads the config
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