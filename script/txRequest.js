const { getABI } = require('./util.js')
const { RequestData } = require('./requestData.js')
const { NULL_ADDRESS } = require('./constants.js')

class TxRequest {

    constructor(address, web3) {
        this.address = address 
        this.web3 = web3
        this.instance = new this.web3.eth.Contract(
            getABI('TransactionRequest'),
            this.address
        )
        this.fillData()
    }

    async now () {
        return await this.web3.eth.getBlockNumber()
    }

    getWindowStart () {
        return this.data.schedule.windowStart
    }

    windowStart () {
        return this.data.schedule.windowStart
    }

    wasCalled () {
        return this.data.meta.wasCalled
    }

    isClaimed () {
        return this.data.claimData.claimedBy !== NULL_ADDRESS
    }

    isClaimedBy (addr) {
        return this.data.claimData.claimedBy === addr
    }

    claimedBy () {
        return this.data.claimData.claimedBy
    }

    isCancelled() {
        return this.data.meta.isCancelled
    }

    executionWindowEnd () {
        return this.data.schedule.windowStart + this.data.schedule.windowSize 
    }

    async inExecutionWindow() {
        return this.windowStart() <= await this.now() && await this.now() <= this.executionWindowEnd()
    }

    reservedExecutionWindowEnd() {
        return this.windowStart() + this.data.schedule.reservedWindowSize
    }

    async inReservedWindow() {
        // console.log(await this.now())
        // console.log(this.executionWindowEnd())
        // console.log(this.reservedExecutionWindowEnd())
        // console.log(this.windowStart() <= await this.now() && await this.now() < this.reservedExecutionWindowEnd())
        return this.windowStart() <= await this.now() && await this.now() < this.reservedExecutionWindowEnd()
    }

    callGas () {
        return this.data.txData.callGas
    }

    async fillData () {
        const requestData = await RequestData.from(this.instance)
        this.data = requestData
    }

    async refreshData() {
        if (!this.data) {
            return await this.fillData()
        } 
        return await this.data.refresh()
    }

    // address () {
    //     return this.instance.options.address
    // }

}

module.exports.TxRequest = TxRequest
