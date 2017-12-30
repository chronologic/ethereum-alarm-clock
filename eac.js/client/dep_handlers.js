const { catchNotMinedError } = require('./errorHelpers')

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
    .catch(err => {
        if (catchNotMinedError(err)) {
            log.info(catchNotMinedError(err))
        } else { throw new Error(err) }
    })
}

const executeTxRequest = async (conf, txRequest) => {
    const log = conf.logger
    const web3 = conf.web3 

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
        .catch(err => {
            if (catchNotMinedError(err)) {
                log.info(catchNotMinedError(err))
            } else { throw new Error(err) }
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
            conf.cache.set(txRequest.address, 105)
            return
        }

        if (res.events[0].raw.topics[0] == EXECUTEDLOG) {
            // console.log('executed')
            conf.cache.set(txRequest.address, 100)
        }
        
        log.info(`success. tx hash: ${res.transactionHash}`)
        console.log(`Executed a transaction! Hash: ${res.transactionHash}`)
    })
    .catch(err => {
        if (catchNotMinedError(err)) {
            log.info(catchNotMinedError(err))
        } else { throw new Error(err) }
    })
}

/**
 * Uses the Parity specific RPC request `parity_pendingTransactions` to search
 * for pending transactions in the transaction pool.
 * @param {TransactionRequest} txRequest 
 * @returns {Promise<boolean>} True if a pending transaction to this address exists.  
 */
const hasPendingParity = (conf, txRequest) => {

    /// Only available if using parity locally.
    const pApi = require('@parity/api')
    const provider = new pApi.Provider.Http(`${conf.provider}`)
    const api = new pApi(provider)

    api.parity.pendingTransactions()
    .then(transactions => {
        const recips = transactions.map(tx => tx.to)
        if (recips.indexOf(txRequest.address) !== -1) return true 
        return false
    })
    .catch(err => new Error('Are you sure Parity is running locally?'))

}

const hasPendingGeth = (conf, txRequest) => {

    /// Only available if using Geth locally.
    const Web3 = require('web3')
    const provider = new Web3.providers.HttpProvider(`${conf.provider}`)

    provider.send({
        "jsonrpc": "2.0",
        "method": "txpool_content",
        "params": [],
        "id": 007
    }, (err, res) => {
        if (err) throw new Error('hasPendingGeth threw an error')
        else {
            for (let account in res.result.pending) {
                for (let nonce in res.result.pending[account]) {
                    if (res.result.pending[account][nonce].to == txRequest.address) {
                        return true
                    }
                }
            }
            return false
        }
    })

}

const hasPendingTx = (conf, txRequest) => {
    if (conf.client == 'parity') {
        hasPendingParity(conf, txRequest)
    } else if (conf.client == 'geth') {
        hasPendingGeth(conf, txRequest)
    }
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
    if (await hasPendingTx(conf, txRequest)) {
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

    if (await txRequest.inClaimWindow()) {
        log.debug('Spawning a claimTxRequest process.')
        if (conf.cache.get(txRequest.address) <= 102) {
            return
        }
        claimTxRequest(conf, txRequest)
        return
    }

    if (await txRequest.inFreezePeriod()) {
        log.debug(`Ignoring frozen request. Now: ${await txRequest.now()} | Window start: ${txRequest.getWindowStart()}`)
        return 
    }

    if (txRequest.inExecutionWindow()) {
        log.debug('Spawning an execution attempt')
        /// This is a magic number. It's a messy hack with the cache
        /// that sets all executed request to a number at -1 if its being 
        /// executed. It's the best we can do until we can include a pending
        /// transaction check.
        if (conf.cache.get(txRequest.address) <= 101) {
            log.info(`skipping ${txRequest.address} already executed`)
            return
        }
        executeTxRequest(conf, txRequest)
        return
    }

    if (txRequest.afterExecutionWindow()) {
        log.debug('Spawning a clean up request')
        // cleanup(conf, txRequest)
        // This request should handle returning funds if the transaction was not executed.
        return
    }
}

/// WIP
const cleanup = async (conf, txRequest) => {
    const web3 = conf.web3 
    const log = conf.logger 

    if (!txRequest.afterExecutionWindow()) {
        log.debug('Not after window')
        return 
    }
    if (txRequest.isCancelled()) {
        log.debug('Cancelled')
        return 
    }
    if (txRequest.wasCalled()) {
        log.debug('Already executed')
        return 
    }
    if (await web3.eth.getBalance(txRequest.address) === 0) {
        log.debug('No Ether left in contract')
        return 
    }

    if (conf.wallet) {
        const accounts = conf.wallet.getAccounts()
        if (accounts.indexOf(txRequest.getOwner()) != -1) {
            const data = txRequest.instance.methods.cancel().encodeABI()
            sendFromIndex(
                accounts.indexOf(txRequest.getOwner()),
                txRequest.address,
                0,
                3000000,
                await web3.eth.getGasPrice(),
                data
            )
            .then(tx => log.info('Clean up successful'))
            .catch(err => {
                if (catchNotMinedError(err)) {
                    log.info(catchNotMinedError(err))
                } else { throw new Error(err) }
            })
        } else {
            const gasToCancel = txRequest.instance.methods.cancel().estimateGas()
            const gasCostToCancel = gasToCancel * await web3.eth.getGasPrice()

            if (gasCostToCancel > await web3.eth.getBalance(txRequest.address)) {
                log.debug('TxRequest does not have enough ether to cover costs of cancelling')
                return
            }

            const data = txRequest.instance.methods.cancel().encodeABI()

            sendFromNext(
                txRequest.address,
                0,
                gasToCancel + 12000,
                await web3.eth.getGasPrice(),
                data
            )
            .then(tx => log.info('Clean up successful'))
            .catch(err => {
                if (catchNotMinedError(err)) {
                    log.info(catchNotMinedError(err))
                } else { throw new Error(err) }
            })
        }
    }

    // if (txRequest.getOwner() != web3.eth.defaultAccount) {

    // }
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

    const claimDeposit = 2 * txRequest.data.paymentData.payment + 100
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

    log.info(`Attempting to claim ${txRequest.address} | Payment ${paymentIfClaimed}`)

    /// Check if wallet is enabled
    if (conf.wallet) {

        const claimData = txRequest.instance.methods.claim().encodeABI()

        conf.cache.set(txRequest.address, 102)
        conf.wallet.sendFromNext(
            txRequest.address,
            claimDeposit, 
            gasToClaim,
            await web3.eth.getGasPrice() - 25000,
            claimData
        )
        .then(res => log.info(`transaction claimed!`))
        .catch(err => {
            if (catchNotMinedError(err)) {
                log.info(catchNotMinedError(err))
            } else { throw new Error(err) }
            conf.cache.set(txRequest.address, 103)
        })

    } else {

        conf.cache.set(txRequest.address, 102)
        txRequest.instance.methods.claim().send({
            from: web3.eth.defaultAccount,
            value: claimDeposit,
            gas: gasToClaim, 
            gasPrice: await web3.eth.getGasPrice()
        })
        .then(res => log.info(`transaction claimed!`))
        .catch(err => {
            if (catchNotMinedError(err)) {
                log.info(catchNotMinedError(err))
            } else { throw new Error(err) }
            conf.cache.set(txRequest.address, 103)
        })
    }
}

module.exports.claimTxRequest = claimTxRequest
module.exports.handleTxRequest = handleTxRequest
module.exports.executeTxRequest = executeTxRequest
module.exports.executeTxRequestFrom = executeTxRequestFrom