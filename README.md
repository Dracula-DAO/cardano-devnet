# cardano-devnet
This is a local Cardano development network and supporting tools.

This repository has been built to work as a submodule under the jambhala
framework.

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
