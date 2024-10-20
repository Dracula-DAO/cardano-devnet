#!/bin/sh

name=$1
cd "$HYDRA_ROOT/network/node-$name"

# Remove any old persistence data
PERSISTENCE_DIR=./persistence
rm -rf $PERSISTENCE_DIR
mkdir $PERSISTENCE_DIR

# Get peer(s) verification IP / cardano vkey / hydra vkey
peeropts=$(awk '{ if ($1 != "'$name'") print "--peer",$2":5001","--cardano-verification-key /hydra/network/node-"$1"/node.vk","--hydra-verification-key /hydra/network/node-"$1"/hydra.vk" }' ORS=' ' $HYDRA_ROOT/network/peers)
hydraip=$(awk '{ if ($1 == "'$name'") print $2 }' $HYDRA_ROOT/network/peers)

export HYDRA_IP=$hydraip
cmd="hydra-node \
  --node-id $name-node \
  --persistence-dir $PERSISTENCE_DIR \
  --hydra-scripts-tx-id $(cat $HYDRA_ROOT/network/scripts-utxo.txt) \
  --ledger-protocol-parameters $HYDRA_ROOT/network/protocol-parameters.json \
  --testnet-magic 42 \
  --node-socket $CARDANO_NODE_SOCKET_PATH \
  --api-host 0.0.0.0 \
  --api-port 4001 \
  --host 0.0.0.0 \
  --port 5001 \
  --cardano-signing-key ./node.sk \
  --hydra-signing-key ./hydra.sk \
  $peeropts"

exec $cmd > /dev/null 2>&1 &
hydra-tui -k $PWD/node.sk -c $hydraip:4001

