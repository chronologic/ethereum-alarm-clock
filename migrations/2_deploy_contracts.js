let BaseScheduler               = artifacts.require("./BaseScheduler.sol"),
    BlockScheduler              = artifacts.require("./BlockScheduler.sol"),
    ClaimLib                    = artifacts.require("./ClaimLib.sol"),
    ExecutionLib                = artifacts.require("./ExecutionLib.sol"),
    GroveLib                    = artifacts.require("./GroveLib.sol"),
    IterTools                   = artifacts.require("./IterTools.sol"),
    MathLib                     = artifacts.require("./MathLib.sol"),
    PaymentLib                  = artifacts.require("./PaymentLib.sol"),
    RequestFactory              = artifacts.require("./RequestFactory.sol"),
    RequestFactoryInterface     = artifacts.require("./RequestFactoryInterface.sol"),
    RequestLib                  = artifacts.require("./RequestLib.sol"),
    RequestMetaLib              = artifacts.require("./RequestMetaLib.sol"),
    RequestScheduleLib          = artifacts.require("./RequestScheduleLib.sol"),
    RequestTracker              = artifacts.require("./RequestTracker.sol"),
    RequestTrackerInterface     = artifacts.require("./RequestTrackerInterface.sol"),
    SafeMath                    = artifacts.require("./SafeMath.sol"),
    SchedulerInterface          = artifacts.require("./SchedulerInterface.sol"),
    SchedulerLib                = artifacts.require("./SchedulerLib.sol"),
    TimestampScheduler          = artifacts.require("./TimestampScheduler.sol"),
    TransactionRequest          = artifacts.require("./TransactionRequest.sol"),
    TransactionRequestInterface = artifacts.require("./TransactionRequestInterface.sol");

let TransactionRecorder = artifacts.require("./test/TransactionRecorder.sol");

module.exports = function(deployer) {

    deployer.deploy(MathLib);
    deployer.deploy(GroveLib);
    deployer.deploy(IterTools);
    deployer.deploy(ExecutionLib);
    deployer.deploy(RequestMetaLib);
    deployer.deploy(SafeMath);    

    deployer.link(SafeMath, ClaimLib);
    deployer.deploy(ClaimLib);

    deployer.link(ExecutionLib, PaymentLib);
    deployer.link(MathLib, PaymentLib);
    deployer.link(SafeMath, PaymentLib);
    deployer.deploy(PaymentLib);

    deployer.link(SafeMath, RequestScheduleLib);
    deployer.deploy(RequestScheduleLib);

    deployer.link(ClaimLib, RequestLib);
    deployer.link(ExecutionLib, RequestLib);
    deployer.link(MathLib, RequestLib);
    deployer.link(PaymentLib, RequestLib);
    deployer.link(RequestMetaLib, RequestLib);
    deployer.link(RequestScheduleLib, RequestLib);
    deployer.link(SafeMath, RequestLib);
    deployer.deploy(RequestLib);

    deployer.link(MathLib, SchedulerLib);
    deployer.link(PaymentLib, SchedulerLib);
    deployer.link(RequestLib, SchedulerLib);
    deployer.link(SafeMath, SchedulerLib);
    deployer.deploy(SchedulerLib);

    deployer.link(RequestScheduleLib, BaseScheduler);
    deployer.link(SchedulerLib, BaseScheduler);
    deployer.deploy(BaseScheduler);

    deployer.link(SchedulerLib, BlockScheduler);
    deployer.link(RequestScheduleLib, BlockScheduler);
    deployer.deploy(BlockScheduler);

    deployer.link(BaseScheduler, TimestampScheduler);
    deployer.link(SchedulerLib, TimestampScheduler);
    deployer.link(RequestScheduleLib, TimestampScheduler);
    deployer.deploy(TimestampScheduler);

    deployer.link(GroveLib, RequestTracker);
    deployer.link(MathLib, RequestTracker);
    deployer.deploy(RequestTracker);

    deployer.link(ClaimLib, TransactionRequest);
    deployer.link(ExecutionLib, TransactionRequest);
    deployer.link(MathLib, TransactionRequest);
    deployer.link(PaymentLib, TransactionRequest);
    deployer.link(RequestMetaLib, TransactionRequest);
    deployer.link(RequestLib, TransactionRequest);
    deployer.link(RequestScheduleLib, TransactionRequest);
    deployer.link(SafeMath, TransactionRequest);
    deployer.deploy(TransactionRequest).then(() => {
        deployer.link(MathLib, RequestFactory);
        deployer.link(RequestScheduleLib, RequestFactory);
        deployer.link(IterTools, RequestFactory);
        deployer.link(PaymentLib, RequestFactory);
        deployer.link(RequestLib, RequestFactory);
        deployer.link(RequestTracker, RequestFactory);
        deployer.link(TransactionRequest, RequestFactory);
        deployer.link(SafeMath, RequestFactory);
        deployer.deploy(RequestFactory, RequestTracker.address);
    })

    deployer.deploy(TransactionRecorder);

};