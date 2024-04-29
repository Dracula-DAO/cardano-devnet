# Installation Instructions (Linux)

This repository was developed and tested using Ubuntu Linux. If you are able to try it out on a different platform and encounter any issues, please open a github issue.

## Requirements

In order to run the development network and tools, you need one of the following setups:

### Setup A

If you want to have control over the versions of cardano-node and / or ogmios you are using, simply install the binaries directly.

1. Build or download a [cardano-node](https://github.com/IntersectMBO/cardano-node) (>8.9.0) executable and ensure the binary is in your PATH.
2. Build or download [ogmios](https://github.com/CardanoSolutions/ogmios) (>6.2.0) and ensure the binary is in your PATH.

### Setup B

If you don't have or don't want to use cardano-node and ogmios binaries, the devnet can be started using standardized docker containers instead.

1. Install [docker](https://docs.docker.com/engine/install/) and ensure it works for the user you want to run the devnet as.
2. If your docker installation did not come with [docker-compose](https://docs.docker.com/compose/install/), download and install it and ensure the binary is in your PATH.

## Installation

1. Clone the repo and allow direnv ([direnv](https://direnv.net/) must be installed on your system). If you have [Cardano CLI Guru](https://github.com/cryptophonic/cardano-cli-guru) installed on your system, this repository supports it, but you need to set the CARDANO_CLI_GURU environment variable to the path of the repository prior to running "direnv allow":

```
(optional step)
export CARADANO_CLI_GURU=<path to cardano-cli-guru repo>
```

```
$ git clone https://github.com/cryptophonic/cardano-devnet
$ cd cardano-devnet
$ direnv allow
```

2. Ensure node.js is installed for the user you want to run the devnet as. It is easiest to use [nvm](https://github.com/nvm-sh/nvm) for this:
3. Use nvm to install node.js >= 18.xx.yy

```
$ nvm install 18
$ nvm use 18
$ node --version
18.xx.yy
```

4. Install the node modules for the main repo.

```
$ npm install
```
   
5. If you plan on using the web-based explorer, update the repository submodule and install the node modules in the explorer directory.

```
$ git submodule update --init --recursive
$ cd explorer
$ npm install
```

That's it! You are now ready to use the cardano devnet and its supporting tools for development.
