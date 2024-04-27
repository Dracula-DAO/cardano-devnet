import { loadUtxo } from "$lib/server"

export function load({ params }) {
  return loadUtxo(params.hash, params.ref)
}