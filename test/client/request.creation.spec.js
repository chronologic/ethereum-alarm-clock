/**
 * Usecases from a client's perspective.
 */

let RequestTracker     = artifacts.require("./RequestTracker.sol"),
    RequestFactory     = artifacts.require("./RequestFactory.sol"),
    RequestLib         = artifacts.require("./RequestLib.sol"),
    PaymentLib         = artifacts.require("./PaymentLib.sol"),
    TransactionRequest = artifacts.require("./TransactionRequest.sol");

contract('Request Creation', (accounts) => {

    it("should create a new request", async () => {
        let requestTracker = await RequestTracker.deployed();
        let requestFactory = await RequestFactory.deployed();
        let requestLib     = await RequestLib.deployed();
        let paymentLib     = await PaymentLib.deployed();

        let donation           = 0,
            payment            = 0,
            claimWindowSize    = 0,
            freezePeriod       = 0,
            reservedWindowSize = 0,
            temporalUnit       = 0,
            windowSize         = 0,
            windowStart        = 0,
            callGas            = 300000,
            callValue          = 12345,
            requiredStackDepth = 0;

        let callData = "test-call-data";

        let request = await TransactionRequest.new([
            0x0,
            0x0,
            0x0
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
            callValue,
            requiredStackDepth
        ], callData);

        assert(request.address);
        console.log(request.address)
    });
});
