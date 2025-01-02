import { redirect } from '@sveltejs/kit'
import { search } from "$lib/server"

export const actions = { 
  default: async ({ request }) => {
    const data = await request.formData()
    const pattern = data.get('pattern')
    let url
    try {
      url = await search(pattern)
    } catch (err) {
      url = "/notfound?" + pattern
    }
    redirect(303, url)
  }
}
