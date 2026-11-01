"use server";

import { redirect } from "next/navigation";
import { getUser, sql } from "@/server/db";
import { revokeGrant } from "@/server/github";
import { endSession, sessionUserId, unseal } from "@/server/session";

export async function signOut() {
  await endSession();
  redirect("/");
}

/** Revokes GitHub access and deletes the user and their device registrations. Installed passes stop updating. */
export async function deleteAccount() {
  const id = await sessionUserId();
  if (id) {
    const user = await getUser(id);
    if (user?.token_enc) await revokeGrant(unseal(user.token_enc));
    await sql`delete from users where id = ${id}`;
  }
  await endSession();
  redirect("/?deleted=1");
}
