/// This file shows how to use the Parity API module to get pending transaction in the txpool.

const Api = require('@parity/api')

/// Doesn't work with infura
const provider = new Api.Provider.Http('http://localhost:8545')
const api = new Api(provider)

const main = () => {
    return api.parity.pendingTransactions()
}

main()
.then(transactions => {
    const recips = transactions.map(tx => tx.to)
    console.log(recips)
})
.catch(err => console.log(err))
