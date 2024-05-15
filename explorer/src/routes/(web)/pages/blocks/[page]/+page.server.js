import { loadPage } from "$lib/server"

export function load({ params }) {
  return loadPage("blocks", params.page)
}
