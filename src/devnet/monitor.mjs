import fs from 'fs'
import path from 'path'
import bunyan from 'bunyan'
import blessed from 'blessed'
import { WebSocket, WebSocketServer } from 'ws'
import bech32 from 'bech32-buffer'
import { C } from 'lucid-cardano'
import { decode as decodeCbor } from 'cbor-x'

// Output logging
const log = bunyan.createLogger({
  name: 'myapp',
  streams: [
    {
      level: 'info',
      path: process.env.DEVNET_ROOT + '/cardano-devnet.log'
    }
  ]
})

const OGMIOS_PORT = 1337
const LUCID_PORT = 1338

let currentBlockHash = ""
let currentSlot = 0

// Load Jambhala addresses
const jambhalaAddresses = {} // name lookup by address
const jambhalaNames = {} // address lookup by name
if (process.env.CARDANO_CLI_GURU !== undefined) {
  const JAMBHALA_ADDRESSES = process.env.CARDANO_CLI_GURU + "/assets/addr"
  const files = fs.readdirSync(JAMBHALA_ADDRESSES)
  files.forEach((file, index) => {
    const name = path.basename(file, '.addr')
    const ext = path.extname(file)
    if (ext === ".addr") {
      const addressFile = path.join(JAMBHALA_ADDRESSES, file)
      const addr = fs.readFileSync(addressFile).toString()
      jambhalaAddresses[name] = addr
      jambhalaNames[addr] = name
    }
  })
}

// Load Jambhala protocol params
//const params = JSON.parse(fs.readFileSync(process.env.PARAMS_PATH))

// Used to store indexed transactions by utxo ref. Since this is just a local devnet
// we're not concerned about the size of this mapping. On a global testnet or the
// mainnet, a production indexer should be used.
const jambhalaTransactions = {}

// Terminal output
const screen = blessed.screen({
  smartCSR: true
})

const box = blessed.box({
  top: 'center',
  left: 'center',
  width: '100%',
  height: '100%',
  content: '  Blockchain Status',
  tags: true,
  border: {
    type: 'line'
  },
  style: {
    fg: 'white',
    bg: 'gray'
  }
})
const blockHeight = blessed.text({
  top: 2,
  left: 1,
  width: '100%',
  height: 1,
  tags: true,
  content: " Block height:",
  style: {
    bg: 'gray'
  }
})
const blockHash = blessed.text({
  top: 3,
  left: 1,
  width: 73,
  height: 1,
  content: " Hash:",
  style: {
    bg: 'gray'
  }
})
const latestTransaction = blessed.text({
  top: 5,
  left: 1,
  width: '100%-4',
  height: 1,
  tags: true,
  content: " Latest Tx:"
})
const latestUtxoList = blessed.text({
  top: 7,
  left: 10,
  width: '90%',
  height: 0,
  tags: true,
  style: {
    bg: 'gray'
  }
})
const mempoolTransactions = blessed.text({
  top: 8,
  left: 1,
  width: '100%-4',
  height: 1,
  content: " Mempool:"
})
const mempoolTxList = blessed.text({
  top: 10,
  left: 10,
  width: '90%',
  height: 0,
  tags: true,
  style: {
    bg: 'gray'
  }
})
box.append(blockHeight)
box.append(blockHash)
box.append(latestTransaction)
box.append(latestUtxoList)
box.append(mempoolTransactions)
box.append(mempoolTxList)

screen.append(box)
box.focus()

screen.key(['q', 'C-c'], (ch, key) => {
  return process.exit()
})

screen.render()

const colorTx = str => {
  return "{yellow-fg}" + str + "{/}"
}

const colorUtxo = str => {
  return "{red-fg}" + str + "{/}"
}

const colorAddr = str => {
  return "{blue-fg}" + str + "{/}"
}

const colorValue = str => {
  return "{green-fg}" + str + "{/}"
}

const formatTx = tx => {
  let str = ""
  let height = 0
  // Lines with both an input and output
  for (var i = 0; i < tx.inputs.length; i++) {
    const input = tx.inputs[i]
    const key = input.transaction.id + "#" + input.index
    if (jambhalaTransactions[key] !== undefined) {
      const [n, v] = jambhalaTransactions[key]
      const lStr = "#" + input.index + ": " + n
      const vStr = "  ₳ " + v
      str += lStr + " ".repeat(64 - lStr.length - vStr.length) + colorValue(vStr)
    } else {
      str += " ".repeat(64)
      //str += "unindexed utxo (genesis?)" + " ".repeat(39)
    }
    if (tx.outputs[i] !== undefined) {
      const output = tx.outputs[i]
      let line = "#" + i + ": "
      if (jambhalaNames[output.address] !== undefined) {
        line += jambhalaNames[output.address]
      }
      const value = output.value.ada.lovelace / 1000000.0
      const vStr = "₳ " + value.toFixed(6)
      str += " ".repeat(70 - key.length) + " -->    " + line
      str += " ".repeat(output.address.length - line.length - vStr.length)
      str += colorValue(vStr)
    }
    str += "\n"
    height += 1
    str += colorUtxo(input.transaction.id) + " ".repeat(78 - key.length)
    if (tx.outputs[i] !== undefined) {
      const output = tx.outputs[i]
      str += colorAddr(output.address)
    }
    str += "\n\n"
    height += 2
  }
  // Lines with just an output
  for (var i = tx.inputs.length; i < tx.outputs.length; i++) {
    const output = tx.outputs[i]
    let line = "#" + i + ": "
    if (jambhalaNames[output.address] !== undefined) {
      line += jambhalaNames[output.address]
    }
    const value = output.value.ada.lovelace / 1000000.0
    const vStr = "₳ " + value.toFixed(6)
    str += " ".repeat(76) + line + " ".repeat(output.address.length - line.length - vStr.length)
    str += colorValue(vStr) + "\n"
    str += " ".repeat(76) + colorAddr(output.address) + "\n"
    height += 2
  }
  return [str, height]
}

class DevnetIndexer {

  constructor() {
    this.utxos = {}
    this.addrs = {}
  }

  consumeUtxo(id, index) {
    const utxoRef = id + "#" + index
    //log.info("consuming: " + utxoRef)
    if (this.utxos[utxoRef] !== undefined) {
      const [addr, value] = this.utxos[utxoRef]
      delete this.utxos[utxoRef]
      if (this.addrs[addr] !== undefined) {
        this.addrs[addr] = this.addrs[addr].filter(el => {
          if (el === utxoRef) {
            return false
          }
          return true
        })
      }
    }
  }

  produceUtxo(id, index, addr, value, datum, script) {
    const utxoRef = id + "#" + index
    const lucidScript = this.ogmiosScriptToLucid(script)
    //log.info("producing: " + utxoRef + " " + addr + " " + JSON.stringify(value))
    if (this.utxos[utxoRef] === undefined) { // only produce once
      this.utxos[utxoRef] = [addr, value, datum, lucidScript]
      if (this.addrs[addr] === undefined) {
        this.addrs[addr] = []
      }
      this.addrs[addr].push(utxoRef)
    }
  }

  utxosAtAddress(bech32Addr) {
    //log.info("Fetching utxos at address: " + bech32Addr)
    if (this.addrs[bech32Addr] !== undefined) {
      const utxos = this.addrs[bech32Addr].map(ref => {
        const parts = ref.split("#")
        const [addr, value, datum, script] = this.utxos[ref]
        return [parts[0], parseInt(parts[1], 10), addr, value, datum, script]
      })
      return utxos
    }
    return []
  }

  utxoAtRef(outref) {
    const parts = outref.split("#")
    const [addr, value, datum, script] = this.utxos[outref]
    return [parts[0], parseInt(parts[1], 10), addr, value, datum, script]
  }

  ogmiosScriptToLucid(script) {
    if (script === undefined) {
      return undefined
    }
    let t = "not supported"
    if (script.language === "plutus:v2") {
      t = "PlutusV2"
    }
    return {
      type: t,
      script: script.cbor
    }
  }

}

class OgmiosConnection {

  constructor(port, stateMachine, synchronousRequestHandler) {
    // Ogmios connection
    this.ogmiosServer = new WebSocket("ws://localhost:" + port)
    this.nextId = 0
    this.stateMachine = stateMachine
    this.synchronousRequestHandler = synchronousRequestHandler

    this.ogmiosServer.once('open', async () => {
      await this.stateMachine.init(this)
      await this.synchronousRequestHandler.init(this)
    })

    this.ogmiosServer.on('message', msg => {
      const response = JSON.parse(msg)
      if (this.stateMachine[response.method] !== undefined) {
        // Send to the state machine
        this.stateMachine[response.method](response)
      } else {
        // Send to the response handler
        this.synchronousRequestHandler.handleResponse(response)
      }
    })
  }

  send(jsonRpcObj) {
    jsonRpcObj.jsonrpc = "2.0"
    jsonRpcObj.id = this.nextId++
    this.ogmiosServer.send(JSON.stringify(jsonRpcObj))
    return jsonRpcObj.id
  }

}

class OgmiosStateMachine {

  constructor(indexer) {
    this.indexer = indexer
    this.blockCallbacks = []
  }

  async init(ogmios) {
    this.ogmios = ogmios

    // Initiate sync and mempool monitoring
    this.ogmios.send({
      method: "findIntersection",
      params: {
        points: ["origin"]
      }
    })
    this.ogmios.send({
      method: "acquireMempool"
    })
  }

  async waitBlock(cb) {
    this.blockCallbacks.push(cb)
  }

  findIntersection(msg) {
    this.ogmios.send({
      method: "nextBlock"
    })
  }

  nextBlock(msg) {
    if (msg.result.block !== undefined) {
      currentBlockHash = msg.result.block.id
      currentSlot = msg.result.block.slot
      const density = 100.0 * msg.result.block.height / msg.result.block.slot
      blockHeight.content = " Block height: " + msg.result.block.height + " slot: " + msg.result.block.slot + " chain density: " + density.toFixed(2) + "%"
      blockHash.content = " Hash: " + msg.result.block.id
      msg.result.block.transactions.forEach(tx => {
        tx.inputs.forEach(input => {
          indexer.consumeUtxo(input.transaction.id, input.index)
        })
        tx.outputs.forEach((output, index) => {
          const value = output.value.ada.lovelace / 1000000.0
          indexer.produceUtxo(tx.id, index, output.address, output.value, output.datum, output.script)
          if (jambhalaNames[output.address] !== undefined) {
            jambhalaTransactions[tx.id + "#" + index] = [jambhalaNames[output.address], value]
          }
        })
      })
      if (msg.result.block.transactions.length > 0) {
        // Last tx
        const lastTx = msg.result.block.transactions[msg.result.block.transactions.length - 1]
        const fee = lastTx.fee.lovelace / 1000000.0
        latestTransaction.content = " Latest Tx: " + colorTx(lastTx.id) + "  Fee: ₳ " + fee.toFixed(6)

        const [text, height] = formatTx(lastTx)
        latestUtxoList.content = text
        latestUtxoList.height = height

        mempoolTransactions.top = 8 + height
        mempoolTxList.top = 10 + height
      }
      screen.render()
    }
    // Trigger callbacks if any
    this.blockCallbacks.map(cb => {
      cb()
    })
    // Clear callback
    this.blockCallbacks = []
    this.ogmios.send({
      method: "nextBlock"
    })
  }

  acquireMempool(msg) {
    this.ogmios.send({
      method: "nextTransaction",
      params: {
        fields: "all"
      }
    })
    mempoolTxList.newContent = ""
    mempoolTxList.newHeight = 0
    screen.render()
  }

  releaseMempool(msg) {
    if (mempoolTxList.content !== mempoolTxList.newContent) {
      mempoolTxList.content = mempoolTxList.newContent
      mempoolTxList.height = mempoolTxList.newHeight
      screen.render()
    }
    setTimeout(() => {
      this.ogmios.send({
        method: "acquireMempool"
      })
    }, 1000)
  }

  nextTransaction(msg) {
    if (msg.result.transaction === null) {
      this.ogmios.send({
        method: "releaseMempool"
      })
    } else {
      const tx = msg.result.transaction
      let str = ""
      let h = 0
      for (var i = 0; i < tx.inputs.length; i++) {
        indexer.consumeUtxo(tx.inputs[i].transaction.id, tx.inputs[i].index)
        str += "    " + colorUtxo(tx.inputs[i].transaction.id + "#" + tx.inputs[i].index)
        if (i === 0) str += "   -->   "
        else str += "         "
        if (i < tx.outputs.length) {
          const value = tx.outputs[i].value.ada.lovelace / 1000000.0
          indexer.produceUtxo(tx.id, i, tx.outputs[i].address, tx.outputs[i].value, tx.outputs[i].datum, tx.outputs[i].script)
          const vStr = "₳ " + value.toFixed(6)
          str += colorAddr(tx.outputs[i].address) + "  " + colorValue(vStr)
        }
        str += "\n"
        h++
      }
      for (var i = tx.inputs.length; i < tx.outputs.length; i++) {
        const value = tx.outputs[i].value.ada.lovelace / 1000000.0
        indexer.produceUtxo(tx.id, i, tx.outputs[i].address, tx.outputs[i].value, tx.outputs[i].datum, tx.outputs[i].script)
        const vStr = "₳ " + value.toFixed(6)
        str += " ".repeat(79) + colorAddr(tx.outputs[i].address) + "  " + colorValue(vStr) + "\n"
        h++
      }
      mempoolTxList.newContent += "Tx: " + colorTx(tx.id) + "\n" + str + "\n"
      mempoolTxList.newHeight += h + 2
      this.ogmios.send({
        method: "nextTransaction",
        params: {
          fields: "all"
        }
      })
    }
  }

}

class OgmiosSynchronousRequestHandler {

  constructor() {
    this.pending = {}
  }

  async init(ogmios) {
    this.ogmios = ogmios
  }

  handleResponse(obj) {
    if (this.pending[obj.id] !== undefined) {
      this.pending[obj.id](obj)
      delete this.pending[obj.id]
    }
  }

  async acquireLedgerState() {
    const obj = await new Promise(resolve => {
      const id = this.ogmios.send({
        method: "acquireLedgerState",
        params: {
          point: {
            slot: currentSlot,
            id: currentBlockHash
          }
        }
      })
      this.pending[id] = resolve
    })
    if (obj.result.acquired === "ledgerState") {
      return true
    } else {
      throw Error("Failed to acquire ledger state")
    }
  }

  async releaseLedgerState() {
    this.ogmios.send({
      method: "releaseLedgerState"
    })
  }

  async queryProtocolParameters() {
    const obj = await new Promise(resolve => {
      const id = this.ogmios.send({
        method: "queryLedgerState/protocolParameters"
      })
      this.pending[id] = resolve
    })
    return obj.result
  }

  async queryProposedProtocolParameters() {
    const obj = await new Promise(resolve => {
      const id = this.ogmios.send({
        method: "queryLedgerState/proposedProtocolParameters"
      })
      this.pending[id] = resolve
    })
    return obj.result
  }

  async submitTx(tx) {
    const obj = await new Promise(resolve => {
      const id = this.ogmios.send({
        method: "submitTransaction",
        params: {
          transaction: {
            cbor: tx
          }
        }
      })
      this.pending[id] = resolve
    })
    if (obj.error !== undefined) {
      throw Error(obj.error.message)
    }
    return obj.result
  }

}

class LucidProviderBackend {

  constructor(ogmios, osm, indexer, port) {
    this.ogmios = ogmios
    this.osm = osm
    this.indexer = indexer
    this.server = new WebSocketServer({ port: port })
    this.server.on('connection', sock => {
      sock.on('message', async msg => {
        const request = JSON.parse(msg.toString())
        if (request.jsonrpc !== "2.0") {
          this.providerError(sock, request.id, "invalid jsonrpc version")
        } else if (this[request.method] === undefined) {
          this.providerError(sock, request.id, "invalid request method")
        } else {
          try {
            const result = await this[request.method](request.params)
            sock.send(JSON.stringify({
              jsonrpc: "2.0",
              method: request.method,
              result: result,
              id: request.id
            }))
          } catch (err) {
            log.info(err.stack)
            sock.send(JSON.stringify({
              jsonrpc: "2.0",
              error: err.message,
              id: request.id
            }))
          }
        }
      })
    })
  }

  // Simply waits for the next block before it returns. Useful for synchronizing bash
  // scripts or other sequencing transactions
  async waitBlock() {
    await new Promise(resolve => {
      this.osm.waitBlock(() => {
        resolve()
      })
    })
    return {}
  }

  async getSymbolicAddr(params) {
    if (process.env.ADDR_PATH !== undefined) {
      const addressFile = process.env.ADDR_PATH + "/" + params.name + ".addr"
      const addr = fs.readFileSync(addressFile).toString()
      return {
        name: params.name,
        addr: addr
      }
    }
  }

  async getSymbolicPrivKey(params) {
    // This is intended only for devnet testing, obviously not a secure method
    if (process.env.KEYS_PATH !== undefined) {
      const keysFile = process.env.KEYS_PATH + "/" + params.name + ".skey"
      const cbor = JSON.parse(fs.readFileSync(keysFile).toString())
      const decoded = decodeCbor(Buffer.from(cbor.cborHex, 'hex'))
      const privKey = C.PrivateKey.from_normal_bytes(decoded).to_bech32()
      return {
        name: params.name,
        priv: privKey
      }
    }
  }

  async getUtxos(params) {
    // Return list of unspent utxos, including mempool tx's
    let addr
    if (params.credential !== undefined) {
      // Note: credential comes in as a bech32 address encoded from a credential _without_
      // the 60 (testnet) or 61 (mainnet) byte prefix.  Don't know a better way except
      // to decode the bech32 address, add the prefix, then re-encode the credential 
      // to get an address that matches the indexer database
      const cred = bech32.decode(params.credential)
      const data = new Uint8Array([0x60, ...cred.data])
      addr = bech32.encode('addr_test', data)
    } else {
      addr = params.address
    }
    return this.indexer.utxosAtAddress(addr).map(utxo => {
      const amounts = utxo[3]
      const collapsedUtxoValue = {}
      Object.keys(amounts).map(policy => {
        if (policy === "ada") {
          collapsedUtxoValue["lovelace"] = amounts[policy].lovelace
        } else {
          Object.keys(amounts[policy]).map(name => {
            collapsedUtxoValue[policy + name] = amounts[policy][name]
          })
        }
      })
      return {
        txHash: utxo[0],
        outputIndex: utxo[1],
        assets: collapsedUtxoValue,
        address: utxo[2],
        datumHash: null,
        datum: utxo[4],
        scriptRef: utxo[5]
      }
    })
  }

  async getUtxosWithUnit(params) {
    const utxos = await this.getUtxos(params)
    return utxos.filter(utxo => {
      return utxo.assets[params.unit] !== undefined
    })
  }

  async getUtxosByOutRef(params) {
    const outrefs = params.outrefs
    return outrefs.map(outref => {
      const ref = outref.txHash + "#" + outref.outputIndex
      const utxo = this.indexer.utxoAtRef(ref)
      const amounts = utxo[3]
      const collapsedUtxoValue = {}
      Object.keys(amounts).map(policy => {
        if (policy === "ada") {
          collapsedUtxoValue["lovelace"] = amounts[policy].lovelace
        } else {
          Object.keys(amounts[policy]).map(name => {
            collapsedUtxoValue[policy + name] = amounts[policy][name]
          })
        }
      })
      const obj = {
        txHash: utxo[0],
        outputIndex: utxo[1],
        assets: collapsedUtxoValue,
        address: utxo[2],
        datumHash: null,
        datum: utxo[4],
        scriptRef: utxo[5]
      }
      return obj
    })
  }

  async submitTx(tx) {
    const res = await this.ogmios.submitTx(tx.cbor)
    log.info("Submitting transaction: " + tx.cbor.length + " bytes")
    return res.transaction.id
  }

  async getSymbolicAddress(params) {
    const name = params.name
    const bech32Addr = fs.readFileSync(process.env.ADDR_PATH + "/" + name + ".addr").toString()
    return bech32Addr
  }

  async getSymbolicPrivKey(params) {
    const name = params.name
    const cbor = JSON.parse(fs.readFileSync(process.env.KEYS_PATH + "/" + name + ".skey").toString())
    const decoded = decodeCbor(Buffer.from(cbor.cborHex, 'hex'))
    const privKey = C.PrivateKey.from_normal_bytes(decoded).to_bech32()
    return privKey
  }

  providerError(sock, id, msg) {
    sock.send(JSON.stringify({
      jsonrpc: "2.0",
      error: msg,
      id: id
    }))
  }

}

const indexer = new DevnetIndexer()
const osm = new OgmiosStateMachine(indexer)
const osrh = new OgmiosSynchronousRequestHandler()
const ogmios = new OgmiosConnection(OGMIOS_PORT, osm, osrh)
const lpv = new LucidProviderBackend(osrh, osm, indexer, LUCID_PORT)
