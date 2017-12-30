const { getABI } = require('../util.js')
const RequestFactoryABI = getABI('RequestFactory')
const RequestTrackerABI = getABI('RequestTracker')
const TransactionRequestABI = getABI('TransactionRequest')

const { Config } = require('./config.js')
const Scanner = require('./scanning.js')

const ethUtil = require('ethereumjs-util')

const startScanning = (ms, conf) => {
    const log = conf.logger

    setInterval(_ => {
        Scanner.scanBlockchain(conf)
        .catch(err => log.error(err))
    }, ms)

    setInterval(_ => {
        Scanner.scanCache(conf)
        .catch(err => log.error(err))
    }, ms + 1000)
}

/**
 * The main driver function that begins the client operation.
 * @param {*} web3 An instantiate web3 instance.
 * @param {String} provider The supplied provider host for the web3 instance. (Ex. 'http://localhost:8545)
 * @param {Number} ms Milliseconds between each conduction of a blockchain scan.
 * @param {String} logfile The file that the logging utility will log to, or 'console' for logging to console.
 * @param {String} chain The name of the chain, accepted values are 'ropsten', 'rinkeby' and 'kovan'.
 * @param {String} walletFile Path to the encrypted wallet file.
 * @param {String} pw Password to decrypt wallet.
 */
const main = async (web3, provider, ms, logfile, chain, walletFile, pw) => {

    // Parses the chain argument
    const contracts = require(`../assets/${chain}.json`)

    // Loads the contracts
    const requestFactory = new web3.eth.Contract(RequestFactoryABI, contracts.requestFactory)
    const requestTracker = new web3.eth.Contract(RequestTrackerABI, contracts.requestTracker)

    // Parses the logfile
    if (logfile === 'console') {
        console.log('Logging to console')
    }
    if (logfile === 'default') {
        logfile = require('os').homedir() + '/.eac.log'
    }

    // Loads conf
    const conf = new Config(
        logfile,            //conf.logfile
        requestFactory,     //conf.factory
        requestTracker,     //conf.tracker
        web3,               //conf.web3
        provider,           //conf.provider
        walletFile,         //conf.wallet
        pw                  //wallet password
    )

    // Assigns the client variable
    if (chain == 'rinkeby') {
        conf.client = 'geth'
    } else { conf.client = 'parity' }

    // Determines wallet support
    if (conf.wallet) {
        console.log('Wallet support: Enabled')
    } else { 
        console.log('Wallet support: Disabled')
        // Loads the default account.
        const me = (await web3.eth.getAccounts())[0]
        web3.eth.defaultAccount = me
        if (!ethUtil.isValidAddress(web3.eth.defaultAccount)) {
            throw new Error('Wallet is disabled but you do not have a local account unlocked.')
        }
    }

    // Begin
    startScanning(ms, conf)
}

module.exports = main 