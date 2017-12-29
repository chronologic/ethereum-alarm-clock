const { getABI } = require('../util.js')
const RequestFactoryABI = getABI('RequestFactory')
const RequestTrackerABI = getABI('RequestTracker')
const TransactionRequestABI = getABI('TransactionRequest')

const { Config } = require('./config.js')
const { scanCache, scanChain } = require('./scanning.js')

const ethUtil = require('ethereumjs-util')

/// Begins scanning
const startScanning = (ms, conf) => {
    const log = conf.logger

    setInterval(_ => {
        scanChain(conf)
        .catch(err => log.error(err))
    }, ms)

    setInterval(_ => {
        /// This is also an async function.
        /// Will scan the cache to perform actions on stored transactions.
        scanCache(conf)
        .catch(err => log.error(err))
    }, ms + 1000)
}

/// Main driver function
const main = async (web3, provider, ms, logfile, chain, walletFile, pw) => {

    /// Parses the chain argument, already checked for accuracy in the cli.
    const contracts = require(`../../${chain}.json`)

    /// Loads the contracts we need.
    const requestFactory = new web3.eth.Contract(RequestFactoryABI, contracts.requestFactory)
    const requestTracker = new web3.eth.Contract(RequestTrackerABI, contracts.requestTracker)

    /// Parses the logfile.
    if (logfile === 'console') {
        console.log('Logging to console')
    }
    if (logfile === 'default') {
        logfile = require('os').homedir() + '/.eac.log'
    }

    /// Loads the config.
    const conf = new Config(
        logfile,            //conf.logfile
        requestFactory,     //conf.factory
        requestTracker,     //conf.tracker
        web3,               //conf.web3
        provider,           //conf.provider
        walletFile,         //conf.wallet
        pw                  //wallet password
    )

    if (chain == 'rinkeby') {
        conf.client = 'geth'
    } else { conf.client = 'parity' }

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

    /// Begins
    startScanning(ms, conf)
}

module.exports = main 