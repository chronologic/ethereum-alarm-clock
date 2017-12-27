
const catchNotMinedError = err => {
    if (err.indexOf('Transaction was not mined within 50 blocks') != -1) {
        return 'Transaction was not mined in a timely manner, check network latency.'
    } else { return '' }
}

module.exports.catchNotMinedError = catchNotMinedError
