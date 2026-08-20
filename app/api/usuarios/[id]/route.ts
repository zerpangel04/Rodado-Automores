import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = params;
  if (id === session.user.id) {
    return NextResponse.json(
      { error: "No podés eliminar tu propio usuario" },
      { status: 400 }
    );
  }

  const usuario = await prisma.usuario.findUnique({ where: { id } });
  if (!usuario || usuario.tenantId !== session.user.tenantId) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  try {
    await prisma.usuario.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene leads o ventas asociadas" },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}
