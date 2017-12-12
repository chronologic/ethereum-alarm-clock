const { GTE_HEX, NULL_ADDRESS} = require('./constants.js')

/// Wrapper over the nano-cache
const store = (cache, txRequest) => {
    cache.set(txRequest.address, txRequest.getWindowStart())
}

/// Periodically scans for new requests.
const scan = async conf => {
    const log = new Logger()
    const left = await conf.web3.eth.getBlockNumber()
    const right = left + 300

    const tracker = conf.tracker 
    const factory = conf.factory 

    log.debug(`Scanning tracker @ ${tracker.options.address}`)
    log.debug(`Validating tracker results with factory @ ${factory.address}`)
    // log.debug(`Scanning from ${left} to ${right}`)

    let nextRequestAddr = await tracker.methods.query(
        factory.options.address,
        GTE_HEX,
        left,
    ).call()

    log.debug(`Initial tracker result: ${nextRequestAddr}`)

    while (nextRequestAddr != NULL_ADDRESS) {
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
}

const { getABI } = require('./util.js')

class TxRequest {

    constructor(address, web3) {
        this.address = address 
        this.web3 = web3
        this.instance = new this.web3.eth.Contract(
            getABI('TransactionRequest'),
            this.address
        )
    }

    getWindowStart () {
        return this.windowStart
    }

    async fillData () {
        const res  = await this.instance.methods.requestData().call()
        this.windowStart = res['2'][11] 
    }

    // address () {
    //     return this.instance.options.address
    // }

}

class Conf {

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
    }

}

class Logger {

    debug (msg) {
        console.log(`[debug] ${msg}`)
    }

    error (msg) {
        console.log(`[error] ${msg}`)
    }

    info (msg) {
        console.log(`[info] ${msg}`)
    }
}

module.exports.Conf = Conf 
module.exports.scan = scan