# How to use

This directory contains the source code that interfaces to the [Jambhala](https://github.com/iburzynski/jambhala) development environment, as well as the [Lucid](https://lucid.spacebudz.io) javascript library.

## LucidProviderFrontend

Import this file into your javascript application to create transactions using the built-in indexer and tooling provided by the [monitor](../scripts/monitor) script. The script has a LucidProviderBackend class that listens on port 1338 for commands coming from LucidProviderFrontend.

The Lucid library then uses this provider when it creates its transactions. All this happens behind the scenes and you do not have to worry about it in your client application.

```
import { Lucid } from 'lucid-cardano'
import { LucidProviderFrontend } from 'lucid-fontend.mjs

const provider = new LucidProviderFrontend("ws://localhost:1338")
await provider.init()
const lucid = await Lucid.new(provider, "Cardano Devnet")

// Your application logic here
```

Now you can use Lucid as normal, and it will be automatically aware of mempool transactions that happen on the local devnet. See the [Lucid API documentation](https://lucid.spacebudz.io/docs/overview/about-lucid).

## Jambhala Utils

Import the jambhala-utils module to have access to several convenience functions that allow your client application to load addresses, keys and scripts from the standard locations in the Jambhala framework.

```
import { loadJambhalaAddress, loadJambhalaPrivKey, loadJambhalaNativeScript, loadJambhalaPlutusScript } from 'jambhala-utils.mjs'
```

## Examples

For specific examples that demonstrate how to create lucid transactions within the Jambhala framework see the [examples](./examples) directory.

