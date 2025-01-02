import { loadLatest } from "$lib/server"

export function load() {
  const latest = loadLatest()
  return latest
}