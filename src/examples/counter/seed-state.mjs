import fs from 'fs'

import { Data, Lucid, fromText, applyParamsToScript } from 'lucid-cardano'
import { LucidProviderFrontend } from '../../lucid-frontend.mjs'
import { loadPrivateKey } from '../../key-utils.mjs'

// This schema must match the state type for the validator script
// See aiken/validators/counter.ak for the state type
const CounterSchema = Data.Object({
  counter: Data.Integer()
})

// Initial state object with counter set to 0
const zeroState = { counter: 0n }

const main = async () => {
  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  lucid.selectWalletFromPrivateKey(loadPrivateKey("owner"))

  // Get the state token policyId
  const script = JSON.parse(fs.readFileSync("state-token.script"))
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  const unit = policyId + fromText("counter-token")

  // Get the script address
  const counterScript = JSON.parse(fs.readFileSync("aiken/plutus.json"))
  const validator = {
    type: "PlutusV2",
    script: applyParamsToScript(counterScript.validators[0].compiledCode, [
      policyId, fromText("counter-token")
    ])
  }
  const scriptAddr = lucid.utils.validatorToAddress(validator)
  console.log("Script address=" + scriptAddr)

  // Serialize the counter = 0 state to CBOR
  const datum = Data.to(zeroState, CounterSchema)
  console.log("Datum=" + datum)

  try {

    // Create a utxo with counter = 0 and the state NFT token attached
    const tx = await lucid.newTx()
      .payToContract(scriptAddr, { inline: datum }, { [unit]: 1n })
      .complete()

    const signedTx = await tx.sign().complete()
    const txHash = await signedTx.submit()

  } catch (err) {
    console.log("Caught error: " + err)
  }

  process.exit()
}

main()
