import fs from 'fs'
import { OgmiosConnection, OgmiosStateMachine } from './components/Ogmios.mjs'

const DB_ROOT=process.env.DEVNET_ROOT + "/db"
const OGMIOS_PORT = 1337

// Genesis constants - faucet initial utxo to seed all other tx's
const ADDR_FAUCET = "addr_test1vztc80na8320zymhjekl40yjsnxkcvhu58x59mc2fuwvgkc332vxv"
const GENESIS_FAUCET_HASH = "8c78893911a35d7c52104c98e8497a14d7295b4d9bf7811fc1d4e9f449884284"
const GENESIS_FAUCET_LOVELACE = 900000000000

class DBTransformer {

  transformBlock(ogmiosBlock) {
    return {
      id: ogmiosBlock.id,
      height: ogmiosBlock.height,
      slot: ogmiosBlock.slot,
      ancestor: ogmiosBlock.ancestor,
      transactions: ogmiosBlock.transactions.map(tx => {
        return tx.id
      })
    }
  }

  transformTransaction(ogmiosTransaction) {
    console.log(JSON.stringify(ogmiosTransaction, null, 2))
    return {
      id: ogmiosTransaction.id,
      spends: ogmiosTransaction.spends,
      fee: ogmiosTransaction.fee,
      validityInterval: ogmiosTransaction.validityInterval,
      signatories: ogmiosTransaction.signatories,
      inputs: ogmiosTransaction.inputs.map(i => {
        return i.transaction.id + "#" + i.index
      }),
      outputs: ogmiosTransaction.outputs.map(o => {
        return o.address
      })
    }
  }

}

class DBWriter {

  constructor(db, transformer) {
    this.db = db
    this.transformer = transformer
    try {
      fs.rmSync(this.db, {
        recursive: true
      })
      fs.mkdirSync(this.db)
      fs.mkdirSync(this.db + "/blocks")
      fs.mkdirSync(this.db + "/chain")
      fs.mkdirSync(this.db + "/transactions")
      fs.mkdirSync(this.db + "/addresses")
    } catch (alreadyExists) {}

    // Populate initial faucet utxo (genesis), hardcoded because the hash will
    // never change
    const genesis_tx_path = this.db + "/transactions/" + GENESIS_FAUCET_HASH
    fs.mkdirSync(genesis_tx_path + "/outputs/0", { recursive: true })
    fs.writeFileSync(genesis_tx_path + "/tx", JSON.stringify({
      id: GENESIS_FAUCET_HASH,
      outputs: [
        ADDR_FAUCET
      ]
    }, null, 2))
    fs.writeFileSync(genesis_tx_path + "/outputs/0/output", JSON.stringify({
      address: ADDR_FAUCET,
      value: {
        ada: {
          lovelace: GENESIS_FAUCET_LOVELACE
        }
      }
    }, null, 2))
    const genesis_address_path = this.db + "/addresses/" + ADDR_FAUCET
    fs.mkdirSync(genesis_address_path)
    fs.symlinkSync(genesis_tx_path + "/outputs/0", genesis_address_path + "/" + GENESIS_FAUCET_HASH + "#0")
  }

  writeBlock(block) {
    const dbBlock = this.transformer.transformBlock(block)
    console.log(`Latest block: height[${dbBlock.height}] id[${dbBlock.id}]`)
    const formattedBlock = JSON.stringify(dbBlock, null, 2)
    fs.mkdirSync(this.db + "/blocks/" + dbBlock.id)
    if (block.transactions.length > 0) {
      fs.mkdirSync(this.db + "/blocks/" + dbBlock.id + "/transactions")
    }
    fs.writeFileSync(this.db + "/blocks/" + dbBlock.id + "/block", formattedBlock)
    fs.symlinkSync(this.db + "/blocks/" + dbBlock.id, this.db + "/chain/" + dbBlock.height)
    block.transactions.forEach((tx, index) => {
      this.writeTransaction(block, tx)
      fs.symlinkSync(this.db + "/transactions/" + tx.id, this.db + "/blocks/" + block.id + "/transactions/" + index)
    })
    // Write over file, do not remove, to allow file watching
    fs.writeFileSync(this.db + "/latest", formattedBlock)
  }

  writeTransaction(block, tx) {
    const dbTx = this.transformer.transformTransaction(tx)
    const formattedTransaction = JSON.stringify(dbTx, null, 2)
    fs.mkdirSync(this.db + "/transactions/" + tx.id)
    fs.mkdirSync(this.db + "/transactions/" + tx.id + "/inputs")
    fs.mkdirSync(this.db + "/transactions/" + tx.id + "/outputs")
    fs.writeFileSync(this.db + "/transactions/" + tx.id + "/tx", formattedTransaction)
    fs.symlinkSync(this.db + "/blocks/" + block.id + "/block", this.db + "/transactions/" + tx.id + "/block")
    tx.inputs.forEach((input, index) => {
      fs.mkdirSync(this.db + "/transactions/" + tx.id + "/inputs/" + index)
      fs.symlinkSync(this.db + "/transactions/" + input.transaction.id + "/outputs/" + input.index + "/output", this.db + "/transactions/" + tx.id + "/inputs/" + index + "/input")
      fs.symlinkSync(this.db + "/transactions/" + tx.id, this.db + "/transactions/" + input.transaction.id + "/outputs/" + input.index + "/spentBy")
      const inputUtxoFile = this.db + "/transactions/" + input.transaction.id + "/outputs/" + input.index + "/output"
      const inputUtxo = JSON.parse(fs.readFileSync(inputUtxoFile))
      fs.unlinkSync(this.db + "/addresses/" + inputUtxo.address + "/" + input.transaction.id + "#" + input.index)
      inputUtxo.spentBy = tx.id
      fs.writeFileSync(inputUtxoFile, JSON.stringify(inputUtxo, null, 2))
    })
    tx.outputs.forEach((output, index) => {
      fs.mkdirSync(this.db + "/transactions/" + tx.id + "/outputs/" + index)
      fs.writeFileSync(this.db + "/transactions/" + tx.id + "/outputs/" + index + "/output", JSON.stringify(output, null, 2))
      try {
        fs.mkdirSync(this.db + "/addresses/" + output.address)
      } catch (alreadyExists) {}
      fs.symlinkSync(this.db + "/transactions/" + tx.id + "/outputs/" + index + "/output", 
        this.db + "/addresses/" + output.address + "/" + tx.id + "#" + index)
    })
  }

}

const writer = new DBWriter(DB_ROOT, new DBTransformer())
const osm = new OgmiosStateMachine(writer)
new OgmiosConnection(OGMIOS_PORT, osm)

osm.addCallback(writer.writeBlock.bind(writer))

