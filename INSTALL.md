# Installation Instructions (Linux)

This repository was developed and tested using Ubuntu Linux. If you are able to try it out on a different platform and encounter any issues, please open a github issue.

## Requirements

### Docker

Install [docker](https://docs.docker.com/engine/install/) and ensure it works for the user you want to run the devnet under. Make sure you have the latest version with the "docker compose" command.

### Direnv

Install [direnv](https://direnv.net/) on your system and ensure it works.

### NVM + Node JS

Ensure node.js is installed for the user you want to run the devnet under. It is easiest to use [nvm](https://github.com/nvm-sh/nvm) for this. 

Once nvm is installed, use nvm to install node.js >= 18.xx.yy:

```
$ nvm install 18
$ nvm use 18
$ node --version
18.xx.yy
```

## Installation

1. Clone the repo

```
$ git clone https://github.com/cryptophonic/cardano-devnet
$ cd cardano-devnet
$ git submodule update --init --recursive
$ direnv allow
```

2. Install the node modules for the main repo.

```
$ npm install
```
   
3. If you plan on using the web-based explorer, install the node modules in the explorer directory as well.

```
$ cd explorer
$ npm install
```

That's it! You are now ready to use the cardano devnet and its supporting tools for development.
