import fs from 'fs'

import { Data, Lucid, fromText, applyParamsToScript } from 'lucid-cardano'
import { LucidProviderFrontend } from '../../lucid-frontend.mjs'
import { loadPrivateKey } from '../../key-utils.mjs'

// This schema must match the state type for the validator script
const CounterSchema = Data.Object({
  counter: Data.Integer()
})

const main = async () => {
  if (process.argv.length !== 3) {
    console.log("Usage: node increment-state.mjs <wallet_name>")
    process.exit()
  }

  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const wallet_name = process.argv[2]
  console.log("Using wallet: " + wallet_name)
  lucid.selectWalletFromPrivateKey(loadPrivateKey(wallet_name))

  // Get the state token policyId + name
  const script = JSON.parse(fs.readFileSync("state-token.script"))
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  const unit = policyId + fromText("counter-token")

  // Load the script and compute the script address from it
  const counterScript = JSON.parse(fs.readFileSync("aiken/plutus.json"))
  const validator = {
    type: "PlutusV2",
    script: applyParamsToScript(counterScript.validators[0].compiledCode, [
      policyId, fromText("counter-token")
    ])
  }
  const scriptAddr = lucid.utils.validatorToAddress(validator)
  console.log("Script address=" + scriptAddr)

  // Query the latest utxo with the NFT token. Our custom provider backend
  // includes utxos created by mempool transactions and removes utxos
  // that are spent by mempool transactions but have not yet been included
  // into a block.
  const scriptUtxos = await lucid.utxosAtWithUnit(scriptAddr, unit) 
  if (scriptUtxos.length === 0) {
    throw Error("No state utxos found")
  }
  // Sanity check that we only have one state utxo
  if (scriptUtxos.length > 1) {
    throw Error("Multiple state utxos encountered")
  }
  // Pull the datum from the state utxo. This is the current "state" of the
  // script.
  const stateUtxo = scriptUtxos[0]

  // Deserialize using the state schema
  const state = Data.from(stateUtxo.datum, CounterSchema)

  console.log("State counter is currently " + state.counter)
  state.counter++
  console.log("Next state is " + state.counter)

  try {

    const tx = await lucid.newTx()
      .collectFrom([stateUtxo], Data.void()) // no redeemer
      .attachSpendingValidator(validator)
      .payToContract(scriptAddr, { inline: Data.to(state, CounterSchema) }, { [unit]: 1n })
      .complete()

    const signedTx = await tx.sign().complete()
    const txHash = await signedTx.submit()

  } catch (err) {
    console.log("Caught error: " + err)
  }

  process.exit()
}

main()
