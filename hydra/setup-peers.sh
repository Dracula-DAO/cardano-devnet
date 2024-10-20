#!/bin/sh

# Remove any old node configurations
rm -rf $HYDRA_ROOT/network/node-*

peers=$HYDRA_ROOT/network/peers
rm -f $peers

cp $HYDRA_ROOT/protocol-parameters.json $HYDRA_ROOT/network

count=10
for name in "$@"; do
  nodedir="$HYDRA_ROOT/network/node-$name"
  ip=172.16.0.$count
  mkdir $nodedir
  count=$((count+10))

  # credentials
  cd $nodedir
  direnv allow
  cardano-cli address key-gen --verification-key-file ./funds.vk --signing-key-file ./funds.sk
  cardano-cli address build --verification-key-file ./funds.vk --out-file ./funds.addr
  cardano-cli address key-gen --verification-key-file ./node.vk --signing-key-file ./node.sk
  cardano-cli address build --verification-key-file ./node.vk --out-file ./node.addr
  hydra-node gen-hydra-key --output-file ./hydra
  fund $(cat ./funds.addr) 1000
  fund $(cat ./node.addr) 100
  cd - > /dev/null

  echo $name $ip >> $peers
done

