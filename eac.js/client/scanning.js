const { GTE_HEX, NULL_ADDRESS } = require('../constants.js')
const { TxRequest } = require('../contracts/txRequest.js')

const store = (conf, txRequest) => {
    const log = conf.logger

    if (conf.cache.has(txRequest.address)) {
        log.cache(`Cache already contains ${txRequest.address}`)
        return
    }
    log.info(`Storing found txRequest at address ${txRequest.address}`)
    conf.cache.set(txRequest.address, txRequest.getWindowStart())
}

const scanBlockchain = async conf => {
    const log = conf.logger 
    const web3 = conf.web3

    const left = await web3.eth.getBlockNumber() - 45
    const right = left + 250

    const requestTracker = conf.tracker 
    const requestFactory = conf.factory

    log.debug(`Scanning request tracker at ${requestTracker.options.address}
Validating results with factory at ${requestFactory.options.address}
Scanning from ${left} to ${right} bounds.`)

    let nextRequestAddress = await requestTracker.methods.query(
        requestFactory.options.address,
        GTE_HEX,
        left
    ).call()

    if (nextRequestAddress === NULL_ADDRESS) {
        log.info(`No new requests.`)
        return
    }

    while (nextRequestAddress !== NULL_ADDRESS) {
        log.debug(`Found request - ${nextRequestAddress}`)

        // Verify that the request is known to the factory we are validating with.
        if (!await requestFactory.methods.isKnownRequest(nextRequestAddress).call()) {
            log.error(`Encountered unknown request~ factory: ${requestFactory.options.address} | query: ">=" | value ${left} | address: ${nextRequestAddress}`)
            throw new Error(`Encountered unknown address! Please check that you are using the correct contracts JSON file.`)
        }
        
        const trackerWindowStart = await requestTracker.methods.getWindowStart(
            requestFactory.options.address,
            nextRequestAddress
        ).call()
        
        const txRequest = new TxRequest(nextRequestAddress, web3)
        await txRequest.fillData()

        if (txRequest.getWindowStart() !== parseInt(trackerWindowStart)) {
            // The data between the txRequest we have and from the requestTracker do not match.
            log.error(`Data mismatch between txRequest and requestTracker. Double check contract addresses.`)
        } else if (txRequest.getWindowStart() <= right) {
            // This request is within bounds, store it.
            store(conf, txRequest)
        } else {
            log.debug(`Scan exit condition hit! Next window start exceeds right bound.`)
            break
        }

        nextRequestAddress = await requestTracker.methods.getNextRequest(
            requestFactory.options.address,
            txRequest.address
        ).call()
    }
}

const { routeTxRequest } = require('./routing.js')

const scanCache = async conf => {
    if (conf.cache.len() === 0) return //nothing stored in cache
    
    const allTxRequests = conf.cache.stored().map(address => new TxRequest(address, conf.web3))

    allTxRequests.forEach(txRequest => {
        // console.log(txRequest)
        txRequest.fillData()
        .then(_ => routeTxRequest(conf, txRequest))
    })
}

module.exports = {
    scanBlockchain: scanBlockchain,
    scanCache: scanCache
}
