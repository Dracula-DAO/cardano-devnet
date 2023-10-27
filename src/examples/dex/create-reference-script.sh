#!/bin/sh

# This script has hardcoded hashes (probably won't work on other systems) but shows how to create a reference script
# from the owner address so the swap tx's are smaller
cardano-cli transaction build --tx-in 1206e10487640e87389aa9b768b15d108fdf466c10094d3a5b0ec045bdba0ed4#1 --change-address $(addr owner) --tx-out $(addr owner)+10000000 --tx-out-reference-script-file $PLUTUS_SCRIPTS_PATH/
bonding-curve.plutus --out-file $TX_PATH/reference-script.raw

