import { loadBlocksPage } from "$lib/server"

export function load({ params }) {
  return loadBlocksPage(params.page)
}
