import { Lucid, fromText } from 'lucid-cardano'
import { DevnetProviderFrontend } from '../../lucid-frontend.mjs'
import { loadJambhalaNativeScript, loadJambhalaPrivKey } from '../../jambhala-utils.mjs'

const main = async () => {
  if (process.argv.length !== 4) {
    console.log("Usage: node <script> <wallet_name> <token A amount> <token B amount>")
    process.exit()
  }

  const wallet_name = process.argv[2]
  console.log("Using wallet: " + wallet_name)

  const amount_token_a = parseInt(process.argv[3], 10)
  const amount_token_b = parseInt(process.argv[4], 10)
  console.log("Minting " + amount_token_a + " TokenA and " + amount_token_b + " TokenB")

  const provider = new DevnetProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  // Mint an NFT "state token"
  lucid.selectWalletFromPrivateKey(loadJambhalaPrivKey(wallet_name))

  // Get the state token policyId + name
  const script = loadJambhalaNativeScript("trading-token")
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  console.log("Policy ID: " + policyId)
  const tokenA = policyId + fromText("TokenA")
  const tokenB = policyId + fromText("TokenB")

  try {

    const tx = await lucid.newTx()
      .mintAssets({
        [tokenA]: BigInt(amount_token_a),
        [tokenB]: BigInt(amount_token_b)
      })
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
