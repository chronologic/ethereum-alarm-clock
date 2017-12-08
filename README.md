# Ethereum Alarm Clock

[![Join the chat at https://gitter.im/pipermerriam/ethereum-alarm-clock](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/pipermerriam/ethereum-alarm-clock?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Source code for the [Ethereum Alarm Clock service](http://www.ethereum-alarm-clock.com/)

WIP - development in progress to get the EAC working. Please join the Gitter chat for active updates.

## What is the EAC (Ethereum Alarm Clock)

The Ethereum Alarm Clock is a smart contract protocol for scheduling Ethereum transactions to be executed in the future. It allows any address to set the gas, value and bytecode parameters of a custom transaction and gives _pretty_ good guarantees that the transaction will be executed during a desired window. The EAC is agnostic to callers so can be used by both users and other smart contracts.

Additionally the EAC faciliates the execution of this pool of scheduled transactions through a command-line client. The EAC daemon continuously runs and searches for transactions which are scheduled to be executed soon then claims and executes them. Part of the design goal is to design incentives for people to run the EAC daemon for some sort of profit. 

## Running the tests

_Tests have been ported to JavaScript and can now be run using the Truffle Suite_

Originally the test suite was written in Python using the Populus framework, these still exist for reference under the tests/ directory. However, we have ported over the suite to use the Truffle framework since this may be more familiar to developers who know the JavaScript Ethereum tooling. These tests can be found in the test/ directory but be warned - this repo is in active development and many of the tests are likely to start breaking. If you would like to fix or contribute a test please open an issue or contribute a pull request. 

If you would like to run the test please set up your environment to use node v8.0.0, truffle v4.0.1 and the latest ganache-cli.

```
nvm use 8.0.0
npm i
npm i -g truffle@4.0.1 
npm i -g ganache-cli
```

Start ganache-cli in a terminal screen by running `ganache-cli`.

In another terminal screen run `npm test` at the root of the directory. This will run the npm test script that splits up the tests into different runtimes. We did this because the EAC is a moderately sized project and running all the tests with one command has a tendency to break down the ganache tester chain.

Each time you run the tests it is advised to rebuild your build/ folder, as this may lead to bugs if not done. You can do this by running the command `rm -rf build/`.

## Documentation

Currently there exists the original documentation in the docs/ directory, but I make no guarantees that anything in there is up-to-date. Part of the work of the revitalization effort is to produce more in-line documentation in the code. To be safe, always refer to the documentation in the code as the final say as changes are migrating from the codebase back out into the docs currently. 

We _will soon_ host developer documentation via Doxitiy on github pages.

## Deployment

The EAC contracts are deployed on Ropsten at the addresses below.

baseScheduler, 0x06eca20d5a4f9e9c1dac5d5e3a8b86d8264087e6
blockSceduler, 0x756377d64d005357d68b09090973a19b52ef0b4e
claimLib, 0xf0cb482306cd182c95e89a305680ad1c95aaef9c
executionLib, 0x9c12065b57567727ab055a5cdf61862dfd75f7c3
groveLib, 0x58d685a216aafee3e9ef77731cf0f8ce2801f9be
iterTools, 0xed46c237c50cd46df738f4451a343f9657a28e31
mathLib, 0x87e3c74941811bb0dcc8c38c03b8f0407b7cb0b5
paymentLib, 0xb182f19b3368261d3a5ae5a1f89b3c1f1e00b128
requestFactory, 0x76e0ad7d1dcdc36bd951ae320884c843f3613934
requestLib, 0x64d0b1768a9dee29d2f389459b8ddd6ab832703c
requestMetaLib, 0x3a1c8b73a149d0889c5516114d6e11b9b7c96cf6
requestScheduleLib, 0x9d96b1eb1ef99272b2a9326fffdd8659a93041f9
requestTracker, 0x71e49ac7b7058006f32e9946882c7fff59b571b3
safeMath, 0x6fdac55a6b36a3d5c4588cf61ca5ccb595c4270b
schedulerLib, 0x9e19c7f23c09e4b3fa89e799876e3cb29f86a73a
timestampScheduler, 0x9ba22a74fd873b901a1f58e14760489fc42265ec
transactionRequest, 0x0d8fabef45ec349d11d1a0eb4d3e1bcbba652459
transactionRecorder, 0x9c5c57b400afd2f646cd063ff41eb3478455f5fa
