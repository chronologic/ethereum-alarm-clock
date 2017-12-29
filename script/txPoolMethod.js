
const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider(`http://localhost:8545`)
const web3 = new Web3(provider)

provider.send({"jsonrpc":"2.0","method":"txpool_content","params":[],"id":007}, (err, res) => {
    if (err) console.error(err)
    else {
        for (let account in res.result.pending) {
            for (let nonce in res.result.pending[account]) {
                console.log(res.result.pending[account][nonce].to)
            }
        }
    }
})
