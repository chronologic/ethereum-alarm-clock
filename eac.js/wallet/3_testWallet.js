const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const { LightWallet } = require('../client/lightWallet.js')
const { TxRequest } = require('../contracts/txRequest.js')

const main = async _ => {

    const wallet = new LightWallet(web3)
    wallet.decryptAndLoad('keyfile', 'pw')

    const me = (await web3.eth.getAccounts())[0]
    const dest = me

    for (i = 0; i < wallet.getAccounts().length; ++i) {
        /// Generate random data to test [optional]
        const testData = web3.utils.randomHex(
            Math.floor((Math.random() + 1)*32)
        )
        /// Assumes each account has the same balance.
        let amt = await web3.eth.getBalance(wallet.getAccounts()[2])
        const gasPrice = web3.utils.toWei('100', 'gwei')
        const gasLim = 28000
        const gasCost = gasPrice * gasLim
        amt -= gasCost

        wallet.sendFromNext(
            me, amt, gasLim, gasPrice, testData
        )
        .then(res => console.log(res.transactionHash))
        .catch(err => console.log(err))
    }

}

main()
.catch(err => console.log(err))
