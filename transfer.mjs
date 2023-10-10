import { C, Lucid, PROTOCOL_PARAMETERS_DEFAULT } from 'lucid-cardano'
import { decode as decodeCbor } from 'cbor-x'

const wallet_name = process.argv[2]
const to_addr_name = process.argv[3]
const value = Math.floor(process.argv[4] * 1000000.0)
console.log("Using wallet: " + wallet_name)

class DevnetProviderFrontend {

  constructor(url) {
    this.url = url
    this.nextId = 0
    this.queue = {}
  }

  async init() {
    return new Promise(resolve => {
      this.sock = new WebSocket(this.url)
      this.sock.onopen = () => {
        console.log("Provider connected")
        resolve()
      }
      this.sock.onerror = err => {
        console.log("Provider error: " + err.message)
      }
      this.sock.onmessage = async msg => {
        const obj = JSON.parse(msg.data)
        if (this.queue[obj.id] !== undefined) {
          if (obj.error !== undefined) {
            console.error("Error: " + obj.error)
          } else {
            await this.queue[obj.id](obj.result)
            delete this.queue[obj.id]
          }
        }
      }
    })
  }

  async query(obj) {
    obj.jsonrpc = "2.0"
    obj.id = this.nextId++
    this.sock.send(JSON.stringify(obj))
    return new Promise(resolve => {
      this.queue[obj.id] = resolve
    })
  }

  getProtocolParameters() {
    return PROTOCOL_PARAMETERS_DEFAULT
  }

  async getUtxos(addressOrCredential) {
    const credentialBech32 = addressOrCredential.type === "Key"
      ? C.Ed25519KeyHash.from_hex(addressOrCredential.hash).to_bech32("addr_test") :
      C.ScriptHash.from_hex(addressOrCredential.hash).to_bech32("addr_test")
    return await this.query({
      method: "getUtxos",
      params: {
        address: credentialBech32
      }
    })
  }

  async submitTx(tx) {
    return await this.query({
      method: "submitTx",
      params: {
        cbor: tx
      }
    })
  }

}

const main = async () => {
  const provider = new DevnetProviderFrontend("ws://localhost:1338")
  await provider.init()
  const lucid = await Lucid.new(provider, "Custom")

  const encoder = new TextEncoder()
  const cbor = JSON.parse(fs.readFileSync(process.env.KEYS_PATH + "/" + wallet_name + ".skey").toString())
  const decoded = decodeCbor(Buffer.from(cbor.cborHex, 'hex'))
  const privKey = C.PrivateKey.from_normal_bytes(decoded)
  lucid.selectWalletFromPrivateKey(privKey.to_bech32())

  const toAddr = fs.readFileSync(process.env.ADDR_PATH + "/" + to_addr_name + ".addr").toString()
  const tx = await lucid.newTx()
    .payToAddress(toAddr, { lovelace: value })
    .complete();

  const signedTx = await tx.sign().complete()

  const txHash = await signedTx.submit()
  console.log("Transaction sent: " + txHash)
  process.exit()
}

main()
