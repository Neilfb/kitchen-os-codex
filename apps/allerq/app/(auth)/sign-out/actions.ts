"use server";

import { clearSessionCookie } from "@/lib/session/cookieSession";
import { redirect } from "next/navigation";

export async function signOut() {
  await clearSessionCookie();
  redirect("/sign-in");
}
