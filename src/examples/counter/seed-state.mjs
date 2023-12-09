import { Data, Lucid, fromText } from 'lucid-cardano'
import { LucidProviderFrontend } from '../../lucid-frontend.mjs'
import { loadJambhalaAddress, loadJambhalaPrivKey, loadJambhalaNativeScript } from '../../jambhala-utils.mjs'

// This schema must match the state type for the validator script
const CounterSchema = Data.Object({
  counter: Data.Integer()
})

// Initial state object with counter set to 0
const zeroState = { counter: 0n }

const main = async () => {
  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  lucid.selectWalletFromPrivateKey(loadJambhalaPrivKey("owner"))

  // Get the state token policyId + name
  const script = loadJambhalaNativeScript("state-token")
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  const unit = policyId + fromText("stateToken")

  // Get the script address
  const scriptAddr = loadJambhalaAddress("state-progression")

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
