import { Data, Lucid, fromText } from 'lucid-cardano'
import { LucidProviderFrontend } from '../../lucid-frontend.mjs'
import { loadJambhalaPrivKey, loadJambhalaNativeScript, loadJambhalaPlutusScript } from '../../jambhala-utils.mjs'

// This schema must match the state type for the validator script
const BondingCurveSchema = Data.Object({
  tokenA: Data.Object({
    currencySymbol: Data.Bytes(),
    tokenName: Data.Bytes()
  }),
  amountTokenA: Data.Integer(),
  tokenB: Data.Object({
    currencySymbol: Data.Bytes(),
    tokenName: Data.Bytes()
  }),
  amountTokenB: Data.Integer()
})

const main = async () => {
  if (process.argv.length !== 5) {
    console.log("Usage: node <script> <wallet_name> <dir (AtoB | BtoA)> <trade in amount>")
    process.exit()
  }

  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const wallet_name = process.argv[2]
  console.log("Using wallet: " + wallet_name)
  lucid.selectWalletFromPrivateKey(loadJambhalaPrivKey(wallet_name))

  let dir = 0
  if (process.argv[3] === "AtoB") dir = 1
  if (process.argv[3] === "BtoA") dir = -1
  const amount = BigInt(parseInt(process.argv[4], 10))

  // Get the state token policyId + name
  const stateScript = loadJambhalaNativeScript("state-token")
  const stateMintingPolicy = lucid.utils.nativeScriptFromJson(stateScript)
  const statePolicyId = lucid.utils.mintingPolicyToId(stateMintingPolicy)
  const stateUnit = statePolicyId + fromText("stateToken")

  // Get the trading token policyId 
  const tradingScript = loadJambhalaNativeScript("trading-token")
  const tradingMintingPolicy = lucid.utils.nativeScriptFromJson(tradingScript)
  const tradingPolicyId = lucid.utils.mintingPolicyToId(tradingMintingPolicy)
  const tokenA = tradingPolicyId + fromText("TokenA")
  const tokenB = tradingPolicyId + fromText("TokenB")

  // Load the script and compute the script address from it
  const validator = loadJambhalaPlutusScript("bonding-curve")
  const bondingCurveScript = {
    type: "PlutusV2",
    script: validator.cborHex
  }
  const scriptAddr = lucid.utils.validatorToAddress(bondingCurveScript)

  // Query the latest utxo with the NFT token. Our custom provider backend
  // includes utxos created by mempool transactions and removes utxos
  // that are spent by mempool transactions but have not yet been included
  // into a block.
  const scriptUtxos = await lucid.utxosAtWithUnit(scriptAddr, stateUnit)
  // Sanity check that we only have one state utxo
  if (scriptUtxos.length !== 1) {
    throw Error("Multiple state utxos encountered")
  }
  // Pull the datum from the state utxo. This is the current "state" of the
  // script.
  const stateUtxo = scriptUtxos[0]

  // Deserialize using the state schema
  const state = Data.from(stateUtxo.datum, BondingCurveSchema)

  let final_token_a = 0
  let final_token_b = 0
  let amount_token_a = 0
  let amount_token_b = 0
  if (dir > 0) {
    final_token_a = state.amountTokenA + amount
    final_token_b = state.amountTokenA * state.amountTokenB / final_token_a + 1n
    amount_token_a = amount
    amount_token_b = state.amountTokenB - final_token_b
    console.log("Swapping " + amount_token_a + " TokenA for " + amount_token_b + " TokenB")
  } else {
    final_token_b = state.amountTokenB + amount
    final_token_a = state.amountTokenA * state.amountTokenB / final_token_b + 1n
    amount_token_b = amount
    amount_token_a = state.amountTokenA - final_token_a
    console.log("Swapping " + amount_token_b + " TokenB for " + amount_token_a + " TokenA")
  }

  console.log("Initial token amounts: " + state.amountTokenA + " A, " + state.amountTokenB + " B")
  state.amountTokenA = final_token_a
  state.amountTokenB = final_token_b
  console.log("New token amounts: " + state.amountTokenA + " A, " + state.amountTokenB + " B")

  //try {

  const tx = await lucid.newTx()
    .collectFrom([stateUtxo], Data.void()) // no redeemer
    .attachSpendingValidator(bondingCurveScript)
    .payToContract(scriptAddr, {
      inline: Data.to(state, BondingCurveSchema)
    }, {
      [stateUnit]: 1n,
      [tokenA]: state.amountTokenA,
      [tokenB]: state.amountTokenB
    })
    .complete()
    .catch(e => {
      console.log(e)
    })

  const signedTx = await tx.sign().complete()
  const txHash = await signedTx.submit()

  process.exit()
}

main()
