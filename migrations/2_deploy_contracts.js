const BlockScheduler = artifacts.require('./BlockScheduler.sol')

// Libraries
const MathLib = artifacts.require('./MathLib.sol')
const RequestScheduleLib = artifacts.require('./RequestScheduleLib.sol')

module.exports = function(deployer) {
    /// Libraries first...
    deployer.deploy(MathLib)
    deployer.link(MathLib, RequestScheduleLib)
    deployer.deploy(RequestScheduleLib)
    /// ... and then the Contract we want.
    deployer.link(RequestScheduleLib, BlockScheduler)
    deployer.deploy(BlockScheduler)
};
