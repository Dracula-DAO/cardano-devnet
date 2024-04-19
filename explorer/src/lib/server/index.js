import fs from 'fs'

const DB=process.env.DEVNET_ROOT + "/runtime/index"

function small_hash(hash) {
  return hash.slice(0, 6) + ".." + hash.slice(-6)
}

function small_addr(addr) {
  return addr.slice(0, 15) + ".." + addr.slice(-6)
}

function addr_alias(addr) {
  const aliasFile = DB + "/addresses/" + addr + "/alias"
  let alias
  try {
    alias = fs.readFileSync(aliasFile).toString().trim()
  } catch (notFound) {
  }
  return alias
}

function formatADA(lovelace) {
  let ada = ("" + lovelace).slice(0,-6)
  if (ada === "") ada = "0"
  return ada + "." + ("000000" + lovelace).slice(-6)
}

export function loadBlock(path) {
  const block = JSON.parse(fs.readFileSync(DB + path))
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  const txs = block.transactions.map(t => {
    const tobj = JSON.parse(fs.readFileSync(DB + "/transactions/" + t + "/tx"))
    return {
      hash: [t, small_hash(t)],
      inputCount: tobj.inputs.length,
      outputCount: tobj.outputs.length
    }
  })
  return {
    hash: [block.id, small_hash(block.id)],
    height: block.height,
    slot: block.slot,
    latest: latest.height,
    txs: txs
  }
}

export function loadLatest() {
  const latest = JSON.parse(fs.readFileSync(DB + "/latest"))
  const tokens = JSON.parse(fs.readFileSync(DB + "/tokens/ledger"))
  latest.tokens = Object.keys(tokens).reduce((acc, kpolicy) => {
    Object.keys(tokens[kpolicy]).map(ktoken => {
      let logo
      let amount
      if (kpolicy === "ada" && ktoken == "lovelace") {
        logo = "cardano-ada-logo.svg"
        amount = formatADA(tokens[kpolicy][ktoken])
      } else {
        logo = "svg/bolt.svg"
        amount = tokens[kpolicy][ktoken]
      }
      acc[small_hash(kpolicy) + ":" + ktoken] = {
        logo: logo,
        amount: amount,
        policy: kpolicy,
        token: ktoken
      }
    })
    return acc
  }, {})
  return latest
}

export function loadTransaction(hash) {
  const tx = JSON.parse(fs.readFileSync(DB + "/transactions/" + hash + "/tx"))
  try {
    tx.hash = [tx.id, small_hash(tx.id)]
    const block = JSON.parse(fs.readFileSync(DB + "/transactions/" + hash + "/block"))
    tx.block = [block.id, small_hash(block.id)]
    tx.blockHeight = block.height
  } catch (noSuchFile) {
    tx.block = ["genesis", "genesis"]
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
        addr: [val.address, small_addr(val.address)],
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
      spentBy: val.spentBy === undefined ? "unspent" : [val.spentBy, small_hash(val.spentBy)]
    }
    obj.tokenCount = Object.keys(obj.value).length - 1
    obj.value["ada"] = formatADA(obj.value["ada:lovelace"])
    return obj
  })
  if (tx.fee !== undefined) {
    tx.fee = formatADA(tx.fee.lovelace)
  }
  return tx
}

export function loadUtxo(hash, ref) {
  const txData = JSON.parse(fs.readFileSync(DB + "/transactions/" + hash + "/tx"))
  const utxoData = JSON.parse(fs.readFileSync(DB + "/transactions/" + hash + "/outputs/" + ref + "/output"))
  const utxo = {
    hash: [hash, small_hash(hash)],
    ref: ref,
    addr: [utxoData.address, small_addr(utxoData.address)],
    datum: utxoData.datum,
    redeemer: utxoData.redeemer,
    value: Object.keys(utxoData.value).reduce((acc, kpolicy) => {
      Object.keys(utxoData.value[kpolicy]).map(ktoken => {
        let logo
        if (kpolicy === "ada" && ktoken == "lovelace") {
          logo = "cardano-ada-logo.svg"
        } else {
          logo = "svg/bolt.svg"
        }
        acc[kpolicy + ":" + ktoken] = {
          policy: [kpolicy, small_hash(kpolicy)],
          token: ktoken,
          logo: logo,
          amount: utxoData.value[kpolicy][ktoken]
        }
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
  utxo.ada = formatADA(utxo.value["ada:lovelace"].amount)
  delete utxo.value["ada:lovelace"]
  utxo.hasNativeTokens = Object.keys(utxo.value).length > 0
  return utxo
}

export function loadAddress(addr) {
  const alias = addr_alias(addr)
  const ledgerValues = JSON.parse(fs.readFileSync(DB + "/addresses/" + addr + "/ledger"))
  const ledger = Object.keys(ledgerValues).reduce((acc, kpolicy) => {
    Object.keys(ledgerValues[kpolicy]).map(ktoken => {
      let logo
      if (kpolicy === "ada" && ktoken == "lovelace") {
        logo = "cardano-ada-logo.svg"
      } else {
        logo = "svg/bolt.svg"
      }
      acc[kpolicy + ":" + ktoken] = {
        policy: [kpolicy, small_hash(kpolicy)],
        token: ktoken,
        logo: logo,
        amount: ledgerValues[kpolicy][ktoken]
      }
    })
    return acc
  }, {})
  const history = JSON.parse(fs.readFileSync(DB + "/addresses/" + addr + "/history"))
  const obj = {
    address: [addr, small_addr(addr)],
    alias: alias,
    ledger: ledger,
    history: history.map(h => {
      return {
        block: h.block,
        id: [h.id, small_hash(h.id)]
      }
    })
  }
  obj.ada = formatADA(obj.ledger["ada:lovelace"].amount)
  delete obj.ledger["ada:lovelace"]
  obj.hasNativeTokens = Object.keys(obj.ledger).length > 0
  return obj
}

export function loadToken(policy, token) {
  const tokData = JSON.parse(fs.readFileSync(DB + "/tokens/" + policy + "/" + token + "/ledger"))
  let count = 0
  const pagedData = Object.keys(tokData).reduce((acc, addr) => {
    if (count < 10) {
      const alias = addr_alias(addr)
      acc.push({
        address: [addr, small_addr(addr)],
        amount: tokData[addr],
        alias: alias
      })
      count++
    }
    return acc
  }, [])
  return {
    policy: policy,
    token: token,
    ledger: pagedData
  }
}

const testPath = async path => {
  return new Promise(res => {
    try {
      fs.statSync(path)
      res(true)
    } catch (fileNotFoundErr) {
      res(false)
    }
  })
}

export async function search(pattern) {
  if (pattern.includes("#")) {
    const utxoSplit = pattern.split("#")
    if (utxoSplit.length === 2 && await testPath(DB + "/transactions/" + utxoSplit[0] + "/outputs/" + utxoSplit[1])) {
      console.log("found utxo")
      return "/utxo/" + utxoSplit.join("/")
    }
  } else {
    if (await testPath(DB + "/blocks/" + pattern)) {
      console.log("found block")
      return "/block/" + pattern
    }
    if (await testPath(DB + "/transactions/" + pattern)) {
      console.log("found transaction")
      return "/transaction/" + pattern
    }
    if (await testPath(DB + "/addresses/" + pattern)) {
      console.log("found address")
      return "/address/" + pattern
    }
  }
  throw new Error("Not found: " + pattern)
}
