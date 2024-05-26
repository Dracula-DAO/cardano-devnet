import { Data, Lucid, fromText, applyParamsToScript } from 'lucid-cardano'
import { LucidProviderFrontend } from '../../lucid-frontend.mjs'
import { loadPrivateKey } from '../../key-utils.mjs'

const main = async () => {
  if (process.argv.length !== 5) {
    console.log("Usage: node add-liquidity.mjs <wallet_name> <token A amount> <token B amount>")
    process.exit()
  }

  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const wallet_name = process.argv[2]
  console.log("Using wallet: " + wallet_name)
  lucid.selectWalletFromPrivateKey(loadPrivateKey(wallet_name))

  const amount_token_a = BigInt(parseInt(process.argv[3], 10))
  const amount_token_b = BigInt(parseInt(process.argv[4], 10))
  console.log("Creating utxo with " + amount_token_a + " TokenA and " + amount_token_b + " TokenB")

  // Get the trading token policyId 
  const tradingScript = JSON.parse(fs.readFileSync("trading-token.script"))
  const tradingMintingPolicy = lucid.utils.nativeScriptFromJson(tradingScript)
  const tradingPolicyId = lucid.utils.mintingPolicyToId(tradingMintingPolicy)
  console.log("trading policy: " + tradingPolicyId)
  const tokenAName = fromText("TokenA")
  const tokenBName = fromText("TokenB")

  // Load the script and compute the script address from it
  const script = JSON.parse(fs.readFileSync("aiken/plutus.json"))
  const validator = {
    type: "PlutusV2",
    script: applyParamsToScript(script.validators[0].compiledCode, [
      tradingPolicyId, tokenAName,
      tradingPolicyId, tokenBName
    ])
  }
  const scriptAddr = lucid.utils.validatorToAddress(validator)
  console.log("Script address=" + scriptAddr)

  try {

    const tx = await lucid.newTx()
      .payToContract(scriptAddr, { inline: Data.void() }, {
        [tradingPolicyId + tokenAName]: amount_token_a,
        [tradingPolicyId + tokenBName]: amount_token_b
      })
      .complete()
      .catch(e => {
        console.log(e)
      })

    const signedTx = await tx.sign().complete()
    const txHash = await signedTx.submit()

  } catch (err) {
    console.log("Caught error: " + err)
  }

  process.exit()
}

main()
