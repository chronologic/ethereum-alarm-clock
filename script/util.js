/// Requires a case sensitive name of the contract and will return the ABI if found.
const getABI = name => {
    const fs = require('fs')
    if (fs.existsSync(`../build/contracts/${name}.json`)) {
        const json = require(`../build/contracts/${name}.json`)
        return json.abi
    }
    return new Error('Artifacts file not found.')
}

module.exports.getABI = getABI