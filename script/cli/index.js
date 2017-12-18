#!/usr/bin/env node

const commander = require('commander')
const chalk = require('chalk')

const alarmClient = require('../client/main.js')
const Scheduler = require('../scheduler.js')
const testScheduler = require('../schedule.js')

const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)

const ethUtil = require('ethereumjs-util')

const readlineSync = require('readline-sync');

const log = {
    debug: msg => console.log(chalk.green(msg)),
    info: msg => console.log(chalk.blue(msg)),
    warning:  msg => console.log(chalk.yellow(msg)),
    error: msg => console.log(chalk.red(msg)),
    fatal: msg => console.log(`[FATAL] ${msg}`)
}

commander 
    .version('0.9.0')
    .option('-t, --test', 'testing')
    .option('-c, --client', 'starts the client')
    .option('-m, --milliseconds <ms>', 'tells the client to scan every <ms> seconds', 4000)
    .option('--logfile [path]', 'specifies the output logifle', 'console')
    .option('--chain [ropsten, mainnet]', 'selects the chain to use', 'ropsten')
    .option('-w, --wallet [path]', 'specify the path to the keyfile you would like to unlock', 'none')
    .option('-p, --password [string]', 'the password to unlock your keystore file', 'password')
    .option('-s, --schedule', 'schedules a transactions')
    .parse(process.argv)

if (commander.test) {
    testScheduler(true)
    .catch(err => log.error(err))
} else {
    if (commander.client) {
        alarmClient(
            commander.milliseconds,
            commander.logfile,
            commander.chain,
            commander.wallet,
            commander.password
        )
        .catch(err => log.error(err))
    } else if (commander.schedule) {
        log.info('Schedule a transcation with the EAC')

        let toAddress
        let callData
        let callGas
        let callValue 
        let windowSize 
        let windowStart 
        let gasPrice 
        let donation
        let payment 

        toAddress = readlineSync.question('Enter the recipient address: ')

        /// Validate the address 
        toAddress = ethUtil.addHexPrefix(toAddress)
        if (!ethUtil.isValidAddress(toAddress)) {
            log.error('Not a valid address')
            log.fatal('exiting...')
            process.exit(1)
        }

        callData = readlineSync.question('Enter call data: ')

        /// Just assume utf8 input for now
        callData = web3.utils.utf8ToHex(callData)

        callGas = readlineSync.question('Enter call gas: ')

        callValue = readlineSync.question('Enter call value: ')

        windowSize = readlineSync.question('Enter window size: ')

        windowStart = readlineSync.question('Enter window start: ')

        gasPrice = readlineSync.question('Enter a gas price: ')

        donation = readlineSync.question('Enter a donation amount: ')

        payment = readlineSync.question('Enter a payment amount: ')

        log.debug(`
toAddress - ${toAddress}
callData - ${callData}
callGas - ${callGas}
callValue - ${callValue}
windowSize - ${windowSize}
windowStart - ${windowStart}
gasPrice  - ${gasPrice}
donation - ${donation}
payment - ${payment}
`)

        Scheduler(
            toAddress,
            callData,
            callGas,
            callValue,
            windowSize,
            windowStart,
            gasPrice,
            donation,
            payment
        )
        // var MAX = 60, MIN = 0, value = 30, key;
        // console.log('\n\n' + (new Array(20)).join(' ') +
        //   '[Z] <- -> [X]  FIX: [SPACE]\n');
        // while (true) {
        //   console.log('\x1B[1A\x1B[K|' +
        //     (new Array(value + 1)).join('-') + 'O' +
        //     (new Array(MAX - value + 1)).join('-') + '| ' + value);
        //   key = readlineSync.keyIn('',
        //     {hideEchoBack: true, mask: '', limit: 'zx '});
        //   if (key === 'z') { if (value > MIN) { value--; } }
        //   else if (key === 'x') { if (value < MAX) { value++; } }
        //   else { break; }
        // }        
          
    } else {
        process.exit(1)
    }
}

