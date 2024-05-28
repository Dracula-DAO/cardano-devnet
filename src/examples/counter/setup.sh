#!/bin/sh

# Create wallet keys for actors
# echo "N" to answer prompt asking to overwrite if key already exists
echo "N" | key-gen owner > /dev/null
echo "N" | key-gen alice > /dev/null
echo "N" | key-gen bob > /dev/null

# Fund wallets (devnet must be running with monitor active (-m flag) for lucid to pull tx hash from mempool)
fund owner 1000
fund alice 10
fund bob 10

# State token minting policy (native script)
cat <<EOF > state-token.script
{
  "type": "all",
  "scripts": [
    { 
      "type": "sig", 
      "keyHash": "$(key-hash owner)"
    }
  ]
}
EOF

# Mint state token
node mint-state-token.mjs 
sleep 1

# Seed state token
node seed-state.mjs

