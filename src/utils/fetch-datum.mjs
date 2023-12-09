import { Data, Lucid, fromText } from 'lucid-cardano'
import { LucidProviderFrontend } from '../lucid-frontend.mjs'
import { loadJambhalaPrivKey, loadJambhalaNativeScript, loadJambhalaPlutusScript } from '../jambhala-utils.mjs'
import bech32 from 'bech32-buffer'

const main = async () => {
  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const [hash, index] = process.argv[2].split("#")

  const utxo = await lucid.utxosByOutRef({
    txHash: hash,
    outputIndex: parseInt(index, 10)
  })

  console.log(utxo.datum)

  process.exit()
}

main()