# Cardano Devnet

This repository creates a completely local Cardano network that runs only on the development machine, with average block times that can be specified as a number of seconds from the command line.  It has been built to optionally work with [cardano-cli-guru](https://github.com/iburzynski/cardano-cli-guru), a submodule under the [Jambhala](https://github.com/iburzynski/jambhala) framework. 

There are several additional features included in addition to a locally running node:

* Live monitor - a terminal-based monitor script that shows high-level transaction information for confirmed transactions, as well as pending transactions in the mempool.
* Lightweight indexer - a very simple indexer built to work with the [Lucid](https://lucid.spacebudz.io/) framework.
* Lucid provider - a Lucid provider that connects the client-side Lucid API to the node monitor and indexer.

In the examples directory, there are several examples of passing state through a sequence of transactions that demonstrate how multiple Cardano transactions can be chained to pass a script state from one transaction to the next without requiring the previous transaction to be included in a block. The so-called [Cardano EUTxO bottleneck](https://builtoncardano.com/blog/concurrency-and-cardano-a-problem-a-challenge-or-nothing-to-worry-about) of one transaction per script address per block does not exist, provided there is a way to query the blockchain mempool.

Currenly only nodes that are block producers have access to the full network mempool, which means that stake pool operators could use a method such as the one demonstrated in this repository to offer a mempool query service to users as an additional way to provide value to the network.

## Component Diagram

The diagram below shows how the components provided by this repository work. [Cardano node](https://github.com/IntersectMBO/cardano-node) and [Ogmios](https://github.com/CardanoSolutions/ogmios) are assumed to be in the path.

![Component Diagram](./docs/images/Component%20Diagram.png)

## Installation

1. Ensure ogmios >=6.0.0 is in your PATH. Tested with 6.0.0.
2. Ensure cardano-node >8.7.2 is in your PATH. Tested with 8.7.2.
3. Run 'npm install' to install the node.js dependencies from package.json.

## Dependencies:

If you don't have node.js installed, the easiest way to install it is probably to
use nvm:

```
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
$ nvm install 16
$ nvm use 16
$ node --version
```

## Usage

### Step 1. (optional) Install cardano-cli-guru

In a different directory, you may optionally install the Jambhala [cardano-cli-guru](https://github.com/iburzynski/cardano-cli-guru) toolchain. If you do add these useful scripts, set CARDANO_CLI_GURU to its path:

```
$ export CARDANO_CLI_GURU=<anypath>
```

### Step 2. Allow direnv

If CARDANO_CLI_GURU is set and exported at this point, direnv will save its value so every shell in the cardano-devnet directory will be able to access the cardano-cli-guru commands. This is very convenient and saves time working with cardano-cli.

```
$ direnv allow
```

### Step 2. Run the devnet

```
$ devnet <N>
```
where N is the target number of seconds between blocks. N must be >= 1. This starts cardano-node locally and runs ogmios, which connects to the unix socket provided by cardano-node.

### Step 3. Run the monitor

In a separate terminal window:
```
$ monitor
```

This starts up the monitor subsystem, which is implemented as a node.js script. The script starts up the following components (all in the same script)

* OgmiosConnection

OgmiosConnection connects to the ogmios JRPC socket and handles communication to / from ogmios. When a response comes back, it uses the JRPC method parameter to determine the function to call. Each method name is implemented by either OgmiosStateMachine or OgmiosSynchronousRequestHandler so OgmiosConnection sends the
request to either but not both.

* OgmiosStateMachine

OgmiosStateMachine handles asynchronous events coming from the chain. New transactions, new blocks primarily.

* OgmiosSynchronousRequestHandler

OgmiosSynchronousRequestHandler is used by the LucidProviderBackend to issue requests that require a response, to the ogmios server synchronously.

* DevnetIndexer

DevnetIndexer handles transaction inputs (spent utxos) and outputs (unspent utxos). It maintains an in-memory DB of the tx hashes and the related data for every transaction.  Since this is a local development network there isn't a real need for anything more complicated like a SQLite DB.

* LucidProviderBackend

LucidProviderBackend implements the logic necessary to respond to Lucid requests coming from the client script through the LucidProviderFrontend component.  LucidProviderFrontend is included by every client that uses this framework.

### Step 4. Create some addresses (only with cardano-cli-guru set up as above)

In a third terminal from this directory, run the key-gen command to generate two addresses:

```
$ key-gen alice
$ key-gen bob
```

### Step 5. Transfer some funds from the faucet to alice (only with cardano-cli-guru set up as above):

```
$ utxos faucet
                           TxHash                                 TxIx        Amount
--------------------------------------------------------------------------------------
8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284     0        900000000000 lovelace + TxOutDatumNone
$ transfer faucet alice 100 8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284#0 
```

You should see the transaction go into the mempool then eventually get included in a block.

### Step 6. Try out the Lucid transfer script to transfer from alice to bob:

```
$ node transfer.mjs alice bob 1.5
```

The Lucid transfer script will query the monitor process for alice's current utxos and automatically
generate and sign the transaction. Note that any utxos in the mempool are included by the monitor
script as part of alice's utxos, which allows you to chain transactions rapidly even if they have 
not yet been included in a block!
