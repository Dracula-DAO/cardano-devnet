import { Lucid, fromText } from 'lucid-cardano'
import { LucidProviderFrontend } from '../../lucid-frontend.mjs'
import { loadPrivateKey } from '../../key-utils.mjs'

const main = async () => {
  if (process.argv.length !== 5) {
    console.log("Usage: node mint-trading-tokens.mjs <wallet_name> <token A amount> <token B amount>")
    process.exit()
  }

  const wallet_name = process.argv[2]
  console.log("Using wallet: " + wallet_name)

  const amount_token_a = parseInt(process.argv[3], 10)
  const amount_token_b = parseInt(process.argv[4], 10)
  console.log("Minting " + amount_token_a + " TokenA and " + amount_token_b + " TokenB")

  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  // Mint an NFT "state token"
  lucid.selectWalletFromPrivateKey(loadPrivateKey(wallet_name))

  // Get the state token policyId + name
  const script = JSON.parse(fs.readFileSync("trading-token.script"))
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  console.log("Policy ID: " + policyId)
  const tokenAName = fromText("TokenA")
  const tokenBName = fromText("TokenB")

  try {

    const tx = await lucid.newTx()
      .mintAssets({
        [policyId + tokenAName]: BigInt(amount_token_a),
        [policyId + tokenBName]: BigInt(amount_token_b)
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
