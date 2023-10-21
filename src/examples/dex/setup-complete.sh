#!/bin/sh

tx-submit transfer-owner
tx-submit transfer-alice
tx-submit transfer-bob

node ../../utils/wait-block.mjs

node mint-state-token.mjs
node mint-trading-tokens.mjs alice 5000 5000
node mint-trading-tokens.mjs bob 2000 2000

node seed-state.mjs

node add-liquidity.mjs alice 1000 1000

