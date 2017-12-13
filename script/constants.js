const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.giveProvider || provider)

const GT_HEX  = web3.utils.utf8ToHex(">")
const LT_HEX  = web3.utils.utf8ToHex("<")
const GTE_HEX = web3.utils.utf8ToHex(">=")
const LTE_HEX = web3.utils.utf8ToHex("<=")
const EQ_HEX  = web3.utils.utf8ToHex("==")

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const EXECUTEDLOG = '0x3e504bb8b225ad41f613b0c3c4205cdd752d1615b4d77cd1773417282fcfb5d9'
const ABORTEDLOG = '0xc008bc849b42227c61d5063a1313ce509a6e99211bfd59e827e417be6c65c81b'

module.exports.GTE_HEX = GTE_HEX 
module.exports.NULL_ADDRESS = NULL_ADDRESS
module.exports.EXECUTEDLOG = EXECUTEDLOG
module.exports.ABORTEDLOG = ABORTEDLOG