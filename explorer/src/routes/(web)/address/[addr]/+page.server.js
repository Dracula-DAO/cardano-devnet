import { loadAddress } from "$lib/server"

export function load({ params }) {
  return loadAddress(params.addr)
}