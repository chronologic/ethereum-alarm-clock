const parseRequestData = async (transactionRequest) => {
    const data = await transactionRequest.requestData()
    return {
        "claimData": {
            "claimedBy": data[0][0],
            "claimDeposit": data[2][0].toNumber(),
            "paymentModifier": data[3][0].toNumber(),
        },
        "meta": {
            "createdBy": data[0][1],
            "owner": data[0][2],
            "isCancelled": data[1][0],
            "wasCalled": data[1][1],
            "wasSuccessful": data[1][2],
        },
        "paymentData": {
            "donationBenefactor": data[0][3],
            "paymentBenefactor": data[0][4],
            "gasPrice": data[2][1].toNumber(),
            "donation": data[2][2].toNumber(),
            "donationOwed": data[2][3].toNumber(),
            "payment": data[2][4].toNumber(),
            "paymentOwed": data[2][5].toNumber(),
        },
        "schedule": {
            "claimWindowSize": data[2][6].toNumber(),
            "freezePeriod": data[2][7].toNumber(),
            "reservedWindowSize": data[2][8].toNumber(),
            "temporalUnit": data[2][9].toNumber(),
            "windowSize": data[2][10].toNumber(),
            "windowStart": data[2][11].toNumber(),
        },
        "txData": {
            "callGas": data[2][12].toNumber(),
            "callValue": data[2][13].toNumber(),
            "gasPrice": data[2][14].toNumber(),
            "toAddress": data[0][5],
        }
    }
}

module.exports.parseRequestData = parseRequestData