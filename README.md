# Ethereum Alarm Clock

[![Join the chat at https://gitter.im/pipermerriam/ethereum-alarm-clock](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/pipermerriam/ethereum-alarm-clock?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/chronologic/ethereum-alarm-clock.svg?branch=master)](https://travis-ci.org/chronologic/ethereum-alarm-clock)

Source code for the [Ethereum Alarm Clock service](http://www.ethereum-alarm-clock.com/)

## What is the EAC (Ethereum Alarm Clock)

The Ethereum Alarm Clock is a smart contract protocol for scheduling Ethereum transactions to be executed in the future. It allows any address to set the parameters of a transaction and allow clients to call these transactions during the desired window. The EAC is agnostic to callers so can be used by both human users and other smart contracts. Since all of the scheduling logic is contained in smart contracts, transactions can be scheduled from solidity.

Additionally the EAC faciliates the execution of this pool of scheduled transactions through a client. The EAC client continuously runs and searches for transactions which are scheduled to be executed soon then claims and executes them. The clients run off chain and can be written in any programming language, so far we have a Python implemention (alarm_client/) and are working on a Javascript implementation (script/). The functioning of the EAC depends on people running exeuction clients so there are ways in which these executors can be rewarded for running a client. For more information please look in the docs/ folder.

## Running the tests

_Tests have been ported to Javascript and can now be run using the Truffle Suite_

Originally the test suite was written in Python using the Populus framework, these still exist for reference under the tests/ directory. However, we have ported over the suite to use the Truffle framework since this may be more familiar to developers who know the Ethereum tooling in Javascript. These tests can be found in the test/ directory.

If you would like to run the test please set up your environment to use node v8.0.0, truffle v4.0.1 and the latest ganache-cli.

```
nvm use 8.0.0
npm i
npm i -g truffle@4.0.1 
npm i -g ganache-cli
```

Start ganache-cli in a terminal screen by running `ganache-cli`.

In another terminal screen run `npm test` at the root of the directory. This will run the npm test script that splits up the tests into different runtimes. The tests are split because the EAC is a moderately sized project and running all the tests with one command has a tendency to break down the ganache tester chain.

Each time you run the tests it is advised to rebuild your build/ folder, as this may lead to bugs if not done. You can do this by running the command `rm -rf build/`.

## Documentation

Some of the documentation in the docs/ repository may be out of date.

We _will soon_ host developer documentation via Doxitiy on github pages.

## Using the CLI

If you would like to try using the Javascript CLI please make sure to build the contracts by running the truffle tests above. See `instructions.txt` in script/cli/ and play around with the source code. NOTE - only works on ROPSTEN for the moment by using the contracts provided below.

## Deployment

The EAC contracts are deployed on Ropsten at the addresses below.

```
baseScheduler, 0x1b07192874e68857f559ca28405bd0c93b5769bc

blockScheduler, 0x96363aea9265913afb8a833ba6185a62f089bcef

claimLib, 0x4c409431e8a5857b8c666d4af7f9d6b0e6f31864

executionLib, 0xd8716622458f09bdcb57fc3f457a16e5ea2e3437

groveLib, 0xf6c63cd310169032b7cfd61ca738ac952ad7ce61

iterTools, 0x55ca915cae662acd0ed7aa5902029eb2bbcdd291

mathLib, 0x8b8baef7a95dfe5910dc98e62ba39a06df2d4160

paymentLib, 0x4bfd652bc769615b82c986be7c521a7b411e3ca8

requestFactory, 0x7a40754857b9ffc79bee5f42c35840cd4d08d5ab

requestLib, 0xa5e13bdf2dd1d5afa91aab98fb0fb21945c1fc40

requestMetaLib, 0xeba51150443e9f42ba75763b502797017a9af769

requestScheduleLib, 0xb3a45035005894850213f606825ed1b4879a00e9

requestTracker, 0x36670ebd7e97526f662e68614036b85a6c089308

safeMath, 0xb869162954153199ce826e0dd9ec50dfc2d4328a

schedulerLib, 0xf9dd9c78dfa5130f66133129bc9ff97a35a04fae

timestampScheduler, 0x1ed890d84c5a071520fd2911950d3f53fbff147a

transactionRecorder, 0x1c1d4390c7391e0872957520b90c8fd5ea172e33

```