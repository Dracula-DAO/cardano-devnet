# How to run the State Counter example

## Step 1 - Compile the aiken smart contract

This example requires [aiken](https://aiken-lang.org/installation-instructions) >= v1.0.28 and it assumes that
CARDANO_CLI_GURU has been coupled to cardano-devnet as described in the install instructions.

```
$ cd aiken
$ aiken build
$ cd ..
```

This should create a "plutus.json" file in the aiken directory. This contains the smart contract bytecode.

## Step 2 - Ensure the devnet is running

In a separate window:

```
$ start-cardano-devnet -mie 5
```

The -m (monitor) needs to be running because it contains the Lucid backend provider that gives visibility into the
mempool and pending tx's.

## Step 3 - Run the setup

```
$ ./setup.sh
```

You'll be able to observe transactions go into the mempool and become confirmed in the monitor window.

## Step 4 - Increment the contract state

```
$ node increment.mjs alice
```

If you look at the output utxo you can observe that the CBOR datum shows the counter has been incremented.




