// Contracts
const BlockScheduler = artifacts.require('./BlockScheduler.sol')

// Libraries
const ClaimLib = artifacts.require('./ClaimLib.sol')
const ExecutionLib = artifacts.require('./ExecutionLib.sol')
const GroveLib = artifacts.require('./GroveLib.sol')
const MathLib = artifacts.require('./MathLib.sol')
const PaymentLib = artifacts.require('./PaymentLib.sol')
const RequestLib = artifacts.require('./RequestLib.sol')
const RequestMetaLib = artifacts.require('./RequestMetaLib.sol')
const RequestScheduleLib = artifacts.require('./RequestScheduleLib.sol')
const SchedulerLib = artifacts.require('./SchedulerLib.sol')

// To be deprecated
const SafeSendLib = artifacts.require('./SafeSendLib.sol')

module.exports = function(deployer) {
    /// Libraries first...
    deployer.deploy(ExecutionLib).then(() => {
        deployer.deploy(MathLib).then(() => {
            deployer.deploy(RequestMetaLib).then(()=> {
                deployer.link(MathLib, SafeSendLib).then(() => {
                    deployer.deploy(SafeSendLib).then(() => {
                        deployer.link(MathLib, RequestScheduleLib).then(() => {
                            deployer.deploy(RequestScheduleLib).then(() => {
                                deployer.link(MathLib, ClaimLib).then(() => {
                                    deployer.link(SafeSendLib, ClaimLib).then(() => {
                                        deployer.deploy(ClaimLib).then(() => {
                                            deployer.link(ExecutionLib, PaymentLib).then(() => {
                                                deployer.link(MathLib, PaymentLib).then(() => {
                                                    deployer.link(SafeSendLib, PaymentLib).then(() => {
                                                        deployer.deploy(PaymentLib).then(() => {
                                                            deployer.link(ClaimLib, RequestLib).then(() => {
                                                                deployer.link(ExecutionLib, RequestLib)
                                                                deployer.link(MathLib, RequestLib)
                                                                deployer.link(PaymentLib, RequestLib)
                                                                deployer.link(RequestMetaLib, RequestLib)
                                                                deployer.link(RequestScheduleLib, RequestLib)
                                                                deployer.link(SafeSendLib, RequestLib)
                                                                deployer.deploy(RequestLib).then(() => {
                                                                    deployer.link(MathLib, SchedulerLib)
                                                                    deployer.link(PaymentLib, SchedulerLib)
                                                                    deployer.link(RequestLib, SchedulerLib)
                                                                    deployer.link(RequestScheduleLib, SchedulerLib)
                                                                    deployer.link(SafeSendLib, SchedulerLib)
                                                                    deployer.deploy(SchedulerLib).then(() => {                                                                        /// Now we can deploy the contract we want...
                                                                        deployer.link(SchedulerLib, BlockScheduler).then(() => {
                                                                            deployer.link(RequestScheduleLib, BlockScheduler)
                                                                            deployer.deploy(BlockScheduler)
                                                                        })
                                                                    })
                                                                })
                                                            })
                                                        })
                                                    })                                                 
                                                })                                          
                                            })
                                        })
                                    })  
                                })  
                            }) 
                        })  
                    })
                })
            })
        })
    })
};
