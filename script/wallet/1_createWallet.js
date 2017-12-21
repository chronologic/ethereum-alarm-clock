const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const { LightWallet } = require('../client/lightWallet.js')
const { TxRequest } = require('../contracts/txRequest.js')

const createWallet = async (num, file, password) => {

    const wallet = new LightWallet(web3)
    wallet.create(num)

    console.log(`
New wallet created!

Accounts:
${wallet.getAccounts().join('\n')}

Saving encrypted file to ${file}. Don't forget your password!`)

    wallet.encryptAndStore(file, password)

}

// createWallet(6, 'keys', 'pw')
// .catch(err => console.error)
module.exports.createWallet = createWallet
