/// Requires a case sensitive name of the contract and will return the ABI if found.
const getABI = name => {
    const fs = require('fs')
    if (fs.existsSync(`/home/logan/Work/ethereum-alarm-clock/build/contracts/${name}.json`)) {
        const json = require(`/home/logan/Work/ethereum-alarm-clock/build/contracts/${name}.json`)
        return json.abi
    }
    return new Error('Artifacts file not found.')
}

module.exports.getABI = getABI