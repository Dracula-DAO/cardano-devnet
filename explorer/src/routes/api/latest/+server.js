import { json } from '@sveltejs/kit'
import { loadLatest } from "$lib/server"

export async function GET({ request }) {
  const latest = loadLatest()
  return json(latest)
}
