import { Lucid, fromText } from 'lucid-cardano'
import { DevnetProviderFrontend } from '../lucid-frontend.mjs'
import { loadJambhalaNativeScript, loadJambhalaPrivKey } from '../jambhala-utils.mjs'

const main = async () => {
  const provider = new DevnetProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  // Mint an NFT "state token"
  lucid.selectWalletFromPrivateKey(loadJambhalaPrivKey("owner"))

  // Get the state token policyId + name
  const script = loadJambhalaNativeScript("state-token")
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  console.log("Policy ID: " + policyId)
  const unit = policyId + fromText("stateToken")
  console.log("Minting state token: " + unit)

  try {

    const tx = await lucid.newTx()
      .mintAssets({ [unit]: 1n })
      .attachMintingPolicy(mintingPolicy)
      .complete()
    const signedTx = await tx.sign().complete()
    const txHash = await signedTx.submit()

  } catch (err) {
    console.log("Caught error: " + err)
  }

  process.exit()
}

main()
