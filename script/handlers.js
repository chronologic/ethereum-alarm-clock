const { ABORTEDLOG, EXECUTEDLOG } = require('./constants.js')

const executeTxRequest = async (conf, txRequest) => {
    const web3 = conf.web3 
    const requestLib = conf.requestLib 
    const log = conf.logger

    await txRequest.fillData()
    if (txRequest.wasCalled()) {
        log.debug('already called')
        return
    }
    if (txRequest.isCancelled()) {
        log.debug('cancelled')
        return 
    }
    if (!txRequest.inExecutionWindow()) {
        log.debug('outside execution window')
        return 
    }
    // con
    // if (txRequest.inReservedWindow() && !txRequest.isClaimedBy(web3.eth.defaultAccount)) {
    //     log.debug(`In reserved window and claimed by ${txRequest.claimedBy()}`)
    //     return 
    // }

    const executeGas = txRequest.callGas() //+ await requestLib.EXECUTION_GAS_OVERHEAD().call()
    const gasLimit = (await web3.eth.getBlock('latest')).gasLimit

    /// TODO pull out the gasPrice... rn it's hard coded
    const gasPrice = web3.utils.toWei('100', 'gwei')

    if (executeGas > gasLimit) {
        log.error(`Execution gas above network gas limit.`)
        return 
    }

    log.info(`Attempting execution...`)
    conf.cache.set(txRequest.address, -1)
    const executeTx = txRequest.instance.methods.execute().send({
        from: web3.eth.defaultAccount,
        gas: gasLimit - 12000,
        gasPrice: gasPrice
    })

    executeTx.then((res) => {
        // const fs = require('fs')
        // fs.appendFileSync('info.txt', JSON.stringify(res) + '\n')
        // fs.appendFileSync('info2', res.events[0].raw.topics + res.events[0].raw.data + '\n')
        if (res.events[0].raw.topics[0] == ABORTEDLOG) {
            fs.appendFileSync('info3', 'aborted\n')
            console.log('aborted')
            conf.cache.del(txRequest.address)
        }

        if (res.events[0].raw.topics[0] == EXECUTEDLOG) {
            // fs.appendFileSync('info3', 'executed\n')
            console.log('executed')
            conf.cache.del(txRequest.address)
        }
        log.info(`success. tx hash: ${res}`)
    })
}

module.exports.executeTxRequest = executeTxRequest

// const reason = [
//     'WasCancelled',         //0
//     'AlreadyCalled',        //1
//     'BeforeCallWindow',     //2
//     'AfterCallWindow',      //3
//     'ReservedForClaimer',   //4
//     'InsufficientGas'       //5
// ]