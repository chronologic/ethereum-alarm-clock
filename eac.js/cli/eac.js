#!/usr/bin/env node

const program = require('commander')
const chalk = require('chalk')

const alarmClient = require('../client/main.js')
const schedule = require('../scheduler.js')
// temporary
const testScheduler = require('../testScheduler.js')

const readlineSync = require('readline-sync')
const clear = require('clear')

const ethUtil = require('ethereumjs-util')

const log = {
    debug: msg => console.log(chalk.green(msg)),
    info: msg => console.log(chalk.blue(msg)),
    warning: msg => console.log(chalk.yellow(msg)),
    error: msg => console.log(chalk.red(msg)),
    fatal: msg => console.log(`[FATAL] ${msg}`)
}

program 
    .version('0.9.0-beta')
    .option('-t, --test', 'sends a test transaction to the network')
    .option('--createWallet', 'guides you through creating a new wallet.')
    .option('-c, --client', 'starts the executing client')
    .option('-m, --milliseconds <ms>', 'tells the client to scan every <ms> seconds', 4000)
    .option('--logfile [path]', 'specifies the output logifle', 'default')
    .option('--chain [ropsten, rinkeby]', 'selects the chain to use')
    .option('--provider <string>', 'set the HttpProvider to use', 'http://localhost:8545')
    .option('-w, --wallet [path]', 'specify the path to the keyfile you would like to unlock', 'none')
    .option('-p, --password [string]', 'the password to unlock your keystore file', 'password')
    .option('-s, --schedule', 'schedules a transactions')
    .parse(process.argv)

const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider(`${program.provider}`)
const web3 = new Web3(provider)

const main = async _ => {
    if (program.test) 
    {
        if (program.chain != 'ropsten'
            && program.chain != 'rinkeby') {
            throw new Error('Only the ropsten and rinkeby networks are currently supported.')
        }

        testScheduler(program.chain, web3)
    }

    else if (program.createWallet) {
        clear()
    
        const numAccounts = readlineSync.question(chalk.blue('How many accounts would you like in your wallet?\n> '))
    
        function isNumber(n) { return !isNaN(parseFloat(n)) && !isNaN(n - 0) }
    
        if (!isNumber(numAccounts) || numAccounts > 10 || numAccounts <= 0) {
            log.error('Must specify a number between 1 - 10 for number of accounts.')
            process.exit(1)
        }
    
        const file = readlineSync.question(chalk.blue('Where would you like to save the encrypted keys? Please provide a valid filename or path.\n> '))
        const password = readlineSync.question(chalk.blue("Please enter a password for the keyfile. Write this down!\n> "))
    
        await require('../wallet/1_createWallet').createWallet(web3, numAccounts, file, password)
        process.exit(1)
    }

    else if (program.client) 
    {
            clear()
            console.log(chalk.green('⏰⏰⏰ Welcome to the Ethereum Alarm Clock client ⏰⏰⏰\n'))

            if (program.chain != 'ropsten'
                && program.chain != 'rinkeby') {
                throw new Error('Only the ropsten and rinkeby networks are currently supported.')
            }
        
            alarmClient(
                web3,
                program.provider,
                program.milliseconds,
                program.logfile,
                program.chain,
                program.wallet,
                program.password
            ).catch(err => {
                if (err.toString().indexOf('Invalid JSON RPC') !== -1) {
                    log.error(`Received invalid RPC response, please make sure the blockchain is running.\n`)
                } else {
                    log.fatal(err)
                }
                process.exit(1)
            })
    }
    
    else if (program.schedule) 
    {
            /// Starts the scheduling wizard.
            clear()
            log.info('🧙 🧙 🧙  Schedule a transaction  🧙 🧙 🧙\n')

            // let toAddress
            let callData
            let callGas
            let callValue 
            let windowSize 
            let windowStart 
            let gasPrice 
            let donation
            let payment 

            let toAddress = readlineSync.question(chalk.black.bgBlue('Enter the recipient address:\n'))

            /// Validate the address 
            toAddress = ethUtil.addHexPrefix(toAddress)
            if (!ethUtil.isValidAddress(toAddress)) {
                log.error('Not a valid address')
                log.fatal('exiting...')
                process.exit(1)
            }

            callData = readlineSync.question(chalk.black.bgBlue('Enter call data: [press enter to skip]\n'))

            if (!web3.utils.isHex(callData)) {
                callData = web3.utils.utf8ToHex(callData)
            }

            callGas = readlineSync.question(chalk.black.bgBlue(`Enter the call gas: [press enter for recommended]\n`))

            if (!callGas) {
                callGas = 3000000
            }

            callValue = readlineSync.question(chalk.black.bgBlue('Enter call value:\n'))

            if (!callValue) {
                callValue = 0
            }

            windowSize = readlineSync.question(chalk.black.bgBlue('Enter window size:\n'))

            if (!windowSize) {
                windowsize = 255
            }

            windowStart = readlineSync.question(chalk.black.bgBlue(`Enter window start: [Current block number - ${await web3.eth.getBlockNumber()}\n`))

            if (windowStart < await web3.eth.getBlockNumber() + 15) {
                log.error('That window start time is too soon!')
                process.exit(1)
            }

            gasPrice = readlineSync.question(chalk.black.bgBlue('Enter a gas price:\n'))

            if (!gasPrice) {
                gasPrice = web3.utils.toWei('50', 'gwei')
            }

            donation = readlineSync.question(chalk.black.bgBlue('Enter a donation amount:\n'))

            if (!donation) {
                donation = 33
            }

            payment = readlineSync.question(chalk.black.bgBlue('Enter a payment amount:\n'))

            if (!payment) {
                payment = 0
            }

            clear()

            web3.eth.defaultAccount = (await web3.eth.getAccounts())[0]
            if (web3.eth.defaultAccount === null) throw new Error('Need to unlock a primary account on your client!')


            log.debug(`
    toAddress   - ${toAddress}
    callData    - ${callData}
    callGas     - ${callGas}
    callValue   - ${callValue}
    windowSize  - ${windowSize}
    windowStart - ${windowStart}
    gasPrice    - ${gasPrice}
    donation    - ${donation}
    payment     - ${payment}

    Sending from ${web3.eth.defaultAccount}
    `)

            const confirm = readlineSync.question('Are all of these variables correct? [Y/n]\n')
            if (confirm === '' || confirm.toLowerCase() === 'y') {
                /// Do nothing, just continue
            } else {
                log.error('quitting!')
                setTimeout(() => process.exit(1), 1500)
                return
            }

            console.log('\n')

            const ora = require('ora')       
            const spinner = ora('Sending transaction! Waiting for a response...').start()

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
                if (res.status != 1) {
                    spinner.fail(`Transaction mined but something went wrong. Please investigate the transaction at hash ${res.transactionHash} for more information.`)
                    process.exit(1)
                }
                spinner.succeed(`Transaction mined! Hash: ${res.transactionHash}`)
            })
            .catch(err => {
                spinner.fail('Something went wrong! See the error message below.\n')
                setTimeout(() => console.log(err), 2000)
            })    

    }
    
    else 
    {
        clear()
        log.info('Please start eac with one of these options:\n-c to run the client\n-t to schedule a test transaction\n-s to enter scheduling wizard')
        process.exit(1)
    }
}

main()
.catch(e => {
    log.fatal(e)
    process.exit(1)
})