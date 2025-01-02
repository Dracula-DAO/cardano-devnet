#!/bin/sh

# This script copies the Jambhala plutus contract and native token script into place
# in the Jambhala directory. The user needs to make the changes necessary to build and
# use it (modify the cabal file, git add, etc)

cp BondingCurve.hs $PROJECT_ROOT/src/Contracts
cp state-token.script $NATIVE_SCRIPTS_PATH

