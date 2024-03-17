import { WebSocket } from 'ws'

export { OgmiosConnection, OgmiosStateMachine, OgmiosSynchronousRequestHandler }

class OgmiosConnection {

  constructor(port, stateMachine, synchronousRequestHandler) {
    // Ogmios connection
    this.ogmiosServer = new WebSocket("ws://localhost:" + port)
    this.nextId = 0
    this.stateMachine = stateMachine
    this.synchronousRequestHandler = synchronousRequestHandler

    this.ogmiosServer.once('open', async () => {
      if (this.stateMachine !== undefined ) {
        await this.stateMachine.init(this)
      }
      if (this.synchronousRequestHandler !== undefined) {
        await this.synchronousRequestHandler.init(this)
      }
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

  addCallback(cb) {
    this.blockCallbacks.push(cb)
  }

  findIntersection(msg) {
    this.ogmios.send({
      method: "nextBlock"
    })
  }

  nextBlock(msg) {
    if (msg.result.block !== undefined) {
      // Trigger callbacks if any
      this.blockCallbacks.map(cb => {
        cb(msg.result.block)
      })
    }
    // Clear callback
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
  }

  releaseMempool(msg) {
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