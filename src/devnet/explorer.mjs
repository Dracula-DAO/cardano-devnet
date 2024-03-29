import express from 'express'
import { Liquid } from 'liquidjs'
import fs from 'fs'
const app = express()
const engine = new Liquid()

const PORT=3000
const TEMPLATE=process.env.DEVNET_ROOT + "/explorer"

let DB=process.env.DEVNET_ROOT + "/db"
if (process.env.CUSTOM_DB_ROOT !== undefined) {
  DB = process.env.CUSTOM_DB_ROOT
}
console.log("Using database=" + DB)

// Utils

function small_hash(hash) {
    return hash.slice(0, 6) + ".." + hash.slice(-6)
}

function small_addr(addr) {
    return addr.slice(0, 15) + ".." + addr.slice(-6)
}

function formatADA(lovelace) {
    let ada = ("" + lovelace).slice(0,-6)
    if (ada === "") ada = "0"
    return ada + "." + ("000000" + lovelace).slice(-6)
}

app.get('/', async (req, res) => {
  const blockTemplate = fs.readFileSync(TEMPLATE + "/block.template").toString()
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  latest.maxHeight = latest.height
  latest.showExtendLeft = latest.height > 1
  latest.showExtendRight = false
  res.setHeader("Content-Type", "text/html")
  const content = await engine.parseAndRender(blockTemplate, latest)
  res.send(content)
})

app.get("/css/:path*", async (req, res) => {
  res.setHeader("Content-Type", "text/css")
  res.sendFile(TEMPLATE + "/css/" + req.params.path)
})

app.get("/js/:path*", async (req, res) => {
  res.setHeader("Content-Type", "text/javascript")
  res.sendFile(TEMPLATE + "/js/" + req.params.path)
})

app.get("/block/:id", async (req, res) => {
  const blockTemplate = fs.readFileSync(TEMPLATE + "/block.template").toString()
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  const id = req.params.id
  const block = JSON.parse(fs.readFileSync(DB + "/blocks/" + id + "/block"))
  block.maxHeight = latest.height
  block.showExtendLeft = block.height > 1
  block.showExtendRight = block.height < latest.height - 1
  block.transactions = block.transactions.map(t => {
    const tobj = JSON.parse(fs.readFileSync(DB + "/transactions/" + t + "/tx"))
    return {
      hash: [t, small_hash(t)],
      inputCount: tobj.inputs.length,
      outputCount: tobj.outputs.length
    }
  })
  const content = await engine.parseAndRender(blockTemplate, block)
  res.setHeader("Content-Type", "text/html")
  res.send(content)
})

app.get("/chain/:height", async (req, res) => {
  const blockTemplate = fs.readFileSync(TEMPLATE + "/block.template").toString()
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  const height = req.params.height
  const block = JSON.parse(fs.readFileSync(DB + "/chain/" + height + "/block"))
  block.maxHeight = latest.height
  block.showExtendLeft = block.height > 1
  block.showExtendRight = block.height < latest.height - 1
  block.transactions = block.transactions.map(t => {
    const tobj = JSON.parse(fs.readFileSync(DB + "/transactions/" + t + "/tx"))
    return {
      hash: [t, small_hash(t)],
      inputCount: tobj.inputs.length,
      outputCount: tobj.outputs.length
    }
  })
  const content = await engine.parseAndRender(blockTemplate, block)
  res.setHeader("Content-Type", "text/html")
  res.send(content)
})

app.get("/transaction/:id", async (req, res) => {
  const tx = JSON.parse(fs.readFileSync(DB + "/transactions/" + req.params.id + "/tx"))
  try {
    const block = JSON.parse(fs.readFileSync(DB + "/transactions/" + req.params.id + "/block"))
    tx.block = block.id
    tx.blockHeight = block.height
  } catch (noSuchFile) {
    tx.block = "genesis"
    tx.blockHeight = 0
  }
  if (tx.inputs !== undefined) {
    tx.inputs = tx.inputs.map(input => {
      const [ intx, index ] = input.split("#")
      const intxfile = DB + "/transactions/" + intx + "/outputs/" + index + "/output"
      const val = JSON.parse(fs.readFileSync(intxfile))
      const obj = {
        hash: [intx, small_hash(intx)],
        ref: index,
        addr: val.address,
        value: Object.keys(val.value).reduce((acc, kpolicy) => {
          Object.keys(val.value[kpolicy]).map(ktoken => {
            acc[kpolicy + ":" + ktoken] = val.value[kpolicy][ktoken]
          })
          return acc
        }, {})
      }
      obj.tokenCount = Object.keys(obj.value).length - 1
      obj.value["ada"] = formatADA(obj.value["ada:lovelace"])
      return obj
    })
  }
  tx.outputs = tx.outputs.map((output, index) => {
    const outtxfile = DB + "/transactions/" + tx.id + "/outputs/" + index + "/output"
    const val = JSON.parse(fs.readFileSync(outtxfile))
    const obj = {
      addr: [output, small_addr(output)],
      ref: index,
      value: Object.keys(val.value).reduce((acc, kpolicy) => {
        Object.keys(val.value[kpolicy]).map(ktoken => {
          acc[kpolicy + ":" + ktoken] = val.value[kpolicy][ktoken]
        })
        return acc
      }, {}),
      spentBy: val.spentBy === undefined ? "unspent" : small_hash(val.spentBy)
    }
    obj.tokenCount = Object.keys(obj.value).length - 1
    obj.value["ada"] = formatADA(obj.value["ada:lovelace"])
    return obj
  })
  if (tx.fee !== undefined) {
    tx.fee = formatADA(tx.fee.lovelace)
  }
  let transactionTemplate
  if (tx.inputs === undefined) {
    transactionTemplate = fs.readFileSync(TEMPLATE + "/genesis.template").toString()
  } else {
    transactionTemplate = fs.readFileSync(TEMPLATE + "/transaction.template").toString()
  }
  let content = await engine.parseAndRender(transactionTemplate, tx)
  res.setHeader("Content-Type", "text/html")
  res.send(content)
})

app.get("/utxo/:tx/:outref", async (req, res) => {
  const txData = JSON.parse(fs.readFileSync(DB + "/transactions/" + req.params.tx + "/tx"))
  const utxoData = JSON.parse(fs.readFileSync(DB + "/transactions/" + req.params.tx + "/outputs/" + req.params.outref + "/output"))
  const utxo = {
    tx: [req.params.tx, small_hash(req.params.tx)],
    outref: req.params.outref,
    addr: [utxoData.address, small_addr(utxoData.address)],
    datum: utxoData.datum,
    value: Object.keys(utxoData.value).reduce((acc, kpolicy) => {
      Object.keys(utxoData.value[kpolicy]).map(ktoken => {
        acc[kpolicy + ":" + ktoken] = utxoData.value[kpolicy][ktoken]
      })
      return acc
    }, {}),
    producedHeight: txData.producedHeight,
    spentBy: "unspent",
    spentHeight: utxoData.spentHeight
  }
  if (utxoData.spentBy !== undefined) {
    utxo.spentBy = [utxoData.spentBy, small_hash(utxoData.spentBy)]
  }
  utxo.ada = formatADA(utxo.value["ada:lovelace"])
  delete utxo.value["ada:lovelace"]
  utxo.hasNativeTokens = Object.keys(utxo.value).length > 0
  let content = await engine.parseAndRender(fs.readFileSync(TEMPLATE + "/utxo.template").toString(), utxo)
  res.setHeader("Content-Type", "text/html")
  res.send(content)
})

app.get("/token/:unit", async (req, res) => {
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  const [pid, tn] = req.params.unit.split(":")
  const ledger = JSON.parse(fs.readFileSync(DB + "/tokens/" + pid + "/" + tn + "/ledger"))
  let content = await engine.parseAndRender(fs.readFileSync(TEMPLATE + "/token.template").toString(), { 
    height: latest.height,
    policyId: pid,
    tokenName: tn,
    ledger: ledger 
  })
  res.setHeader("Content-Type", "text/html")
  res.send(content)  
})

app.get("/address/:addr", async (req, res) => {
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  const ledger = JSON.parse(fs.readFileSync(DB + "/addresses/" + req.params.addr + "/ledger"))
  const flattenedLedger = Object.keys(ledger).reduce((acc, pid) => {
    Object.keys(ledger[pid]).reduce((acc, tn) => {
      acc[pid + ":" + tn] = ledger[pid][tn]
    }, acc)
    return acc
  }, {})
  let content = await engine.parseAndRender(fs.readFileSync(TEMPLATE + "/address.template").toString(), { 
    height: latest.height,
    address: req.params.addr,
    ledger: flattenedLedger
  })
  res.setHeader("Content-Type", "text/html")
  res.send(content)  

})

app.listen(PORT, () => {
    console.log(`Explorer started on port ${PORT}`)
})
