Introduction
============

.. contents:: :local:


What problem does this solve?
-----------------------------

The simplest way to explain the utility of the Alarm service is to explain the
problem it solves.

We will begin with a refresher about the two types of accounts on ethereum
and the differences between them. There exists:

1. User accounts (controlled by the holder of the private key)
2. Contracts *(which are not controlled by a private key)*

User accounts are the accounts that humans control and operate. The controller 
of a user account is always the person who holds the private key. In contrast,
contract accounts are not controlled by a private key but are instead deployed 
code which execute in a determined way when they are called. However, contracts 
do not have the ability to initiate themselves.

All code execution in the Ethreum Virtual Machine (the EVM) must be triggered by
a private key based account.  This is done by sending a transaction, which may
do something simple like transfering ether, or it may do something more complex
like calling a function on a contract account.

Whenever a user account initiates a contract account, the execution of the contract 
is immediate. Therefore all calls to contract accounts are both manual and included 
in the same block as the transaction.

The Ethereum protocol does not provide any way to create a transaction to be executed at 
a later time. This is a problem if a developer is creating a smart contract to fire off 
transactions that must happen at a later date or if a user would like to perform an action
at a specific time and already knows all the parameters of the action ahead of time.

The Alarm service aims to solve this problem of scheduling transaction to be executed
at a future time in a trustless and censorship-resistant way.


How transactions are executed
-----------------------------

When a transaction is scheduled a new smart contract is created that holds all
of the information needed to execute the transaction.  An useful analogy may be to
think of this as an order on an exchange.  When this contract "order" called during the specified
execution window, this contract will send the transaction as specified and then
pay the account that triggered the execution.

These contracts are referred to as :class:`TransactionRequest` contracts and
are written to provide strong guarantees of correctness to both parties.

The creator of the :class:`TransactionRequest` contract can know that their
transaction will only be sent during the window they specified and that the
transaction parameters will be sent exactly as specified.

Similarly, the account that executes the :class:`TransactionRequest` contract
can know that no matter what occurs during the execution of the transaction
that they will receive full gas reimbursement as well as their payment for
execution.


Execution guarantees
--------------------

You may have noted at this point that this service relies on external parties
to initiate the execution of these transactions.  This means that it is
possible that your transaction will not be executed at all.  

In an ideal situation, there is a sufficient volume of scheduled transactions
that operating a server to execute these transactions is a profitable endeavor.


How scheduling transactions works
---------------------------------

A transaction is scheduled by providing some or all of the following
information.

* Details about the transaction itself such as which address the transaction
  should be sent to, or how much ether should be sent with the transaction.
* Details about when the transaction can be executed.  This includes things
  like the window of time or blocks during which this transaction can be
  executed.
* Ether to pay for the transaction gas costs as well as the payment that will
  be paid to the account that triggers the transaction.

Scheduling is done by calling a :class:`Scheduler` contract which handles
creation of the individual :class:`TransactionRequest` contract.
