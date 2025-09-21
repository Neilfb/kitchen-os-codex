"use server";

import { deleteUserSession } from "@/lib/session/userSession";
import { redirect } from "next/navigation";

export async function signOut() {
  await deleteUserSession();
  redirect("/sign-in");
}
