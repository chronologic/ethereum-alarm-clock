/// This file shows how to use the Parity API module to get pending transaction in the txpool.

const Api = require('@parity/api')

const provider = new Api.Provider.Http('http://localhost:8545')
const api = new Api(provider)

const main = _ => {
    api.parity.pendingTransactions()
    .then(res => console.log(res))
}

main()
.catch(err => console.log(err))
