#!/bin/sh

hydra-node publish-scripts \
  --testnet-magic 42 \
  --node-socket $CARDANO_NODE_SOCKET_PATH \
  --cardano-signing-key $CARDANO_ASSETS_PATH/keys/faucet.skey > $DEVNET_ROOT/hydra/network/scripts_utxo
