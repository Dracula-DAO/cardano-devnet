import { loadBlock } from "$lib/server"

export function load({ params }) {
  return loadBlock("/chain/" + params.height + "/block")
}