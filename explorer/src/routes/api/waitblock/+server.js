import { json } from '@sveltejs/kit'
import { waitBlock } from "$lib/server"

export async function GET({ request }) {
  const latest = await waitBlock()
  return json(latest)
}