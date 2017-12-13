const executeTxRequest = async (conf, txRequest) => {
    const web3 = conf.web3 
    const requestLib = conf.requestLib 
    const log = conf.logger

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
    const executeTx = txRequest.instance.methods.execute().send({
        from: web3.eth.defaultAccount,
        gas: gasLimit - 12000,
        gasPrice: gasPrice
    })

    executeTx.then((res) => {
        conf.cache.delete(txRequest.address)
        log.info(`success. tx hash: ${res}`)
    })
}

module.exports.executeTxRequest = executeTxRequest