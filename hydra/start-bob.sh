#!/bin/sh

hydra-node \
  --node-id "bob-node" \
  --persistence-dir persistence-bob \
  --cardano-signing-key credentials/bob-node.sk \
  --hydra-signing-key credentials/bob-hydra.sk \
  --hydra-scripts-tx-id $(cat $DEVNET_ROOT/hydra/network/scripts_utxo) \
  --ledger-protocol-parameters protocol-parameters.json \
  --testnet-magic 42 \
  --node-socket $CARDANO_NODE_SOCKET_PATH \
  --api-host 0.0.0.0 \
  --api-port 4002 \
  --host 0.0.0.0 \
  --port 5002 \
  --peer localhost:5001 \
  --hydra-verification-key credentials/alice-hydra.vk \
  --cardano-verification-key credentials/alice-node.vk

