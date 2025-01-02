import express from 'express'
import { Liquid } from 'liquidjs'
import fs from 'fs'
const app = express()
const engine = new Liquid()

const PORT=3000
const DB=process.env.DEVNET_ROOT + "/db"
const TEMPLATE=process.env.DEVNET_ROOT + "/explorer"

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

app.get("/chain/:height", async (req, res) => {
  const blockTemplate = fs.readFileSync(TEMPLATE + "/block.template").toString()
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  const height = req.params.height
  const block = JSON.parse(fs.readFileSync(DB + "/chain/" + height + "/block"))
  block.maxHeight = latest.height
  block.showExtendLeft = block.height > 1
  block.showExtendRight = block.height < latest.height - 1
  const content = await engine.parseAndRender(blockTemplate, block)
  res.setHeader("Content-Type", "text/html")
  res.send(content)
})

app.get("/transaction/:id", async (req, res) => {
  const txpath = DB + "/transactions/" + req.params.id + "/tx"
  const tx = JSON.parse(fs.readFileSync(DB + "/transactions/" + req.params.id + "/tx"))
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

app.listen(PORT, () => {
    console.log(`Explorer started on port ${PORT}`)
})
