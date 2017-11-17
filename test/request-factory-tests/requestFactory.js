require('chai')
    .use(require('chai-as-promised'))
    .should()   

const expect = require('chai').expect

/// Contracts
const RequestFactory = artifacts.require('./RequestFactory.sol')
const RequestLib = artifacts.require('./RequestLib.sol')
const RequestTracker = artifacts.require('./RequestTracker.sol')
const TransactionRequest  = artifacts.require('./TransactionRequest.sol')

/// Brings in config.web3
const config = require("../../config")
const NULL_ADDR = '0x0000000000000000000000000000000000000000'

/// Note - these tests were checked very well and should never be wrong.
/// If they start failing - look in the contracts.
contract('Request factory', async function(accounts) {

    it('should create a request with provided properties', async function() {
        /// Get the instance of the deployed RequestLib
        let requestLib = await RequestLib.deployed()
        expect(requestLib.address).to.exist

        /// Get the current block
        let curBlock = await config.web3.eth.getBlockNumber()

        /// Set up the data for our transaction request
        let claimWindowSize = 255
        let donation = 12345
        let payment = 54321
        let freezePeriod = 10
        let windowStart = curBlock + 20
        let windowSize = 511
        let reservedWindowSize = 16
        let temporalUnit = 1
        let callValue = 123456789
        let callGas = 1000000
        
        /// Validate the data with the RequestLib
        let validateTx = await requestLib.validate(
            [
                accounts[0],
                accounts[0],
                accounts[1],
                accounts[2]
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data",
            config.web3.utils.toWei(10) //endowment
        )

        /// Assert that all the validity switches fired off as true.
        let bools = validateTx.logs.find(e => e.event === "LogSwitches")
        bools.args.switches.forEach((bool, index) => assert(bool === true, `Switch number ${index} didn't assert.`))

        /// Now let's set up a factory and launch the request.
        
        /// We need a request tracker for the factory
        let requestTracker = await RequestTracker.deployed()
        expect(requestTracker.address).to.exist

        /// Pass the request tracker to the factory
        let requestFactory = await RequestFactory.new(requestTracker.address)
        expect(requestFactory.address).to.exist 

        /// Create a request with the same args we validated
        let createTx = await requestFactory.createRequest(
            [
                accounts[0],
                accounts[1], //donation benefactor
                accounts[2] // to
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data"
        )

        let event = createTx.logs.find(e => e.event === "RequestCreated")
        expect(event.args.request).to.exist
        
        /// Now let's create a transactionRequest instance
        let txRequest = await TransactionRequest.at(event.args.request)
        let requestData = await txRequest.requestData()

        let logs = requestData.logs.find(e => e.event === "RequestData")
        
        /// Assert correct address values
        let addressValues = logs.args.addressArgs

        // claimed by
        assert(addressValues[0] === NULL_ADDR)
        // created by
        assert(addressValues[1] === accounts[0])
        // owner
        assert(addressValues[2] === accounts[0])
        // donation benefactor
        assert(addressValues[3] === accounts[1])
        // payment benefactor
        assert(addressValues[4] === NULL_ADDR)
        // to address
        assert(addressValues[5] === accounts[2])

        /// assert correct boolean values
        let boolValues = logs.args.bools 

        // is cancelled
        assert(boolValues[0] === false)
        // was called
        assert(boolValues[1] === false)
        // was successful
        assert(boolValues[2] === false)

        /// assert correct uint values
        let uintValues = logs.args.uintArgs

        // Since we got an array of bignumbers we convert them
        uintValues = uintValues.map(val => val.toNumber())

        // donation
        assert(uintValues[2] === donation)
        // donation owed
        assert(uintValues[3] === 0)
        // payment
        assert(uintValues[4] === payment)
        // payment owed
        assert(uintValues[5] === 0)
        // claim window size
        assert(uintValues[6] === claimWindowSize)
        // freeze period
        assert(uintValues[7] === freezePeriod)
        // reserved window size
        assert(uintValues[8] === reservedWindowSize)
        // temporal unit
        assert(uintValues[9] === temporalUnit)
        // window size
        assert(uintValues[10] === windowSize)
        // window start
        assert(uintValues[11] === windowStart)
        // callGas
        assert(uintValues[12] === callGas)
        // callValue
        assert(uintValues[13] === callValue)

        /// Lastly, we just make sure that the transaction request
        ///  address is a known request for the factory.
        await requestFactory.isKnownRequest(NULL_ADDR)
            .should.be.rejectedWith('VM Exception while processing transaction: invalid opcode')

        /// I don't know why or how, but this function actually returns a boolean
        ///  from Solidity, so we check its truthiness
        let isKnown = await requestFactory.isKnownRequest(txRequest.address)
        assert(isKnown === true)
    })

    it('should test request factory insufficient endowment validation error', async function() {
        const curBlock = await config.web3.eth.getBlockNumber()

        const requestLib = await RequestLib.deployed()
        expect(requestLib.address).to.exist

        let claimWindowSize = 255
        let donation = 12345
        let payment = 54321
        let freezePeriod = 10
        let windowStart = curBlock + 20
        let windowSize = 255
        let reservedWindowSize = 16
        let temporalUnit = 1
        let callValue = 123456789
        let callGas = 1000000

        /// Validate the data with the RequestLib
        let validateTx = await requestLib.validate(
            [
                accounts[0],
                accounts[0],
                accounts[1],
                accounts[2]
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data",
            1 //endowment ATTENTION THIS IS TOO SMALL, HENCE WHY IT FAILS
        )

        /// Assert that all the validity switches fired off as true.
        let bools = validateTx.logs.find(e => e.event === "LogSwitches")
        bools.args.switches.forEach((bool, index) => {
            // Now we check that the first bool didn't fire off correctly,
            //  since the endowment is too small.
            if (index === 0) {
                assert(bool === false, `Switch number ${index} didn't assert.`)
            } else { // The rest of them should be true.
                assert(bool === true, `Switch number ${index} didn't assert.`)
            }
        })
    })

    it('should test request factory throws validation error on too large of a reserve window', async function() {
        const curBlock = await config.web3.eth.getBlockNumber()
        
        const requestLib = await RequestLib.deployed()
        expect(requestLib.address).to.exist

        let claimWindowSize = 255
        let donation = 12345
        let payment = 54321
        let freezePeriod = 10
        let windowStart = curBlock + 20
        let windowSize = 255
        let reservedWindowSize = 255 + 2 // 2 more than window size
        let temporalUnit = 1
        let callValue = 123456789
        let callGas = 1000000

         /// Validate the data with the RequestLib
         let validateTx = await requestLib.validate(
            [
                accounts[0],
                accounts[0],
                accounts[1],
                accounts[2]
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data",
            config.web3.utils.toWei(10) //endowment
        )

        /// Assert that all the validity switches fired off as true.
        let bools = validateTx.logs.find(e => e.event === "LogSwitches")
        bools.args.switches.forEach((bool, index) => {
            // Now we check that the second bool didn't fire off correctly,
            //  since the reserved window is too big
            if (index === 1) {
                assert(bool === false, `Switch number ${index} didn't assert.`)
            } else { // The rest of them should be true.
                assert(bool === true, `Switch number ${index} didn't assert.`)
            }
        })
    })

    it('should test request factory throws invalid temporal unit validation error', async function() {
        const curBlock = await config.web3.eth.getBlockNumber()
        
        const requestLib = await RequestLib.deployed()
        expect(requestLib.address).to.exist

        let claimWindowSize = 255
        let donation = 12345
        let payment = 54321
        let freezePeriod = 10
        let windowStart = curBlock + 20
        let windowSize = 255
        let reservedWindowSize = 16
        let temporalUnit = 3 // Only 1 and 2 are supported
        let callValue = 123456789
        let callGas = 1000000

         /// Validate the data with the RequestLib
         let validateTx = await requestLib.validate(
            [
                accounts[0],
                accounts[0],
                accounts[1],
                accounts[2]
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data",
            config.web3.utils.toWei(10) //endowment
        )

        /// Assert that all the validity switches fired off as true.
        let bools = validateTx.logs.find(e => e.event === "LogSwitches")
        bools.args.switches.forEach((bool, index) => {
            // Now we check that the third and fourth bool didn't fire off correctly.
            if (index === 2 || index === 3) {
                assert(bool === false, `Switch number ${index} didn't assert.`)
            } else { // The rest of them should be true.
                assert(bool === true, `Switch number ${index} didn't assert.`)
            }
        })
    })

    it('should test request factory too soon execution window validation error', async function() {
        const curBlock = await config.web3.eth.getBlockNumber()
        
        const requestLib = await RequestLib.deployed()
        expect(requestLib.address).to.exist

        let claimWindowSize = 255
        let donation = 12345
        let payment = 54321
        let freezePeriod = 11 // more than the blocks between now and the window start
        let windowStart = curBlock + 10
        let windowSize = 255
        let reservedWindowSize = 16
        let temporalUnit = 1
        let callValue = 123456789
        let callGas = 1000000

         /// Validate the data with the RequestLib
         let validateTx = await requestLib.validate(
            [
                accounts[0],
                accounts[0],
                accounts[1],
                accounts[2]
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data",
            config.web3.utils.toWei(10) //endowment
        )

        /// Assert that all the validity switches fired off as true.
        let bools = validateTx.logs.find(e => e.event === "LogSwitches")
        bools.args.switches.forEach((bool, index) => {
            // Now we check that the fourth bool didn't fire off correctly.
            if (index === 3) {
                assert(bool === false, `Switch number ${index} didn't assert.`)
            } else { // The rest of them should be true.
                assert(bool === true, `Switch number ${index} didn't assert.`)
            }
        })
    })

    it('should test request factory has too high call gas validation error', async function() {
        const curBlock = await config.web3.eth.getBlockNumber()
        
        const requestLib = await RequestLib.deployed()
        expect(requestLib.address).to.exist

        let claimWindowSize = 255
        let donation = 12345
        let payment = 54321
        let freezePeriod = 10
        let windowStart = curBlock + 20
        let windowSize = 255
        let reservedWindowSize = 16
        let temporalUnit = 1
        let callValue = 123456789
        let callGas = 8.8e8 // cannot be over gas limit

         /// Validate the data with the RequestLib
         let validateTx = await requestLib.validate(
            [
                accounts[0],
                accounts[0],
                accounts[1],
                accounts[2]
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data",
            config.web3.utils.toWei(10) //endowment
        )

        /// Assert that all the validity switches fired off as true.
        let bools = validateTx.logs.find(e => e.event === "LogSwitches")
        bools.args.switches.forEach((bool, index) => {
            // Now we check that the fifth bool didn't fire off correctly.
            // Throws the first bool since endowment is based on callGas.
            if (index === 0 || index === 4) {
                assert(bool === false, `Switch number ${index} didn't assert.`)
            } else { // The rest of them should be true.
                assert(bool === true, `Switch number ${index} didn't assert.`)
            }
        })
    })

    it('should test null to address validation error', async function() {
        const curBlock = await config.web3.eth.getBlockNumber()
        
        const requestLib = await RequestLib.deployed()
        expect(requestLib.address).to.exist

        let claimWindowSize = 255
        let donation = 12345
        let payment = 54321
        let freezePeriod = 10
        let windowStart = curBlock + 20
        let windowSize = 255
        let reservedWindowSize = 16
        let temporalUnit = 1
        let callValue = 123456789
        let callGas = 1000000

         /// Validate the data with the RequestLib
         let validateTx = await requestLib.validate(
            [
                accounts[0],
                accounts[0],
                accounts[1],
                NULL_ADDR // TO ADDRESS
            ], [
                donation,
                payment,
                claimWindowSize,
                freezePeriod,
                reservedWindowSize,
                temporalUnit,
                windowSize,
                windowStart,
                callGas,
                callValue
            ],
            "this-is-call-data",
            config.web3.utils.toWei(10) //endowment
        )

        /// Assert that all the validity switches fired off as true.
        let bools = validateTx.logs.find(e => e.event === "LogSwitches")
        bools.args.switches.forEach((bool, index) => {
            // Now we check that the sixth bool didn't fire off correctly.
            if (index === 5) {
                assert(bool === false, `Switch number ${index} didn't assert.`)
            } else { // The rest of them should be true.
                assert(bool === true, `Switch number ${index} didn't assert.`)
            }
        })
    })
})