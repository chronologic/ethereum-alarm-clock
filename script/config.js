const { Logger } = require('./logger.js')

class Config {
    
    constructor(
        cache,
        factory,
        tracker,
        web3
    ) {
        this.cache = cache
        this.factory = factory 
        this.tracker = tracker
        this.web3 = web3
        
        this.logger = new Logger()
    }

}

module.exports.Config = Config 