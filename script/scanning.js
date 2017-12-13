const { GTE_HEX, NULL_ADDRESS} = require('./constants.js')
const { TxRequest } = require('./txRequest.js')

/// Utility function to store txRequest addresses in cache.
const store = (cache, txRequest) => {
    if (cache.has(txRequest.address)) {
        console.log(`[cache] already has ${txRequest.address}`)
        return
    }
    cache.set(txRequest.address, txRequest.getWindowStart())
}

/// Scans for new requests and stores them.
const scanToStore = async conf => {
    const log = conf.logger
    const left = await conf.web3.eth.getBlockNumber()
    const right = left + 300

    const tracker = conf.tracker 
    const factory = conf.factory 

    log.debug(`Scanning tracker @ ${tracker.options.address}`)
    log.debug(`Validating tracker results with factory @ ${factory.options.address}`)
    log.debug(`Scanning from ${left} to ${right}`)

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
        if (!await factory.methods.isKnownRequest(nextRequestAddr).call()) {
            log.error(`Encountered unknown request: factory: ${factory.options.address} | query: ">=" | value ${left} | address: ${nextRequestAddr}`)
            throw new Error(`Encountered unknown address. ${nextRequestAddr}`)
        }
        let trackerWindowStart = await tracker.methods.getWindowStart(
            factory.options.address,
            nextRequestAddr,
        ).call() 
        let txRequest = new TxRequest(nextRequestAddr, conf.web3)
        await txRequest.fillData()

        if (txRequest.getWindowStart() !== trackerWindowStart) {
            log.error(`error`)
        }
        if (txRequest.getWindowStart() <= right) {
            log.debug(`Found request @ ${txRequest.address} - window start: ${txRequest.getWindowStart()} `)
            
            store(conf.cache, txRequest)
        } else {
            log.debug(`Scan exit condition: window start ${txRequest.getWindowStart()} > right boundary: ${right}`)
            break
        }

        nextRequestAddr = await tracker.methods.getNextRequest(
            factory.options.address,
            txRequest.address
        ).call()
    }
    return true
}

const { executeTxRequest } = require('./handlers.js')
const filter = require('async').filter

/// Scans the cache and executes any ripe transaction requests.
const scanToExecute = async conf => {

    if (conf.cache.len() === 0) {
        return 
    }

    //Gets all the txRequestAddrs stored in cache
    const one = conf.cache.stored()
    .map((txRequestAddr) => {
        return new TxRequest(txRequestAddr, conf.web3)
    })

    filter(one, async (txRequest) => {
        await txRequest.fillData()
        return await txRequest.inExecutionWindow()
    }, (err, res) => {
        if (err) throw new Error(err)
        res.map((txRequest) => {
            if (conf.cache.get(txRequest.address) > 0) {
                executeTxRequest(conf, txRequest)
            }
        })
    })
}

module.exports.scanToExecute = scanToExecute
module.exports.scanToStore = scanToStore
