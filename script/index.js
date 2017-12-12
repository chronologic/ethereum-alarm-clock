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

    /// Number of blocks in the future to check.
    const maxBlocks = 300

    /// Maximum number of contracts to track.
    const numContracts = 2**8

    const headBlock = await web3.eth.getBlock('latest')
    // log(headBlock)
    const currentBlockNum = headBlock.number 

    const GT_HEX  = web3.utils.utf8ToHex(">")
    const LT_HEX  = web3.utils.utf8ToHex("<")
    const GTE_HEX = web3.utils.utf8ToHex(">=")
    const LTE_HEX = web3.utils.utf8ToHex("<=")
    const EQ_HEX  = web3.utils.utf8ToHex("==")

    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

    const res = await requestTracker.methods.query(rfAddr, GT_HEX, currentBlockNum).call()
    // log(web3.utils.isAddress(res))
    // log(res)

    if (!web3.utils.isAddress(res)) throw new Error('Did not receive a valid Ethereum address from requestTracker.')
    if (res === NULL_ADDRESS) throw new Error('No upcoming transactions registered in requestTracker!')

    /// Validation
    const isKnown = await requestFactory.methods.isKnownRequest(res).call()

    let txRequest = new web3.eth.Contract(
        TransactionRequestABI,
        res
    )
    // const requestData = await txRequest.methods.requestData().call()
    const requestData = await RequestData.from(txRequest)
    // log(requestData.schedule.windowStart)

    if (requestData.schedule.windowStart < await web3.eth.getBlockNumber()) {
        throw new Error('Cannot monitor! Window is already started.')
    }

    if (requestData.schedule.windowStart >= (await web3.eth.getBlockNumber()) + maxBlocks) {
        throw new Error('Too far away. Please change maxBlocks variable.')
    }

    if (requestData.meta.isCancelled) throw new Error('This transaction is cancelled.')

    cache.set(res, requestData.schedule.windowStart)
    // cache.get(res)

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
