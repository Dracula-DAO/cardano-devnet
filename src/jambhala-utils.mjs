import { C } from 'lucid-cardano'
import { decode as decodeCbor } from 'cbor-x'

export const loadJambhalaAddress = name => {
  const bech32Addr = fs.readFileSync(process.env.ADDR_PATH + "/" + name + ".addr").toString()
  console.log("Loaded address [" + name + "] = " + bech32Addr)
  return bech32Addr
}

export const loadJambhalaPrivKey = name => {
  const cbor = JSON.parse(fs.readFileSync(process.env.KEYS_PATH + "/" + name + ".skey").toString())
  const decoded = decodeCbor(Buffer.from(cbor.cborHex, 'hex'))
  const privKey = C.PrivateKey.from_normal_bytes(decoded).to_bech32()
  return privKey
}

export const loadJambhalaNativeScript = name => {
  const json = JSON.parse(fs.readFileSync(process.env.NATIVE_SCRIPTS_PATH + "/" + name + ".script").toString())
  return json
}

export const loadJambhalaPlutusScript = name => {
  const json = JSON.parse(fs.readFileSync(process.env.PLUTUS_SCRIPTS_PATH + "/" + name + ".plutus").toString())
  return json
}
