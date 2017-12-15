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
baseScheduler, 0x6516b2410547d55ea452c52e2adb2cd43dd9357c

blockSceduler, 0xa22034024696e89c3dafcf6f49d795b05ce73007

claimLib, 0x349686ab5c36563da978c77ce027e2463e5b7d0d

executionLib, 0xe40112a49e40a76a185945b5fe637e5c70fc53d0

groveLib, 0x6cb1e6ddbd2a85b3d13068d5eb3055f2917616dc

iterTools, 0x5ddf53f4861eda2747579f0f455451c077047df4

mathLib, 0x68024ad8bcc6689d51808b3cd30ecb64196d87e6

paymentLib, 0x8ffe70cecf8cf7e610bd0d64e7e5a792fde39126

requestFactory, 0x58e4297d61838724cf1e59d7786db8e5bc08fad3

requestLib, 0x1bd0e34d014f5b4421978c21c5e66c5e19ef3edd

requestMetaLib, 0x821b64e210ec4485b0c4214e4dde3e06df11044c

requestScheduleLib, 0x14bcc993fc016536cc2be425cbfbde13eb92b0ec

requestTracker, 0x2e6f940869121a459dbfd847cc87679622a1dc0d

safeMath, 0x1157c432487114cf3c399fb315941a6a46498e7f

schedulerLib, 0x548e34c5303480e791167025ad875ce5851cc287

timestampScheduler, 0xbb45a0b6bc8711237f429b0f2553bfdf3a9110eb

transactionRequest, 0x81942dfdae1a11b1c0e4cd013d493549c55cffee

transactionRecorder, 0x29f3c7c39ebdfa87d3839faa57a199d93a750108

```