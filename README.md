# Cardano Devnet

This repository enables anyone to create a completely local cardano development network that runs only on the development machine, with average block times that can be specified as a number of seconds, assignable from the command line.  This is useful if you want to experiment privately and locally, with an unlimited amount of tokens, without requiring network connectivity, and be able to discard the chain state once you're done with it.

It is recommended to use this with [cardano-cli-guru](https://github.com/iburzynski/cardano-cli-guru), a submodule under the [jambhala](https://github.com/iburzynski/jambhala) framework.

The includes several additional features in addition to a locally running node:

* Live monitor - a terminal-based monitor script that shows high-level transaction information for confirmed transactions, as well as realtime pending transactions in the mempool.

<img src="./docs/images/devnet_monitor.png" width="700px"/>

* Lightweight indexer - a filesystem indexer built to store chain history in human readable (json) format is a database directory using symlinks to optimize storage. This is perfect for development because you can start the devnet, run some tests, then stop the devnet and debug using the indexed database and built-in explorer.

* Web-based chain explorer - view blocks, transactions, utxos and address data from a web browser. Optionally specify the directory to use for the db - you can save previous chain states by moving the db directory somewhere and use this saved chain snapshot with the explorer anytime in the future.

<img src="./docs/images/web_explorer_block.png" width="250px"/>
<img src="./docs/images/web_explorer_tx.png" width="250px"/>
<img src="./docs/images/web_explorer_utxo.png" width="250px"/>

* Lucid provider - a lucid provider that connects the client-side lucid api to the node backend. This is a direct replacement for the lucid blockfrost provider when using the preprod or mainnet networks. Allows developers to send transactions directly from javascript.

## Examples

In the examples directory, there are several examples of passing state through a sequence of transactions that demonstrate how multiple cardano transactions can be chained to pass a script state from one transaction to the next without requiring the previous transaction to be included in a block. The so-called [cardano eutxo bottleneck](https://builtoncardano.com/blog/concurrency-and-cardano-a-problem-a-challenge-or-nothing-to-worry-about) of one transaction per script address per block does not exist, provided there is a way to query the blockchain mempool.

Currenly only nodes that are block producers have access to the full network mempool, which means that stake pool operators could use a method such as the one demonstrated in this repository to offer a mempool query service to users as an additional way to provide value to the network.

## Component diagram

The diagram below shows how the components provided by this repository work. [cardano node](https://github.com/intersectmbo/cardano-node) and [ogmios](https://github.com/cardanosolutions/ogmios) are assumed to be in the path.

<img src="./docs/images/Component Diagram.png" width="700px"/>

## Installation

1. ensure ogmios >=6.0.0 is in your path. tested with 6.0.0.
2. ensure cardano-node >8.7.2 is in your path. tested with 8.7.2.
3. run 'npm install' to install the node.js dependencies from package.json.

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

In a different directory, you may optionally install the jambhala [cardano-cli-guru](https://github.com/iburzynski/cardano-cli-guru) toolchain. If you do add these useful scripts, set the environment variable CARDANO_CLI_GURU to its path:

```
$ export CARDANO_CLI_GURU=<anypath>
```

### Step 2. Allow direnv

If cardano_cli_guru is set and exported at this point, direnv will save its value so every shell in the cardano-devnet directory will be able to access the cardano-cli-guru commands. This is very convenient and saves time working with cardano-cli.

```
$ direnv allow
```

### Step 3. Run the devnet

The startup script is self contained and the usage is as follows:

```
usage: start-cardano-devnet [-i] [-e] [-m] <block time>
  -i  run indexer
  -e  run explorer
  -m  run terminal monitor
```

Where ```<block time>``` is the target number of seconds between blocks. block time must be >= 1. This starts cardano-node locally and runs ogmios, which connects to the unix socket provided by cardano-node.  It then starts the optional components (indexer, explorer, monitor) as specified.

When the script exits it will kill all the processes automatically.

Recommended startup:

```
$ start-cardano-node -mie 2
```

This will start up the cardano devnet with a block time of 2 seconds (average time) and run the monitor in the terminal window, with the indexer and explorer running in the background.

### Step 4. Create some addresses (only with cardano-cli-guru set up as above)

In a third terminal from this directory, run the key-gen command to generate two addresses:

```
$ key-gen alice
$ key-gen bob
```

### Step 5. Transfer some funds from the faucet to alice (only with cardano-cli-guru set up as above):

```
$ utxos faucet
                           txhash                                 txix        amount
--------------------------------------------------------------------------------------
8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284     0        900000000000 lovelace + txoutdatumnone
$ transfer faucet alice 100 8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284#0 
```

You should see the transaction go into the mempool then eventually get included in a block.

### Step 6. Try out the lucid transfer script to transfer from alice to bob:

```
$ node transfer.mjs alice bob 1.5
```

The lucid transfer script will query the monitor process for alice's current utxos and automatically
generate and sign the transaction. Note that any utxos in the mempool are included by the monitor
script as part of alice's utxos, which allows you to chain transactions rapidly even if they have 
not yet been included in a block!

## Explorer

Assuming you started both the indexer with the "-i" option, and the explorer with the "-e" option when running start-cardano-devnet, or alternatively you are running them separately using the ```indexer``` and ```explorer``` scripts in separate sessions, you should be able to connect to ```http://localhost:3000``` with a browser to explore the chain live as it runs.
