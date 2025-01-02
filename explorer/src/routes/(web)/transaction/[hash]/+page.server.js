import { loadTransaction } from "$lib/server"

export function load({ params }) {
  return loadTransaction(params.hash)
}