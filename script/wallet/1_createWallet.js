const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const { LightWallet } = require('../client/lightWallet.js')
const { TxRequest } = require('../contracts/txRequest.js')

const main = async num => {

    const wallet = new LightWallet(web3)
    wallet.create(num)
    wallet.encryptAndStore('keyfile', 'pw')

}

main(5)
.catch(err => console.log(err))
