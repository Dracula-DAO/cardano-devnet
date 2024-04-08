import { loadLatest } from "$lib/server"

export function load() {
  const latest = loadLatest()
  console.log(JSON.stringify(latest, null, 2))
  return latest
}