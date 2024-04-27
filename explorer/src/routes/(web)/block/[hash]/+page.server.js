import { loadBlock } from "$lib/server"
import { redirect } from "@sveltejs/kit"

export function load({ params }) {
  const block = loadBlock("/blocks/" + params.hash + "/block")
  redirect(303, "/chain/" + block.height)
}
