const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const { LightWallet } = require('../client/lightWallet.js')
const { TxRequest } = require('../contracts/txRequest.js')

const fund = (value, recip) => {
    web3.eth.sendTransaction({
        from: web3.eth.defaultAccount,
        to: recip,
        value: value,
        gas: 3000000,
        gasPrice: web3.utils.toWei('100', 'gwei')
    })
    .then(res => console.log(res.transactionHash))
}

const fundAccounts = async (etherAmount, file, password) => {

    const wallet = new LightWallet(web3)
    wallet.decryptAndLoad(file, password)

    const me = (await web3.eth.getAccounts())[0]
    web3.eth.defaultAccount = me

    const amt = web3.utils.toWei(etherAmount, 'ether');

    (await wallet.getAccounts()).forEach(account => fund(amt, account))
    
}

fundAccounts('5', 'keyfile', 'pw')
.catch(err => console.log(err))
