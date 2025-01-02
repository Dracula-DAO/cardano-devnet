import { redirect } from '@sveltejs/kit'

export const actions = { 
  default: async ({ request }) => {
    const data = await request.formData()
    const pattern = data.get('pattern')
	  redirect(303, '/block/' + pattern);
  }
}