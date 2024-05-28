import { Data, Lucid, fromText, applyParamsToScript } from 'lucid-cardano'
import { LucidProviderFrontend } from '../../lucid-frontend.mjs'
import { loadPrivateKey } from '../../key-utils.mjs'

const main = async () => {
  if (process.argv.length !== 6) {
    console.log("Usage: node swap.mjs <wallet_name> [AtoB|BtoA] <trade in amount> <utxo>")
    process.exit()
  }

  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const wallet_name = process.argv[2]
  console.log("Using wallet: " + wallet_name)
  lucid.selectWalletFromPrivateKey(loadPrivateKey(wallet_name))

  let dir = 0
  if (process.argv[3] === "AtoB") dir = 1
  if (process.argv[3] === "BtoA") dir = -1
  const amount = BigInt(parseInt(process.argv[4], 10))

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

  // Get the current token amounts in utxo
  const outRefParts = process.argv[5].split("#")
  const [inUtxo] = await lucid.utxosByOutRef([{
    txHash: outRefParts[0],
    outputIndex: outRefParts[1]
  }])
  const inA = BigInt(inUtxo.assets[tradingPolicyId + tokenAName])
  const inB = BigInt(inUtxo.assets[tradingPolicyId + tokenBName])
  console.log(JSON.stringify(inUtxo, null, 2))

  let final_token_a = 0
  let final_token_b = 0
  let amount_token_a = 0
  let amount_token_b = 0
  if (dir > 0) {
    final_token_a = inA + amount
    final_token_b = inA * inB / final_token_a + 1n
    amount_token_a = amount
    amount_token_b = inB - final_token_b
    console.log("Swapping " + amount_token_a + " TokenA for " + amount_token_b + " TokenB")
  } else {
    final_token_b = inB + amount
    final_token_a = inA * inB / final_token_b + 1n
    amount_token_b = amount
    amount_token_a = inA - final_token_a
    console.log("Swapping " + amount_token_b + " TokenB for " + amount_token_a + " TokenA")
  }

  console.log("Initial token amounts: " + inA + " A, " + inB + " B")
  console.log("New token amounts: " + final_token_a + " A, " + final_token_b + " B")

  try {

    const tx = await lucid.newTx()
      .collectFrom([inUtxo], Data.void()) // no redeemer
      .attachSpendingValidator(validator)
      .payToContract(scriptAddr, { inline: Data.void() }, {
        [tradingPolicyId + tokenAName]: final_token_a,
        [tradingPolicyId + tokenBName]: final_token_b
      })
      .complete()
      .catch(e => {
        console.log(e)
      })

    const signedTx = await tx.sign().complete()
    const txHash = await signedTx.submit()
  
  } catch (err) {
    console.log("Caught error: " + err)
    console.log(err.stack)
  }

  process.exit()
}

main()
