const { Cache22 } = require('./cache22.js')
const { Logger } = require('./logger.js')

class Config {
    
    constructor(
        logfile,
        factory,
        tracker,
        web3
    ) {
        this.logger = new Logger(logfile)

        this.cache = new Cache22(this.logger)
        this.factory = factory 
        this.tracker = tracker
        this.web3 = web3
    }

}

module.exports.Config = Config 