import { deleteAlias } from "$lib/server"
import { redirect } from "@sveltejs/kit"

export function load({ params }) {
  deleteAlias(params.addr)
  redirect(303, "/address/" + params.addr)
}