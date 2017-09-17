/**
 * Utility functions.
 */
const createKeccakHash = require('keccak');

/**
 * EIP-55 Implementation. Returns address in mixed-case checksum address encoding.
 * @param address
 * @returns {string}
 */
function toChecksumAddress(address) {
    address  = address.toLowerCase().replace('0x', '');
    let hash = createKeccakHash('keccak256').update(address).digest('hex')
    let ret  = '0x';

    for(let i = 0; i < address.length; i++) {
        if(parseInt(hash[i], 16) >= 8) {
            ret += address[i].toUpperCase()
        } else {
            ret += address[i]
        }
    }

    return ret
}

module.exports = {
    toChecksumAddress: toChecksumAddress
};