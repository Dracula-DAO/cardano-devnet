# Cardano Devnet

This repository creates a completely local Cardano network that runs only on the development machine, with average block times that can be specified as a number of seconds from the command line.  It has been built to work as a submodule under the [Jambhala](https://github.com/iburzynski/jambhala) framework. 

There are several additional features included in addition to a locally running node:

* Live monitor - a terminal-based monitor script that shows high level transaction information for confirmed transactions, as well as pending transactions in the mempool.
* Lightweight indexer - a very simple indexer built to work with the [Lucid](https://lucid.spacebudz.io/) framework.
* Lucid provider - a Lucid provider that connects the client-side Lucid API to the node monitor and indexer.

In the examples directory there are several examples of passing state through a sequence of transactions that demonstrate how multiple Cardano transactions can be chained to pass a script state from one transaction to the next without requiring the previous transaction to be included in a block. The so-called [Cardano EUTxO bottleneck](https://builtoncardano.com/blog/concurrency-and-cardano-a-problem-a-challenge-or-nothing-to-worry-about) of one transaction per script address per block does not exist, provided there is a way to query the blockchain mempool.

Currenly only nodes that are block producers have access to the full network mempool, which means that stake pool operators could use a method such as the one demonstrated in this repository to offer a mempool query service to users as an additional way to provide value to the network.

## Dependencies:

If you don't have node.js installed, the easiest way to install it is probably to
use nvm:

```
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
$ nvm install 16
$ nvm use 16
$ node --version
```

## Installation

1. Ensure ogmios >=6.0.0 is in your PATH. Tested with 6.0.0.
2. Ensure cardano-node >8.0.0 is in your PATH. Tested with 8.1.2.
3. Run 'npm install' to install the node.js dependencies from package.json.

### Use:

1. Make sure to change your network ID in $PROJECT_ROOT/cardano_cli_guru/.env to 42.
2. Start the devnet with the desired time between blocks (this is the average time between
blocks, sometimes they will be faster, sometimes slower).  block_time must be an 
integer >= 1 (in seconds).

```
$ devnet 10
```

3. Monitor the devnet in a terminal window:

```
$ monitor
```

4. Transfer some funds from the faucet to a Jambhala address:

```
$ utxos faucet
                           TxHash                                 TxIx        Amount
--------------------------------------------------------------------------------------
8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284     0        900000000000 lovelace + TxOutDatumNone
$ transfer faucet alice 100 8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284#0 
```

You should see the transaction go into the mempool then eventually get included in a block.

5. Try out the Lucid transfer script to transfer from alice to bob:

```
$ node transfer.mjs alice bob 1.5
```

The Lucid transfer script will query the monitor process for alice's current utxos and automatically
generate and sign the transaction. Note that any utxos in the mempool are included by the monitor
script as part of alice's utxos, which allows you to chain transactions rapidly even if they have 
not yet been included in a block!
