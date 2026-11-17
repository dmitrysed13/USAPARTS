"use server";

import { redirect } from "next/navigation";
import { clearAdminSession } from "@/modules/admin/auth";

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
