# Ethereum Alarm Clock

[![Join the chat at https://gitter.im/pipermerriam/ethereum-alarm-clock](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/pipermerriam/ethereum-alarm-clock?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/chronologic/ethereum-alarm-clock.svg?branch=master)](https://travis-ci.org/chronologic/ethereum-alarm-clock)

Source code for the [Ethereum Alarm Clock service](http://www.ethereum-alarm-clock.com/)

WIP - development in progress to get the EAC working. Please join the Gitter chat for active updates.

## What is the EAC (Ethereum Alarm Clock)

The Ethereum Alarm Clock is a smart contract protocol for scheduling Ethereum transactions to be executed in the future. It allows any address to set the gas, value and bytecode parameters of a custom transaction and gives _pretty_ good guarantees that the transaction will be executed during a desired window. The EAC is agnostic to callers so can be used by both users and other smart contracts.

Additionally the EAC faciliates the execution of this pool of scheduled transactions through a command-line client. The EAC daemon continuously runs and searches for transactions which are scheduled to be executed soon then claims and executes them. Part of the design goal is to design incentives for people to run the EAC daemon for some sort of profit. 

## Running the tests

_Tests have been ported to JavaScript and can now be run using the Truffle Suite_

Originally the test suite was written in Python using the Populus framework, these still exist for reference under the tests/ directory. However, we have ported over the suite to use the Truffle framework since this may be more familiar to developers who know the JavaScript Ethereum tooling. These tests can be found in the test/ directory but be warned - this repo is in active development and many of the tests are likely to start breaking. If you would like to fix or contribute a test please open an issue or contribute a pull request. 

Make sure you're using node v8.0.0, truffle v4.0.0 and testrpc v6.0.1.

Start testrpc in a terminal window by running `testrpc`.

In another terminal run `truffle test` at the root of the directory.

Between each instance of running the tests it is advised to rebuild your build/ folder, as this may lead to bugs if not done. You can do this by running the command `rm -rf build/` and then running `truffle compile`, `truffle migrate` and `truffle test`.

## Documentation

Currently there exists some documentation in the docs/ directory, but I make no guarantees that anything in there is up-to-date. Part of the work of the revitalization effort is to produce more in-line documentation in the code. To be safe, always refer to the documentation in the code as the final say as changes are migrating from the codebase back out into the docs currently. 

We host developer documentation via Doxitiy on github pages.
