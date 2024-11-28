import { redirect } from '@sveltejs/kit'
import { renameAlias } from "$lib/server"

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData()
    const from = data.get('from')
    const to = data.get('to')
    const address = data.get('address')
    renameAlias(address, from, to)
    redirect(303, "/address/" + address)
  }
}