import { redirect } from '@sveltejs/kit'
import { addAlias } from "$lib/server"

export const actions = {
  default: async ({ request }) => {
    const data = await request.formData()
    const alias = data.get('alias')
    const address = data.get('address')
    addAlias(address, alias)
    redirect(303, "/address/" + address)
  }
}