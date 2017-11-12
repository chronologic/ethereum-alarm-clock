/**
 * Usecases from a client's perspective.
 */
let should = require("should");

let RequestTracker      = artifacts.require("./RequestTracker.sol"),
    RequestFactory      = artifacts.require("./RequestFactory.sol"),
    RequestLib          = artifacts.require("./RequestLib.sol"),
    PaymentLib          = artifacts.require("./PaymentLib.sol"),
    TransactionRequest  = artifacts.require("./TransactionRequest.sol"),
    TransactionRecorder = artifacts.require("./TransactionRecorder.sol");

let config = require("../../config");

contract('Request Execution', (accounts) => {

    it("should create a new request", async () => {
        let txRecorder = await TransactionRecorder.new();

        let wasCalled     = await txRecorder.wasCalled();
        let lastCaller    = await txRecorder.lastCaller();
        let lastCallValue = await txRecorder.lastCallValue();
        let lastCallGas   = await txRecorder.lastCallGas();
        let lastCallData  = await txRecorder.lastCallData();

        (wasCalled).should.not.be.true();
        (lastCaller).should.be.exactly('0x0000000000000000000000000000000000000000');
        (lastCallValue.toNumber()).should.equal(0);
        (lastCallGas.toNumber()).should.equal(0);
        (lastCallData).should.equal("0x0000000000000000000000000000000000000000000000000000000000000000");


        await txRecorder.sendTransaction({
            callGas: 123456,
            callValue: 121212,
            gas: 3000000
        });

        wasCalled     = await txRecorder.wasCalled();
        lastCaller    = await txRecorder.lastCaller();
        lastCallValue = await txRecorder.lastCallValue();
        lastCallGas   = await txRecorder.lastCallGas();
        lastCallData  = await txRecorder.lastCallData();

        (wasCalled).should.be.true();
        (lastCaller).should.be.exactly(accounts[0]);

        console.log(wasCalled);
        console.log(lastCaller, accounts[0]);
        console.log(lastCallValue.toNumber());
        console.log(lastCallGas.toNumber());
        console.log(lastCallData);

    });
});
