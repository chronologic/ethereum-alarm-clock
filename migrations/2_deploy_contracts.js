let BaseScheduler               = artifacts.require("./BaseScheduler.sol"),
    BlockScheduler              = artifacts.require("./BlockScheduler.sol"),
    ClaimLib                    = artifacts.require("./ClaimLib.sol"),
    Digger                      = artifacts.require("./Digger.sol"),
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
    SafeSendLib                 = artifacts.require("./SafeSendLib.sol"),
    SchedulerInterface          = artifacts.require("./SchedulerInterface.sol"),
    SchedulerLib                = artifacts.require("./SchedulerLib.sol"),
    TimestampScheduler          = artifacts.require("./TimestampScheduler.sol"),
    TransactionRequest          = artifacts.require("./TransactionRequest.sol"),
    TransactionRequestInterface = artifacts.require("./TransactionRequestInterface.sol");

module.exports = function(deployer) {

    deployer.deploy(MathLib);
    deployer.deploy(GroveLib);
    deployer.deploy(IterTools);
    deployer.deploy(ExecutionLib);
    deployer.deploy(Digger);
    deployer.deploy(RequestMetaLib);

    deployer.link(MathLib, SafeSendLib);
    deployer.deploy(SafeSendLib);

    deployer.link(MathLib, ClaimLib);
    deployer.link(SafeSendLib, ClaimLib);
    deployer.deploy(ClaimLib);

    deployer.link(ExecutionLib, PaymentLib);
    deployer.link(MathLib, PaymentLib);
    deployer.link(SafeSendLib, PaymentLib);
    deployer.deploy(PaymentLib);

    deployer.link(MathLib, RequestScheduleLib);
    deployer.deploy(RequestScheduleLib);

    deployer.link(ClaimLib, RequestLib);
    deployer.link(ExecutionLib, RequestLib);
    deployer.link(MathLib, RequestLib);
    deployer.link(PaymentLib, RequestLib);
    deployer.link(RequestMetaLib, RequestLib);
    deployer.link(RequestScheduleLib, RequestLib);
    deployer.link(SafeSendLib, RequestLib);
    deployer.deploy(RequestLib);

    deployer.link(MathLib, SchedulerLib);
    deployer.link(PaymentLib, SchedulerLib);
    deployer.link(RequestLib, SchedulerLib);
    deployer.link(SafeSendLib, SchedulerLib);
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

    deployer.link(Digger, TransactionRequest);
    deployer.link(ClaimLib, TransactionRequest);
    deployer.link(ExecutionLib, TransactionRequest);
    deployer.link(MathLib, TransactionRequest);
    deployer.link(PaymentLib, TransactionRequest);
    deployer.link(RequestMetaLib, TransactionRequest);
    deployer.link(RequestLib, TransactionRequest);
    deployer.link(RequestScheduleLib, TransactionRequest);
    deployer.link(SafeSendLib, TransactionRequest);
    deployer.deploy(TransactionRequest);

    deployer.link(IterTools, RequestFactory);
    deployer.link(PaymentLib, RequestFactory);
    deployer.link(RequestLib, RequestFactory);
    deployer.link(SafeSendLib, RequestFactory);
    deployer.link(RequestTracker, RequestFactory);
    deployer.link(TransactionRequest, RequestFactory);
    deployer.deploy(RequestFactory);

};
