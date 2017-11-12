const BigNumber = require('bignumber.js')
const assertFail = require('../_helpers/assertFail.js')

/// Contracts
const BlockScheduler = artifacts.require('./BlockScheduler.sol')

/// Libraries
const SchedulerLib = artifacts.require('./SchedulerLib.sol')

contract('BlockScheduler', function(accounts) {
    const Owner = accounts[0]
    const User1 = accounts[1]
    const User2 = accounts[2]

    let blockScheduler
    let schedulerLib

    it('should deploy', async function() {
        // schedulerLib = await SchedulerLib.new()
        blockScheduler = await BlockScheduler.deployed()
    })
})