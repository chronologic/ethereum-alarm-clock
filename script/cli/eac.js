#!/usr/bin/env node

const commander = require('commander')
const chalk = require('chalk')
const chalkAnimation = require('chalk-animation');

const alarmClient = require('../client/main.js')
const schedule = require('../scheduler.js')
const testScheduler = require('../schedule.js')

const ethUtil = require('ethereumjs-util')
const readlineSync = require('readline-sync')

const assert = require('chai').assert

const clear = require('clear')

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
    .option('--logfile [path]', 'specifies the output logifle', 'default')
    .option('--chain [ropsten, mainnet]', 'selects the chain to use')
    .option('-w, --wallet [path]', 'specify the path to the keyfile you would like to unlock', 'none')
    .option('-p, --password [string]', 'the password to unlock your keystore file', 'password')
    .option('-s, --schedule', 'schedules a transactions')
    .parse(process.argv)

const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('http://localhost:8545')
const web3 = new Web3(Web3.givenProvider || provider)


if (commander.test) {
    testScheduler(true)
} 
else {
    if (commander.client) {
        clear()
        console.log(chalk.green('⏰⏰⏰ Welcome to the Ethereum Alarm Clock client ⏰⏰⏰\n'))

        if (!commander.chain) commander.chain = 'ropsten'
    
        alarmClient(
            commander.milliseconds,
            commander.logfile,
            commander.chain,
            commander.wallet,
            commander.password
        ).catch(err => {
            if (err.toString().indexOf('Invalid JSON RPC') !== -1) {
                log.error(`Received invalid RPC response, please make sure the blockchain is running.\n`)
            } else {
                log.fatal(err)
            }
            process.exit(1)
        })
    } else if (commander.schedule) {
        /// Starts the scheduling wizard.
        clear()
        log.info('🧙 🧙 🧙  Schedule a transaction  🧙 🧙 🧙\n')

        let toAddress
        let callData
        let callGas
        let callValue 
        let windowSize 
        let windowStart 
        let gasPrice 
        let donation
        let payment 

        toAddress = readlineSync.question(chalk.black.bgBlue('Enter the recipient address:\n'))

        /// Validate the address 
        toAddress = ethUtil.addHexPrefix(toAddress)
        if (!ethUtil.isValidAddress(toAddress)) {
            log.error('Not a valid address')
            log.fatal('exiting...')
            process.exit(1)
        }

        callData = readlineSync.question(chalk.black.bgBlue('Enter call data: [press enter to skip]\n'))

        /// Just assume utf8 input for now
        callData = web3.utils.utf8ToHex(callData)

        callGas = readlineSync.question(chalk.black.bgBlue(`Enter the call gas: [press enter for recommended]\n`))

        callValue = readlineSync.question('Enter call value:\n')

        windowSize = readlineSync.question('Enter window size:\n')

        windowStart = readlineSync.question('Enter window start:\n')

        gasPrice = readlineSync.question('Enter a gas price:\n')

        donation = readlineSync.question('Enter a donation amount:\n')

        payment = readlineSync.question('Enter a payment amount:\n')

        clear()

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

        const confirm = readlineSync.question('Are all of these variables correct? [Y/n]\n')
        if (confirm === '' || confirm.toLowerCase() === 'y') {
            /// Do nothing, just continue
        } else {
            log.error('quitting!')
            setTimeout(() => process.exit(1), 1500)
            return
        }

        /// Next use the requestLib to validate
        const contracts = require('../../ropsten.json')
        const RequestLibABI = require('../RequestLib.json').abi 
        const requestLib = new web3.eth.Contract(
            RequestLibABI,
            contracts.requestLib
        )

        const ora = require('ora')
        const spin_one = ora('Validating scheduled params...').start()
        requestLib.methods.validate(
            [
                web3.eth.defaultAccount,
                web3.eth.defaultAccount,
                0x0,
                toAddress
            ], [
                donation,
                payment,
                
            ]

        ).call()
        .then(isValid => {
            isValid.forEach((bool, idx) => {
                if (!bool) {
                    console.log(idx + ' is false')
                    return 
                }
            })

            spin_one.succeed('Validated!')
            const spin_two = ora('Sending transaction! Will await a response...').start()

            schedule(
                toAddress,
                callData,
                callGas,
                callValue,
                windowSize,
                windowStart,
                gasPrice,
                donation,
                payment
            ).then(res => {
                cosole.log(res.status)
                spinner.succeed(`Transaction mined! Hash: ${res.transactionHash}`)
            })
            .catch(err => {
                spinner.fail('Something went wrong! See the error message below.')
                setTimeout(() => console.log(err), 2000)
            })    
        })
        .catch(err => log.error(err))

    } else {
        log.info('Please start eac with one of these options:\n-c to run the client\n-t to schedule a test transaction\n-s to enter scheduling wizard')
        log.fatal('Exiting!')
        process.exit(1)
    }
}

