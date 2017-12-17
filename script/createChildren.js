const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const expect = require('chai').expect

const { LightWallet } = require('./lightWallet.js')

const { TxRequest } = require('./txRequest.js')

const main = async _ => {

    const wallet = new LightWallet(web3)
    // wallet.create(5)

    // wallet.encryptAndStore('keyfile', 'pw')
    wallet.decryptAndLoad('keyfile', 'pw')

    // wallet.sendFromNext(
    //     txRequest.address,
    //     txRequest.instance.methods.execute().encodeABI(),
    //     web3.utils.toWei('100', 'gwei')
    // )

    console.log(wallet.getAccounts())

}

main(5)
.catch(err => console.log(err))
// module.exports.main = main