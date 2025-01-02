import { loadBlock } from "$lib/server"
import { redirect } from "@sveltejs/kit"

export function load({ params }) {
  if (params.hash === "genesis") {
    redirect(303, "/chain/0")
  } else {
    const block = loadBlock("/blocks/" + params.hash + "/block")
    redirect(303, "/chain/" + block.height)
  }
}
