import { Data, Lucid, fromText } from 'lucid-cardano'
import { DevnetProviderFrontend } from '../lucid-frontend.mjs'
import { loadJambhalaAddress, loadJambhalaPrivKey, loadJambhalaNativeScript } from '../jambhala-utils.mjs'

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

const stringToHex = (str) => {
  let hex = ''
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    const hexValue = charCode.toString(16)

    // Pad with zeros to ensure two-digit representation
    hex += hexValue.padStart(2, '0')
  }
  return hex;
}

const currencySymbol = "d441227553a0f1a965fee7d60a0f724b368dd1bddbc208730fccebcf"

// Initial state object with counter set to 0
const zeroState = {
  tokenA: {
    currencySymbol: currencySymbol,
    tokenName: stringToHex("TokenA")
  },
  amountTokenA: 0n,
  tokenB: {
    currencySymbol: currencySymbol,
    tokenName: stringToHex("TokenB")
  },
  amountTokenB: 0n
}

const main = async () => {
  const provider = new DevnetProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  lucid.selectWalletFromPrivateKey(loadJambhalaPrivKey("owner"))

  // Get the state token policyId + name
  const script = loadJambhalaNativeScript("state-token")
  const mintingPolicy = lucid.utils.nativeScriptFromJson(script)
  const policyId = lucid.utils.mintingPolicyToId(mintingPolicy)
  const unit = policyId + fromText("stateToken")

  // Get the script address
  const scriptAddr = loadJambhalaAddress("bonding-curve")

  // Serialize the counter = 0 state to CBOR
  const datum = Data.to(zeroState, BondingCurveSchema)
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
