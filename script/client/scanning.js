const { GTE_HEX, NULL_ADDRESS} = require('../constants.js')
const { TxRequest } = require('../contracts/txRequest.js')

/// Utility function to store txRequest addresses in cache.
const store = (cache, txRequest) => {
    if (cache.has(txRequest.address)) {
        cache.log.cache(`already has ${txRequest.address}`)
        return
    }
    console.log(`Storing found transaction request ${txRequest.address} with window start ${txRequest.getWindowStart()}`)
    cache.set(txRequest.address, txRequest.getWindowStart())
}

const clear = (cache, nextRequestAddr, left) => {
    /// this line prevents accessing too early
    if (cache.mem.indexOf(nextRequestAddr) == -1) return 
    /// Expired or successfully executed - FIXME - hardcoded at `left - 10`
    if (cache.get(nextRequestAddr) > 0 && cache.get(nextRequestAddr) < left -10) {
        cache.del(nextRequestAddr)
    }
}

/// Scans for new requests and stores them.
const scanToStore = async conf => {
    const log = conf.logger

    /// The left and right bounds for which to scan for...
    const left = await conf.web3.eth.getBlockNumber() - 10
    const right = left + 300

    const tracker = conf.tracker 
    const factory = conf.factory 

    log.debug(`Scanning tracker @ ${tracker.options.address}`)
    log.debug(`Validating tracker results with factory @ ${factory.options.address}`)
    log.debug(`Scanning from ${left} to ${right}`)

    /// The only mutable variable here, always holds the address for the next transaction request while scanning.
    let nextRequestAddr = await tracker.methods.query(
        factory.options.address,
        GTE_HEX,
        left,
    ).call()

    if (nextRequestAddr === NULL_ADDRESS) {
        log.info('No new requests')
        return
    }

    log.debug(`Initial tracker result: ${nextRequestAddr}`)

    while (nextRequestAddr !== NULL_ADDRESS) {
        log.debug(`Found request @ ${nextRequestAddr}`)

        /// Check that the transaction request is known to the factory we are verifying with
        if (!await factory.methods.isKnownRequest(nextRequestAddr).call()) {
            log.error(`Encountered unknown request: factory: ${factory.options.address} | query: ">=" | value ${left} | address: ${nextRequestAddr}`)
            throw new Error(`Encountered unknown address. ${nextRequestAddr}`)
        }

        /// Ask the tracker for the windowStart associated with the transaction request address.
        const trackerWindowStart = await tracker.methods.getWindowStart(
            factory.options.address,
            nextRequestAddr,
        ).call() 

        /// Create the wrapper class and populate its data fields.
        const txRequest = new TxRequest(nextRequestAddr, conf.web3)
        await txRequest.fillData()

        /// Check to see if the txRequest data field matches what we got from the tracker smart contract.
        if (txRequest.getWindowStart() !== parseInt(trackerWindowStart)) {
            log.error(`window starts do not match: got ${txRequest.getWindowStart()} from txRequest and ${parseInt(trackerWindowStart)} from tracker`)
        }

        /// Check to see if the windowStart is within bounds that we are scanning for
        if (txRequest.getWindowStart() <= right) {
            log.debug(`Found request @ ${txRequest.address} - window start: ${txRequest.getWindowStart()} `)
            
            /// Stores the txRequest
            store(conf.cache, txRequest)
        } else {
            /// Breaks this round of scanning because we scanned too far ahead in time.
            log.debug(`Scan exit condition: window start ${txRequest.getWindowStart()} > right boundary: ${right}`)
            break
        }

        /// Here we change the nextRequestAddr variable to the next request according to the tracker.
        nextRequestAddr = await tracker.methods.getNextRequest(
            factory.options.address,
            txRequest.address
        ).call()
    }
    
    return true
}

const { executeTxRequest, executeTxRequestFrom } = require('./handlers.js')
const filter = require('async').filter

/// Scans the cache and executes any ready transaction requests.
const scanToExecute = async conf => {

    /// If the cache doesn't contain anything, return this scanning cycle.
    if (conf.cache.len() === 0) {
        return 
    }

    /// Gets all the txRequestAddrs stored in cache and creates instances of TxRequest class from them.
    const allTxRequests = conf.cache.stored()
    .map((txRequestAddr) => {
        return new TxRequest(txRequestAddr, conf.web3)
    })


    /// Filters the TxRequest instances so that we only keep the ones that are currently executable.
    filter(allTxRequests, async (txRequest) => {
        await txRequest.fillData()
        return await txRequest.inExecutionWindow()
    }, (err, res) => {
        if (err) throw new Error(err)
        /// Then tries to execute the TxRequest based on a few variable factors described below.
        res.map((txRequest) => {
            /// Check that its entry in the cache is valid.
            if (conf.cache.get(txRequest.address) > 101) {
                /// If it's claimed by one our accounts we have to take care to execute it from the correct one.
                if (txRequest.isClaimed()
                    && conf.wallet // truthy check to see if wallet is "turned on"
                    && conf.wallet.getAccounts().indexOf(txRequest.claimedBy()) > -1)
                {
                    const index = conf.wallet.getAccounts().indexOf(txRequest.claimedBy())
                    console.log(`Attempting execution from ${index}`)
                    executeTxRequestFrom(conf, txRequest, index)
                    .catch(err => {
                        conf.logger.error(err)
                    })
                } else {
                    /// Execute it from default account, or if wallet is enabled: any account.
                    executeTxRequest(conf, txRequest)
                    .catch(err => {
                        conf.logger.error(err)
                    })
                }
            }
        })
    })
}

const { handleTxRequest } = require('./handlers.js')

const scanCache = async conf => {

    /// Nothing stored in cache, return early.
    if (conf.cache.len() === 0) return

    const allTxRequests = conf.cache.stored()
        .map(txRequestAddr => new TxRequest(txRequestAddr, conf.web3))

    allTxRequests.forEach(txRequest => {
        txRequest.fillData()
        .then(_ => handleTxRequest(conf, txRequest))
    })
}

module.exports.scanCache = scanCache
module.exports.scanToExecute = scanToExecute
module.exports.scanToStore = scanToStore
