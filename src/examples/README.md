# Stateful Transactions in Cardano

The examples in this directory use the cardano-devnet infrastructure to demonstrate passing arbitrary state information through transaction datums, marked by a unique application-specific NFT token.

* Counter - demonstrates a simple counter incrementing for each transaction
* Dex - demonstrates a simple decentralized exchange that can swap a pair of tokens in either direction with slippage calculated by a bonding curve.

Both examples showcase mempool monitoring that allows an arbitrary number of EUTxO transactions in a single block, using the supporting tools included in this repository.

## Transaction Sequencing

State is passed in UTxO datums in a block, starting from a confirmed UTxO that is contained in a confirmed block. Transaction A consumes this output, the script validates the transaction and the system adds transaction A to the mempool.

When Transaction B is created, the mempool is queried for the latest transaction that exists for the script address, instead of using the latest confirmed transaction included in a block. The state is updated in the mempool, **without requiring transaction A to be confirmed**.

We can sequence any number of transactions in the mempool chain, limited only by block size and race conditions due to transaction propagation times.

![UTxO Sequencing](./UTxO%20Sequencing.png)
