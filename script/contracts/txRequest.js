const { getABI } = require('../util.js')
const { RequestData } = require('./requestData.js')
const { NULL_ADDRESS } = require('../constants.js')

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

    claimWindowStart () {
        return this.windowStart() - this.data.schedule.freezePeriod - this.data.schedule.claimWindowSize
    }

    claimWindowEnd() {
        return this.claimWindowStart() + this.data.schedule.claimWindowSize
    }

    async beforeClaimWindow () {
        // console.log(await this.now())
        // console.log(this.claimWindowStart())
        // console.log(await this.now() < this.claimWindowStart)
        return await this.now() < this.claimWindowStart()
    }

    async inClaimWindow () {
        console.log(this.claimWindowEnd())
        return this.claimWindowStart() <= await this.now() && await this.now() <  this.claimWindowEnd()
    }

    freezePeriodEnd () {
        return this.claimWindowEnd() + this.data.schedule.freezePeriod
    }

    async inFreezePeriod () {
        return this.claimWindowEnd() <= await this.now() && await this.now() < this.freezePeriodEnd()
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

    async afterExecutionWindow () {
        return await this.now() >= this.executionWindowEnd()
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

    gasPrice () {
        return this.data.txData.gasPrice
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

    async claimPaymentModifier () {
        return Math.floor(
            100 * (
            await this.now() - this.claimWindowStart()
            ) / this.data.schedule.claimWindowSize
        )
    }

}

module.exports.TxRequest = TxRequest
