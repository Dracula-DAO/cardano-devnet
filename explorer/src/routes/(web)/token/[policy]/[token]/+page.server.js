import { loadToken } from "$lib/server"

export function load({ params }) {
  return loadToken(params.policy, params.token)
}