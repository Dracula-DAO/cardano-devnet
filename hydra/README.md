# Hydra instructions

This is still very alpha but it seems to be working.  Running a hydra head under the cardano-devnet project is now pretty easy:

1. Start the devnet as normal, a 5 second blocktime seems pretty reasonable:

```
$ start-cardano-devnet -m 5
```

2. In a second window, publish the hydra scripts. Everything runs under docker, so there are no binaries to install.

```
$ cd hydra
$ ./publish_scripts.sh
```

3. Setup a hydra head, naming participants as you want:

```
$ ./setup-peers.sh alice bob charlie
```

The hydra head runs on an internal docker network, 172.16.0.x.  Each node is assigned an IP address on this network, incrementing by 10, i.e. alice will be at 172.16.0.10, bob at 172.16.0.20, etc.

4. In N number of windows, run a node + hydra-tui (the user interface). If you have 3 participants in the head, you'll need 3 windows:

```
$ ./start-hydra-node.sh <name=(alice,bob,etc)>
```

Everything else runs as described by the [hydra documentation](https://hydra.family/head-protocol/docs/dev).  If you start the cardano devnet with an indexer and web explorer using "start-cardano-devnet -mie 5" you'll be able to view the
hydra transactions in your browser at http://localhost:5173
