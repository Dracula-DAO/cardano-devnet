#!/bin/sh

tx-submit transfer-owner
tx-submit transfer-alice
tx-submit transfer-bob

node ../utils/wait-block.mjs

node mint-state-token.mjs
node mint-trading-tokens.mjs alice 1000 1000
node mint-trading-tokens.mjs bob 1000 1000

node seed-state.mjs

