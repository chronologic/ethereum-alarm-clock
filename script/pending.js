/// This file shows how to use the Parity API module to get pending transaction in the txpool.

const Api = require('@parity/api')

/// Doesn't work with infura
const provider = new Api.Provider.Http('http://localhost:8545')
const api = new Api(provider)

const main = () => {
    return api.parity.pendingTransactions()
}

// const pattern = '0x32fc307b3a3868de32522a475c133d74341ec5102414e04947e5bf5ae70a4c57'
main()
.then(res => {
    if (res) return
    const pattern = res[20].hassh
    const found = res.filter(tx => tx.hash == pattern)
    console.log(found.length)
})
.catch(err => console.log(err))
