import { DevnetProviderFrontend } from '../lucid-frontend.mjs'

const main = async () => {
  const provider = new DevnetProviderFrontend("ws://localhost:1338")
  await provider.init()

  console.log("waiting for next block...")
  await provider.waitBlock()
  process.exit()
}

main()
