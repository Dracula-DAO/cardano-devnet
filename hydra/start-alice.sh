#!/bin/sh

hydra-node \
  --node-id "alice-node" \
  --persistence-dir persistence-alice \
  --cardano-signing-key credentials/alice-node.sk \
  --hydra-signing-key credentials/alice-hydra.sk \
  --hydra-scripts-tx-id $(cat $DEVNET_ROOT/hydra/network/scripts_utxo) \
  --ledger-protocol-parameters protocol-parameters.json \
  --testnet-magic 42 \
  --node-socket $CARDANO_NODE_SOCKET_PATH \
  --api-host 0.0.0.0 \
  --api-port 4001 \
  --host 0.0.0.0 \
  --port 5001 \
  --peer localhost:5002 \
  --hydra-verification-key credentials/bob-hydra.vk \
  --cardano-verification-key credentials/bob-node.vk

