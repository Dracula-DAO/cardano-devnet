import { loadTransactionsPage } from "$lib/server"

export function load({ params }) {
  return loadTransactionsPage(params.page)
}
