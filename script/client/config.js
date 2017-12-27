const { Cache } = require('./cache.js')
const { LightWallet } = require('./lightWallet.js')
const { Logger } = require('./logger.js')

class Config {
    
    constructor(
        logfile,
        factory,
        tracker,
        web3,
        provider,
        walletFile,
        password
    ) {
        this.logger = new Logger(logfile)

        this.cache = new Cache(this.logger)
        this.factory = factory 
        this.tracker = tracker
        this.web3 = web3
        this.provider = provider
        this.wallet = this.instantiateWallet(walletFile, password)
    }

    instantiateWallet (walletFile, password) {
        if (walletFile === 'none') {
            return false
        }
        const wallet = new LightWallet(this.web3)
        wallet.decryptAndLoad(walletFile, password)
        return wallet
    }

}

module.exports.Config = Config 