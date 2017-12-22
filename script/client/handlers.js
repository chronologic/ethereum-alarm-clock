const { ABORTEDLOG, EXECUTEDLOG } = require('../constants.js')

/// Sends the exeuction request from web3 default account.
const fromDefault = (conf, txRequest, gasLimit, gasPrice) => {
    const web3 = conf.web3 
    const log = conf.logger 

    log.info('executing from default')

    const executeTx = txRequest.instance.methods.execute().send({
        from: web3.eth.defaultAccount,
        gas: gasLimit - 12000,
        gasPrice: gasPrice
    })

    executeTx.then((res) => {
        if (res.events[0].raw.topics[0] == ABORTEDLOG) {
            // console.log('aborted')
            conf.cache.del(txRequest.address)
            return 
        }

        if (res.events[0].raw.topics[0] == EXECUTEDLOG) {
            // console.log('executed')
            conf.cache.set(txRequest.address, 100)
        }

        log.info(`success. tx hash: ${res.transactionHash}`)
        console.log(`Executed a transaction! Hash: ${res.transactionHash}`)
    })
}

const executeTxRequest = async (conf, txRequest) => {
    const web3 = conf.web3 
    // const requestLib = conf.requestLib 
    const log = conf.logger

    await txRequest.fillData()
    if (txRequest.wasCalled()) {
        log.debug('already called')
        conf.cache.set(txRequest.address, -1)
        return
    }
    if (txRequest.isCancelled()) {
        log.debug('cancelled')
        return 
    }
    if (!await txRequest.inExecutionWindow()) {
        log.debug('outside execution window')
        return 
    }
    if (await txRequest.inReservedWindow() && txRequest.isClaimed()) {
        if (!txRequest.isClaimedBy(web3.eth.defaultAccount)) {
            log.debug(`In reserved window and claimed by ${txRequest.claimedBy()}`)
            log.debug(txRequest.isClaimedBy(web3.eth.defaultAccount))
            return 
        }
    }

    const executeGas = txRequest.callGas() + 180000//+ await requestLib.EXECUTION_GAS_OVERHEAD().call()
    const gasLimit = (await web3.eth.getBlock('latest')).gasLimit

    /// TODO pull out the gasPrice... rn it's hard coded
    const gasPrice = txRequest.gasPrice()

    if (executeGas > gasLimit) {
        log.error(`Execution gas above network gas limit.`)
        return 
    }

    /// Start execution attempt

    log.info(`Attempting execution...`)
    conf.cache.set(txRequest.address, -1)

    if (txRequest.isClaimedBy(web3.eth.defaultAccount)) {
        /// If it's claimed by default, send from default.
        fromDefault(conf, txRequest, gasLimit, gasPrice)

    } else if (conf.wallet) {
        /// If not claimed by default and wallet is enabled send from a child account.
        log.info('sending from next nonce in wallet')
        const executeTxData = txRequest.instance.methods.execute().encodeABI()
        conf.wallet.sendFromNext(
            txRequest.address,
            0,
            gasLimit - 12000,
            gasPrice,
            executeTxData
        )
        .then(res => {
            log.info(`success. tx hash: ${res.transactionHash}`)
            console.log(`Executed a transaction! Hash: ${res.transactionHash}`)
        })

    } else {
        /// Otherwise send from default.
        fromDefault(conf, txRequest, gasLimit, gasPrice)
    }
}

const executeTxRequestFrom = async (conf, txRequest, index) => {
    /// Perform checks
    /// ...
    ///
    log.info(`Attempting execution...`)
    conf.cache.set(txRequest.address, -1)

    const gasLimit = (await web3.eth.getBlock('latest')).gasLimit

    const executeTxData = txRequest.instance.methods.execute().encodeABI()
    conf.wallet.sendFromIndex(
        index,
        txRequest.address, 
        0,
        gasLimit - 12000,
        gasPrice,
        executeTxData
    )
    .then(res => {
        if (res.events[0].raw.topics[0] == ABORTEDLOG) {
            console.log(`aborted - ${res.transactionHash}`)
            conf.cache.del(txRequest.address)
            return
        }

        if (res.events[0].raw.topics[0] == EXECUTEDLOG) {
            // console.log('executed')
            conf.cache.set(txRequest.address, 100)
        }
        
        log.info(`success. tx hash: ${res.transactionHash}`)
        console.log(`Executed a transaction! Hash: ${res.transactionHash}`)
    })
}

const hasPendingTx = async txRequest => {

    const parityEnabled = false 
    if (!parityEnabled) return false

    /// Only available if using parity.
    const pApi = require('@parity/api')
    const provider = new ApiProvider.Http('http://localhost:8545')
    const api = new pApi(provider)

    api.parity.pendingTransaction()
    .then(res => {
        const found = res.filter(tx => tx.to === txRequest.address)
        if (found.length > 0) {
            return true
        }
        return false
    })
    .catch(err => new Error('err'))

}

/// General handler for transaction requests
const handleTxRequest = async (conf, txRequest) => {
    const log = conf.logger 
    const web3 = conf.web3 

    /// Early exit conditions
    //   - pending transaction
    //   - cancelled
    //   - before claim window
    //   - in freeze period 
    if (await hasPendingTx(txRequest)) {
        log.debug('Ignoring txRequest with pending transaction in the tx pool.')
        return 
    }

    if (txRequest.isCancelled()) {
        log.debug('Ignoring cancelled txRequest.')
        /// Should remove from cache.
        return 
    }

    if (await txRequest.beforeClaimWindow()) {
        log.debug(`Ignoring txRequest not in claim window. Now: ${await txRequest.now()} | Claimable at: ${txRequest.claimWindowStart()}`)
        return 
    }

    if (txRequest.inClaimWindow()) {
        log.debug('Spawning a claimTxRequest process.')
        claimTxRequest(conf, txRequest)
        return
    }

    if (txRequest.inFreezePeriod()) {
        log.debug(`Ignoring frozen request. Now: ${await txRequest.now()} | Window start: ${this.getWindowStart()}`)
        return 
    }

    if (txRequest.inExecutionWindow()) {
        log.debug('Spawning an execution attempt!')
        executeTxRequest(conf, txRequest)
        return
    }

    if (txRequest.afterExecutionWindow()) {
        log.debug('Spawning a clean up request')
        // cleanup(txRequest)
        return
    }
}

/// WIP
const claimTxRequest = async (conf, txRequest) => {
    const log = conf.logger 
    const web3 = conf.web3

    /// Check to see if that the transaction request is not cancelled.
    if (txRequest.isCancelled()) {
        log.debug(`failed to claim cancelled request at address ${txRequest.address}`)
        return
    }

    /// Check to see that the transaction is within claim window.
    if (!txRequest.inClaimWindow()) {
        log.debug(`failed to claim request at address ${txRequest.address} due to out of claim window`)
        return
    }

    /// Check to see that the transaction is _not_ claimed.
    if (txRequest.isClaimed()) {
        log.debug(`failed to claim already claimed request at address ${txRequest.address}`)
        return 
    }

    const paymentIfClaimed = Math.floor(
        txRequest.data.paymentData.payment *
        await txRequest.claimPaymentModifier() / 100
    )

    const claimDeposit = 2 * txRequest.data.paymentData.payment
    // console.log(await txRequest.instance.methods.claim().estimateGas())
    const gasToClaim = 2000000
    // await txRequest.instance.methods.claim()
    // .estimateGas()//{from: web3.eth.defaultAccount})
    const gasCostToClaim = parseInt(await web3.eth.getGasPrice()) * gasToClaim 

    if (gasCostToClaim > paymentIfClaimed) {
        log.debug(`Not claiming. Claim gas cost is higher than the calculated payment. Claim Gas Cost: ${gasCostToClaim} | Current Payment: ${paymentIfClaimed}`)
        return 
    }

    const claimDiceRoll = Math.floor(Math.random() * 100)

    if (claimDiceRoll >= await txRequest.claimPaymentModifier()) {
        log.debug(`Not claiming. Lady luck's not on your side! Rolled a ${claimDiceRoll} and needed at least ${await txRequest.claimPaymentModifier()}`)
        return 
    }

    log.info(`Attempting to claim. Payment ${paymentIfClaimed}`)

    /// Check if wallet is enabled
    if (conf.wallet) {

        const claimData = txRequest.instance.methods.claim().encodeABI()

        sendFromNext(
            txRequest.address,
            claimDeposit, 
            gasToClaim,
            await web3.eth.getGasPrice(),
            claimData
        )
        .then(res => log.info(`transaction claimed!`))
        .catch(err => log.error)

    } else {

        // console.log(web3.eth.defaultAccount)
        // console.log(claimDeposit)
        // console.log(gasToClaim)
        // console.log(await web3.eth.getGasPrice())
        txRequest.instance.methods.claim().send({
            from: web3.eth.defaultAccount,
            // value: claimDeposit,
            gas: gasToClaim, 
            gasPrice: await web3.eth.getGasPrice()
        })
        .then(res => log.info(`transaction claimed!`))
        .catch(err => log.error)

    }

}

module.exports.claimTxRequest = claimTxRequest
module.exports.handleTxRequest = handleTxRequest
module.exports.executeTxRequest = executeTxRequest
module.exports.executeTxRequestFrom = executeTxRequestFrom

// const reason = [
//     'WasCancelled',         //0
//     'AlreadyCalled',        //1
//     'BeforeCallWindow',     //2
//     'AfterCallWindow',      //3
//     'ReservedForClaimer',   //4
//     'InsufficientGas'       //5
// ]