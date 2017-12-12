const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.giveProvider || provider)

const RopstenAddresses = require('../deployed.json')

const RequestFactoryABI = require('../build/contracts/RequestFactory.json').abi
const RequestTrackerABI = require('../build/contracts/RequestTracker.json').abi
const TransactionRequestABI = require('../build/contracts/TransactionRequest.json').abi

const { RequestData } = require('./requestData.js')

const { Cache } = require('./cache.js')
const cache = new Cache(true)

const { Conf, scan } = require('./scanning.js')

const { GT_HEX, NULL_ADDRESS } = require('./constants.js')

const verbose = true 
const log = (msg) => {
    if (verbose) console.log(msg)
}

async function main () {
    const me = (await web3.eth.getAccounts())[0]

    const rfAddr = RopstenAddresses.requestFactory
    const requestFactory = new web3.eth.Contract(RequestFactoryABI, rfAddr)
    // log(requestFactory.options.address)
    const requestTracker = new web3.eth.Contract(RequestTrackerABI, RopstenAddresses.requestTracker)
    // log(requestTracker.options.address)

    const conf = new Conf(
        cache,
        requestFactory,
        requestTracker,
        web3
    )

    scan(conf)

    const running = true
    while (running) {
        var nextAddr = await requestTracker.methods.getNextRequest(requestFactory.options.address, txRequest.options.address).call() 
        // log(nextAddr)

        if (nextAddr === NULL_ADDRESS) {
            break 
        }

        txRequest.options.address = nextAddr        

        const rData = await RequestData.from(txRequest)

        if (cache.get(nextAddr) === null) {
            cache.set(nextAddr, rData.schedule.windowStart)
        }
    }

    setInterval(() => {
        const memory = cache.stored()
        memory.forEach(async (addr) => {
            const txR = new web3.eth.Contract(
                TransactionRequestABI,
                addr
            )
            const rData = await RequestData.from(txR)
            if (rData.meta.isCancelled) {
                cache.delete(addr)
            }
            if ((await web3.eth.getBlockNumber()) > rData.schedule.windowStart + rData.schedule.windowSize) {
                cache.delete(addr)
            }
            if (rData.meta.wasCalled) {
                cache.delete(addr)
            }
            if (rData.claimData.isClaimed && (await web3.eth.getBlockNumber()) <= rData.schedule.windowStart +rData.schedule.claimWindowSize) {
                /// nothing
                log('shouldnt hit here yet') 
            }
            if (rData.claimData.isClaimed && (await web3.eth.getBlockNumber()) > rData.schedule.windowStart +rData.schedule.claimWindowSize) {
                log('executing...')
                txR.methods.execute().send({
                    from: me,
                    value: web3.utils.toWei('500', 'finney')
                }).then(() => {
                    log('success!')
                    cache.delete(addr)
                })
                // break
            }
            if (rData.windowStart >= await web3.eth.getBlockNumber()) {
                log('executing...')
                txR.methods.execute().send({
                    from: me,
                    value: web3.utils.toWei('500', 'finney')
                }).then(() => {
                    log('success!')
                    cache.delete(addr)
                })
                // break
            }
        })
        log('iters')        
    }, 4000)


    // log(cache.length())


}

main()
.catch((err) => log(err))
