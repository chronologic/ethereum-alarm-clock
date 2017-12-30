
/**
 * Takes in a txRequest object and routes it to the thread that will act on it,
 * or returns if no action can be taken.
 * @param {Config} conf 
 * @param {TransactionRequest} txRequest 
 */
const routeTxRequest = async (conf, txRequest) => {
    const log = conf.logger 
    const web3 = conf.web3 

    if (await hasPending(conf, txRequest)) {
        log.debug(`Ignoring txRequest with pending transaction in the transaction pool.`)
        return
    }
    if (txRequest.isCancelled()) {
        log.debug(`Ignorning already cancelled txRequest.`)
        // TODO Should route this to delete the cache
        return
    }
    if (await txRequest.beforeClaimWindow()) {
        log.debug(`Ignoring txRequest not in claim window.`)
        return
    }
    if (await txRequest.inClaimWindow()) {
        // The client set the txRequest to `attempted claim` and watch 
        // for the result and either marked successfully `claimed` or not.
        // Using the cache codes is a primitive way to accomplish this.
        if (conf.cache.get(txRequest.address) <= 102) {
            // Already set in cache as having a claim request.
            return
        }
        if (txRequest.isClaimed()) {
            // Already claimed, do not attempt to claim it again.
            log.debug(`TxRequest in claimWindow but is already claimed!`)
            // Set it to the cache number so it won't do this again.
            conf.cache.set(txRequest.address, 103)
            return
        }

        claim(conf, txRequest)
        .then(txObj => {
            // If success set to claimed
            if (txObj.status == 1) {
                log.info(`TxRequest at ${txRequest.address} claimed!`)
                conf.cache.set(txRequest.address, 103)
            }
            // Or find the reason why it failed TODO
            else return
        })
        .catch(err => log.error(err))
        return
    }

    if (await txRequest.inFreezePeriod()) {
        log.debug(`Ignoring frozen txRequest. Now ${await txRequest.now()} | Window start: ${txRequest.getWindowStart()}`)
        return
    }

    if (txRequest.inExecutionWindow()) {
        log.debug(``)
        if (conf.cache.get(txRequest.address) <= 99) return // waiting to be cleaned
        if (txRequest.wasCalled()) { log.debug(`Already called.`); cleanup(conf, txRequest); return }
        if (await txRequest.inReservedWindow() && txRequest.isClaimed()) {
            if (conf.wallet.getAccounts().indexOf(txRequest.claimedBy()) == -1
                && !txRequest.isClaimedBy(web3.eth.defaultAccount)) {
                    log.debug(`In reserve window and not claimed by our accounts.`)
                    return
                }
        }
        // This hacks the cache to set all executed requests to store the value
        // of -1 if it has been executed. 
        if (conf.cache.get(txRequest.address) <= 101) {
            log.debug(`Skipping already executed txRequest.`)
            return
        }
        execute(conf, txRequest)
        .then(txObj => {
            if (txObj.status == 1) {
                log.info(`TxRequest at ${txRequest.address} executed!`)
                conf.cache.set(txRequest.address, 100)
            }
            // Or find the reason why it failed TODO
            else return
        })
        .catch(err => log.error(err))
        return
    }

    if (txRequest.afterExecutionWindow()) {
        log.debug(`Cleaning up expired txRequest and removing from cache.`)
        // TODO
        cleanup(conf, txRequest)
        // This request should handle returning funds if the transaction was not executed.
        return
    }
}

const hasPending = (conf, txRequest) => {
    if (conf.client == 'parity') {
        return hasPendingParity(conf, txRequest)
    } else if (conf.client == 'geth') {
        return hasPendingGeth(conf, txRequest)
    }
}

/**
 * Uses the Parity specific RPC request `parity_pendingTransactions` to search
 * for pending transactions in the transaction pool.
 * @param {TransactionRequest} txRequest 
 * @returns {Promise<boolean>} True if a pending transaction to this address exists.  
 */
const hasPendingParity = async (conf, txRequest) => {
    /// Only available if using parity locally.
    const pApi = require('@parity/api')
    const provider = new pApi.Provider.Http(`${conf.provider}`)
    const api = new pApi(provider)

    const transactions = await api.parity.pendingTransactions()
    const recips = transactions.map(tx => tx.to)
    if (recips.indexOf(txRequest.address) !== -1) return true 
    return false
}

/**
 * Uses the Geth specific RPC request `txpool_content` to search
 * for pending transactions in the transaction pool.
 * @param {TransactionRequest} txRequest 
 * @returns {Promise<boolean>} True if a pending transaction to this address exists.  
 */
const hasPendingGeth = (conf, txRequest) => {
    /// Only available if using Geth locally.
    const Web3 = require('web3')
    const provider = new Web3.providers.HttpProvider(`${conf.provider}`)

    return new Promise((resolve, reject) => {
        provider.send({
            "jsonrpc": "2.0",
            "method": "txpool_content",
            "params": [],
            "id": 0o7
        }, (err, res) => {
            if (err) reject(err)
            for (let account in res.result.pending) {
                for (let nonce in res.result.pending[account]) {
                    if (res.result.pending[account][nonce].to === txRequest.address) {
                        resolve(true)
                    }
                }
            }
            resolve(false)
        })
    })
}

const claim = async (conf, txRequest) => {
    const log = conf.logger
    const web3 = conf.web3

    // All the checks have been done in routing, now we follow through on the actions.

    const paymentWhenClaimed = Math.floor(
        txRequest.getPayment() * (await txRequest.claimPaymentModifier() / 100)
    )

    const claimDeposit = 2 * txRequest.getPayment()
    const gasToClaim = txRequest.instance.methods.claim().estimateGas()
    const gasCostToClaim = parseInt(await web3.eth.getGasPrice()) * gasToClaim

    if (gasCostToClaim > paymentWhenClaimed) {
        log.debug(`Not profitable to claim. Returning`)
        return
    }

    // The dice roll was originally implemented in the Python client, which I followed
    // for inspiration here. It's to add an element of chance to the claiming procedure.
    const diceroll = Math.floor(Math.random() * 100)
    
    if (diceroll >= await txRequest.claimPaymentModifier()) {
        log.debug(`Fate insists you wait until later.`)
        return
    }

    log.info(`Attempting the claim of txRequest at address ${txRequest.address} | Payment: ${paymentWhenClaimed}`)
    conf.cache.set(txRequest.address, 102)
    if (conf.wallet) {
        // Wallet is enabled, claim from the next index.
        const claimData = txRequest.instance.methods.claim().encodeABI()

        // TODO change sendFromNExt to simply send
        return conf.wallet.sendFromNext(
            txRequest.address,
            claimDeposit,
            gasToClaim + 21000,
            await web3.eth.getGasPrice(),
            claimData
        )
    } else {
        // Wallet disabled, claim from default account
        return txRequest.instance.methods.claim().send({
            from: web3.eth.defaultAccount,
            value: claimDeposit,
            gas: gasToClaim + 21000,
            gasPrice: await web3.eth.getGasPrice()
        })
    }

}

const execute = async (conf, txRequest) => {
    const log = conf.logger
    const web3 = conf.web3

    const executeGas = txRequest.callGas() + 180000
    const gasLimit = (await web3.eth.getBlock('latest')).gasLimit 

    const gasPrice = txRequest.gasPrice()

    if (executeGas > gasLimit) {
        // TODO
        // Set in cache to number `unable to execute`
        return Promise.reject(`Execution gas exceeds the network gas limit.`)
    }

    log.info(`Attempting the execution of txRequest at address ${txRequest.address}`)
    conf.cache.set(txRequest.address, -1)
    if (conf.wallet) {
        const executeData = txRequest.instance.methods.execute().encodeABI()
        const walletClaimIndex =  conf.wallet.getAccounts().indexOf(txRequest.claimedBy())
        
        if (walletClaimIndex !== -1) {
            return conf.wallet.sendFromIndex(
                walletClaimIndex,
                txRequest.address,
                0,
                executeGas,
                gasPrice,
                executeData
            )
        } else {
            return conf.wallet.sendFromNext(
                txRequest.address,
                0,
                executeGas,
                gasPrice,
                executeData
            )
        }
    } else {
        return txRequest.instance.methods.execute().send({
            from: web3.eth.defaultAccount,
            value: 0,
            gas: executeGas,
            gasPrice: gasPrice
        })
    }
}

const cleanup = async (conf, txRequest) => {
    const log = conf.logger
    const web3 = conf.web3

    const txRequestBalance = parseInt(await web3.eth.getBalance(txRequest.address))

    // If a transaction request has been executed it will route into this option.
    if (txRequestBalance === 0) {
        // set for removal from cache
        conf.cache.set(txRequest.address, 99)
        return
    }

    if (!txRequest.isCancelled()) {
        const gasToCancel = txRequest.instance.methods.cancel().estimateGas()
        const gasCostToCancel = gasToCancel * parseInt(await web3.eth.getGasPrice())
        const cancelData = txRequest.instance.methods.cancel().encodeABI()

        // If the transaction request is expired and still has money in it but is 
        // not cancelled, cancel it for the reward. The first step is to check if
        // any accounts are `owners` of the transactions -- as unlikely as this may
        // be it's a simple enough check.
        if (conf.wallet) {
            const ownerIndex = conf.wallet.getAccounts().indexOf(txRequest.getOwner())
            if (ownerIndex !== -1) {
                conf.wallet.sendFromIndex(
                    ownerIndex,
                    txRequest.address,
                    0,
                    gasToCancel + 21000,
                    await web3.eth.getGasPrice(),
                    cancelData
                )
            } else {
                // The more likely scenario is that one of our accounts is not the 
                // owner of the expired transaction in which case, we check to see
                // if we will not lost money for sending this transaction then send
                // it from any account.
                if (gasCostToCancel > txRequestBalance) {
                    // The transaction request does not have enough money to compensate.
                    return
                }
                conf.wallet.sendFromNext(
                    txRequest.address,
                    0,
                    gasToCancel + 21000,
                    await web3.eth.getGasPrice(),
                    cancelData
                )
            }
        } else {
            // Wallet disabled try from the deafult account.
            if (txRequest.isClaimedBy(web3.eth.defaultAccount)) {
                txRequest.instance.methods.cancel().send({
                    from: web3.eth.defaultAccount,
                    value: 0,
                    gas: gasToCancel + 21000,
                    gasPrice: await web3.eth.getGasPrice()
                })
            } else {
                if (gasCostToCancel > txRequestBalance) {
                    return
                }
                txRequest.instance.methods.cancel().send({
                    from: web3.eth.defaultAccount,
                    value:0,
                    gas: gasToCancel + 21000,
                    gasPrice: await web3.eth.getGasPrice()
                })
            }
        }
    }
    // Set all requests that make it here ready for deletion.
    conf.cache.set(txRequest.address, 99)
}

module.exports.routeTxRequest = routeTxRequest