/**
 * Usecases from a client's perspective.
 */
const {assert} = require('chai');

let RequestTracker      = artifacts.require("./RequestTracker.sol"),
    RequestFactory      = artifacts.require("./RequestFactory.sol"),
    RequestLib          = artifacts.require("./RequestLib.sol"),
    PaymentLib          = artifacts.require("./PaymentLib.sol"),
    TransactionRequest  = artifacts.require("./TransactionRequest.sol"),
    TransactionRecorder = artifacts.require("./TransactionRecorder.sol");

let config = require("../../../config");

contract('Block Claiming', (accounts) => {

    it("should not claim before first claim block", async () => {
        config.web3.eth.defaultBlock = 255 + 10 + 5;

        let donation           = 0,
            payment            = 0,
            claimWindowSize    = 255,
            freezePeriod       = 10,
            reservedWindowSize = 0,
            temporalUnit       = 0,
            windowSize         = 0,
            windowStart        = config.web3.eth.blockNumber + freezePeriod,
            callGas            = 300000,
            callValue          = 12345,
            requiredStackDepth = 0;

        let callData = "test-call-data";

        let request = await TransactionRequest.new([
            accounts[1],
            accounts[2],
            accounts[3],
            accounts[4],
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

        let blockNumber = await config.web3.eth.getBlockNumber();
        let firstClaimBlock = blockNumber - claimWindowSize;

        assert(firstClaimBlock > blockNumber, "The first claim block should be after current block.");

    });
});