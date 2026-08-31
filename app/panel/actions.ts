"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { signOut } from "@/lib/auth";
import { SUCURSAL_COOKIE } from "@/lib/sucursalFiltro";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function setSucursalAction(sucursalId: string) {
  const store = cookies();
  if (sucursalId) {
    store.set(SUCURSAL_COOKIE, sucursalId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  } else {
    store.delete(SUCURSAL_COOKIE);
  }
  revalidatePath("/panel", "layout");
}
