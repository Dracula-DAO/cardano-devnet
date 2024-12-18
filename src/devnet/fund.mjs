import { C, Lucid } from 'lucid-cardano'
import { decode as decodeCbor } from 'cbor-x'
import { LucidProviderFrontend } from '../lucid-frontend.mjs'

const wallet_name = process.argv[2]
const value = Math.floor(process.argv[3] * 1000000.0)
console.log("Funding wallet: " + wallet_name)

const main = async () => {
  const provider = new LucidProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const cbor = JSON.parse(fs.readFileSync(process.env.KEYS_PATH + "/faucet" + ".skey").toString())
  const decoded = decodeCbor(Buffer.from(cbor.cborHex, 'hex'))
  const privKey = C.PrivateKey.from_normal_bytes(decoded)
  lucid.selectWalletFromPrivateKey(privKey.to_bech32())

  let toAddr
  if (wallet_name.startsWith("addr")) {
    toAddr = wallet_name
  } else {
    toAddr = fs.readFileSync(process.env.ADDR_PATH + "/" + wallet_name + ".addr").toString()
  }
  const tx = await lucid.newTx()
    .payToAddress(toAddr, { lovelace: value })
    .complete();

  const signedTx = await tx.sign().complete()

  const txHash = await signedTx.submit()
  console.log("Transaction sent: " + txHash)
  process.exit()
}

main()
