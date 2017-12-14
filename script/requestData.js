/// Request Data wrapper for web3 v1.0.0 
class RequestData {
    constructor(data, txRequest) {
        if (typeof data === 'undefined' || typeof txRequest === 'undefined') {
            throw new Error('Can not call the constructor!')
        }
        
        this.txRequest = txRequest
        this.claimData = {
            "claimedBy": data[0][0],
            "claimDeposit": parseInt(data[2][0]),
            "paymentModifier": parseInt(data[3][0]),
        }

        this.meta = {
            "createdBy": data[0][1],
            "owner": data[0][2],
            "isCancelled": data[1][0],
            "wasCalled": data[1][1],
            "wasSuccessful": data[1][2],
        }

        this.paymentData = {
            "donationBenefactor": data[0][3],
            "paymentBenefactor": data[0][4],
            "gasPrice": parseInt(data[2][1]),
            "donation": parseInt(data[2][2]),
            "donationOwed": parseInt(data[2][3]),
            "payment": parseInt(data[2][4]),
            "paymentOwed": parseInt(data[2][5]),
        }

        this.schedule = {
            "claimWindowSize": parseInt(data[2][6]),
            "freezePeriod": parseInt(data[2][7]),
            "reservedWindowSize": parseInt(data[2][8]),
            "temporalUnit": parseInt(data[2][9]),
            "windowSize": parseInt(data[2][10]),
            "windowStart": parseInt(data[2][11]),
        }

        this.txData = {
            "callGas": parseInt(data[2][12]),
            "callValue": parseInt(data[2][13]),
            "gasPrice": parseInt(data[2][14]),
            "toAddress": data[0][5],
        }
    }

    static async from(txRequest) {
        const data = await txRequest.methods.requestData().call()
        return new RequestData(data, txRequest)
    }

    async refresh() {
        if (typeof this.txRequest === 'undefined') {
            throw new Error('Must instantiate the RequestData first!')
        }
        const data = await this.txRequest.methods.requestData().call()
        this.claimData = {
            "claimedBy": data[0][0],
            "claimDeposit": data[2][0],
            "paymentModifier": data[3][0],
        }

        this.meta = {
            "createdBy": data[0][1],
            "owner": data[0][2],
            "isCancelled": data[1][0],
            "wasCalled": data[1][1],
            "wasSuccessful": data[1][2],
        }

        this.paymentData = {
            "donationBenefactor": data[0][3],
            "paymentBenefactor": data[0][4],
            "gasPrice": data[2][1],
            "donation": data[2][2],
            "donationOwed": data[2][3],
            "payment": data[2][4],
            "paymentOwed": data[2][5],
        }

        this.schedule = {
            "claimWindowSize": data[2][6].toNumber(),
            "freezePeriod": data[2][7].toNumber(),
            "reservedWindowSize": data[2][8].toNumber(),
            "temporalUnit": data[2][9].toNumber(),
            "windowSize": data[2][10].toNumber(),
            "windowStart": data[2][11].toNumber(),
        }

        this.txData = {
            "callGas": data[2][12].toNumber(),
            "callValue": data[2][13].toNumber(),
            "gasPrice": data[2][14].toNumber(),
            "toAddress": data[0][5],
        }
    }
}

module.exports.RequestData = RequestData