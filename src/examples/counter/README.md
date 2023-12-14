# How to run the State Counter example

## Step 1 - Compile the plutus script

### 1.a - copy haskell source into Jambhala framework

```
$ cp jambhala/StateProgression.hs $PROJECT_ROOT/src/Contracts
$ cd $PROJECT_ROOT/src
$ git add StateProgression.hs
```

### 1.b - add StateProgression into the contracts variable

```
contracts =
  [ StateProgression.stateExports
  ]
```

### 1.c - compile

```
$ cd $PROJECT_ROOT
$ jamb -w
```

## Step 2 - Create a state token

### 2.a - create an "owner", "alice" and "bob" key pair

```
$ cd $PROJECT_ROOT
$ key-gen owner
$ key-hash owner
49899a30b5ff65781291e329b2c3cae3b917973c2d60527af8ec63f5
$ key-gen alice
$ key-gen bob
```

### 2.b - create the native script

Create a native script named "state-token.script" in $NATIVE_SCRIPTS_PATH. Use the key hash generated above in the file.

```
{
  "type": "all",
  "scripts": [
    { 
      "type": "sig", 
      "keyHash": "49899a30b5ff65781291e329b2c3cae3b917973c2d60527af8ec63f5"
    }
  ]
}
```

### Step 3 - Run the demo

### 3.a - ensure the devnet and monitor are running

In separate terminals, run the cardano devnet and monitor script

Terminal 1 - run the devnet with 10 second average block time
```
$ devnet 10
```

Terminal 2 - run the monitor
```
$ monitor
```

### 3.b - fund the owner, alice and bob accounts

```
$ utxos faucet
8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284     0        900000000000 lovelace + TxOutDatumNone

$ transfer faucet owner 10 8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284#0
```

( ... wait for block to confirm ... )

```
$ utxos faucet
47338ba44676dae0ee64b86f04c9dedc99bc29ca9e13ceb04d4a3d84d464d53f     1        899989834455 lovelace + TxOutDatumNone

$ transfer faucet alice 1000 47338ba44676dae0ee64b86f04c9dedc99bc29ca9e13ceb04d4a3d84d464d53f#1
```

( ... wait for block to confirm ... )

```
$ utxos faucet
8d880bda5dab081d4ba436c7ce82fe6b02c9400477a832d633ecab036a3c46c2     1        898989668910 lovelace + TxOutDatumNone

$ transfer faucet bob 1000 8d880bda5dab081d4ba436c7ce82fe6b02c9400477a832d633ecab036a3c46c2#1
```

### 3.c - mint the state token NFT

The state token NFT gets passed from transaction to transaction to track the latest state.

```
$ node mint-state-token.mjs
```

### 3.d - seed the state with zero

```
$ node seed-state.mjs
```

### 3.e - increment the state token from alice and bob wallets

```
$ node increment-state.mjs alice
$ node increment-state.mjs bob
```

Note that you don't have to wait for a block to confirm before incrementing the state! This is because you're using the devnet indexer that passes mempool transactions back to Lucid automatically behind the scenes.



