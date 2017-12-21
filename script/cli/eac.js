#!/usr/bin/env node

const commander = require('commander')
const chalk = require('chalk')
const chalkAnimation = require('chalk-animation');

const alarmClient = require('../client/main.js')
const Scheduler = require('../scheduler.js')
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
    .option('--createWallet', 'Guides you through creating a new wallet.')
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

const checkWalletEnabled = numTries => {
    if (numTries >= 4) {
        log.error('Not following instructions!')
        process.exit(1)
    }
    const walletEnabled = readlineSync.question('Enable wallet? [y/n]\n').toLowerCase()

    if (walletEnabled == 'y') {
        wallet = readlineSync.question('Please enter the path to your keystore. Ex. ../wallet/keyfile\n')
        password = readlineSync.question('Password? Case sensitive...\n')
        return [wallet, password]
    } else if (walletEnabled == 'n') {
        wallet = 'none'
        password = 'password'
        return [wallet, password]
    }  else {
        log.error(`Value: ${walletEnabled} not valid! Please pick [y/n].`)
        numTries += 1
        checkWalletEnabled(numTries)
    }
}

if (commander.test) {

    testScheduler(true)
    .catch(err => log.error(err))

} else if (commander.createWallet) {
    clear()

    const numAccounts = readlineSync.question(chalk.blue('How many accounts would you like in your wallet?\n> '))

    function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }

    if (!isNumber(numAccounts) || numAccounts > 10 || numAccounts <= 0) {
        log.error('Must specify a number between 1 - 10 for number of accounts.')
        process.exit(1)
    }

    const file = readlineSync.question(chalk.blue('Where would you like to save the encrypted keys? Please provide a valid filename or path.\n> '))
    const password = readlineSync.question(chalk.blue("Please enter a password for the keyfile. Write this down!\n> "))

    require('../wallet/1_createWallet').createWallet(numAccounts, file, password)
} else {
    if (commander.client) {
        clear()
        console.log(chalk.green('⏰⏰⏰ Welcome to the Ethereum Alarm Clock client ⏰⏰⏰\n'))

        // if (!commander.chain) {
        //     commander.chain = readlineSync.question('Which chain are you using? Options: [ropsten]\n').toLowerCase()
        //     assert(commander.chain == 'ropsten', chalk.red(`MUST USE ROPSTEN`))
        // }
        commander.chain = 'ropsten'
    
        // [commander.wallet, commander.password] = checkWalletEnabled(0)

        alarmClient(
            commander.milliseconds,
            commander.logfile,
            commander.chain,
            commander.wallet,
            commander.password
        )
        .catch(err => {
            if (err.toString().indexOf('Invalid JSON RPC') !== -1) {
                log.error(`Received invalid RPC response, please make sure the blockchain is running.\n`)
            } 
            log.fatal(err)
            process.exit(1)
        })

    } else if (commander.schedule) {
        log.fatal('not yet available. exiting...')
        process.exit(1)
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
        log.info('Please start eac with one of these options:\n-c to run the client\n-t to schedule a test transaction\n-s to enter scheduling wizard')
        log.fatal('Exiting!')
        process.exit(1)
    }
}

