/// Below is an example of using the Ethereum Alarm Clock from a smart
/// contract to schedule a delayed payment to a recipient in a trustless
/// way and guarenteeing that it will be sent in a reasonable period of 
/// time.

/// Instantiate the web3 object and point it to the remote infura node
/// for the Ropsten testnet.
const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://ropsten.infura.io')
const web3 = new Web3(provider)

