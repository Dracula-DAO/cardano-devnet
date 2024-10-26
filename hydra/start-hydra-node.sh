#!/usr/bin/env bash

name=$1
cd "$HYDRA_ROOT/network/node-$name"

# Remove any old persistence data
PERSISTENCE_DIR=$PWD/persistence
rm -rf $PERSISTENCE_DIR
mkdir $PERSISTENCE_DIR

# Get peer(s) verification IP / cardano vkey / hydra vkey
peeropts=$(awk '{ if ($1 != "'$name'") print "--peer",$2":5001","--cardano-verification-key /hydra/network/node-"$1"/node.vk","--hydra-verification-key /hydra/network/node-"$1"/hydra.vk" }' ORS=' ' $HYDRA_ROOT/network/peers)
hydraip=$(awk '{ if ($1 == "'$name'") print $2 }' $HYDRA_ROOT/network/peers)

export HYDRA_IP=$hydraip
cmd="hydra-node \
  --node-id $name-node \
  --persistence-dir $PERSISTENCE_DIR \
  --cardano-signing-key $PWD/node.sk \
  --hydra-signing-key $PWD/hydra.sk \
  --hydra-scripts-tx-id $(cat $HYDRA_ROOT/network/scripts-utxo.txt) \
  --ledger-protocol-parameters $HYDRA_ROOT/network/protocol-parameters.json \
  --testnet-magic 42 \
  --node-socket $CARDANO_NODE_SOCKET_PATH \
  --api-host 0.0.0.0 \
  --api-port 4001 \
  --host 0.0.0.0 \
  --port 5001 \
  $peeropts"

exec $cmd > /dev/null 2>&1 &
hydrapid=$!

function clean_up {
  echo "Cleaning up hydra-node PID=$hydrapid"
  echo "Goodbye!"
  kill $hydrapid
  kill -term $$
}

trap clean_up EXIT

hydra-tui -k $PWD/funds.sk -c $hydraip:4001 --node-socket $DEVNET_ROOT/runtime/ipc/node.socket

