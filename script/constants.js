const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.giveProvider || provider)

const GT_HEX  = web3.utils.utf8ToHex(">")
const LT_HEX  = web3.utils.utf8ToHex("<")
const GTE_HEX = web3.utils.utf8ToHex(">=")
const LTE_HEX = web3.utils.utf8ToHex("<=")
const EQ_HEX  = web3.utils.utf8ToHex("==")

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

module.exports.GTE_HEX = GTE_HEX 
module.exports.NULL_ADDRESS = NULL_ADDRESS