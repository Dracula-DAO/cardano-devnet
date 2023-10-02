# cardano-devnet
Local Cardano development network and supporting tools

This repository has been built to work as a submodule under the jambhala
framework.

Use:

1.  Make sure to change your network ID in $PROJECT_ROOT/cardano_cli_guru/.env to 42.

2. 
```
$ devnet <block_time>
```

where block_time is an integer >= 1 (seconds)

3.
```
$ monitor
```