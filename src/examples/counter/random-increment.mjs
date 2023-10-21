import { Data, Lucid, fromText } from 'lucid-cardano'
import { DevnetProviderFrontend } from '../../lucid-frontend.mjs'
import { loadJambhalaPrivKey, loadJambhalaNativeScript, loadJambhalaPlutusScript } from '../../jambhala-utils.mjs'

process.on('uncaughtException', err => {
  console.log('Caught exception: ' + err)
})

// This schema must match the state type for the validator script
const CounterSchema = Data.Object({
  counter: Data.Integer()
})

const main = async () => {
  if (process.argv.length !== 4) {
    console.log("Usage: node <script> <wallet_name> <sleep_delay (ms)>")
    process.exit()
  }

  const provider = new DevnetProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const wallet_name = process.argv[2]
  console.log("Using wallet: " + wallet_name)
  lucid.selectWalletFromPrivateKey(loadJambhalaPrivKey(wallet_name))

  const sleep_delay = parseInt(process.argv[3], 10)
  console.log("Using sleep_delay: " + sleep_delay)

  // Get the state token policyId + name
  const script = loadJambhalaNativeScript("state-token")
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  const unit = policyId + fromText("stateToken")

  // Load the script and compute the script address from it
  const validator = loadJambhalaPlutusScript("state-progression")
  const stateProgressionScript = {
    type: "PlutusV2",
    script: validator.cborHex
  }
  const scriptAddr = lucid.utils.validatorToAddress(stateProgressionScript)

  const iterate = delay => {
    setTimeout(async () => {

      // Query the latest utxo with the NFT token. Our custom provider backend
      // includes utxos created by mempool transactions and removes utxos
      // that are spent by mempool transactions but have not yet been included
      // into a block.
      const scriptUtxos = await lucid.utxosAtWithUnit(scriptAddr, unit)
      // Sanity check that we only have one state utxo
      if (scriptUtxos.length !== 1) {
        return
      }
      // Pull the datum from the state utxo. This is the current "state" of the
      // script.
      const stateUtxo = scriptUtxos[0]

      // Deserialize using the state schema
      const state = Data.from(stateUtxo.datum, CounterSchema)

      state.counter++
      console.log(wallet_name + ": state counter " + state.counter)

      const tx = await lucid.newTx()
        .collectFrom([stateUtxo], Data.void()) // no redeemer
        .attachSpendingValidator(stateProgressionScript)
        .payToContract(scriptAddr, { inline: Data.to(state, CounterSchema) }, { [unit]: 1n })
        .complete()

      const signedTx = await tx.sign().complete()
      signedTx.submit()

      iterate(Math.random() * sleep_delay * 2)

    }, delay)
  }

  iterate(Math.random() * sleep_delay * 2)
}

main()
