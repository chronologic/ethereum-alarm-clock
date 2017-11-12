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

// Contracts
const BlockScheduler = artifacts.require('./BlockScheduler.sol')

module.exports = function(deployer) {
    /// Now we can deploy the contract we want...
    // deployer.link(RequestScheduleLib, BlockScheduler).then(() => {
    //     deployer.deploy(BlockScheduler)
    // })
}