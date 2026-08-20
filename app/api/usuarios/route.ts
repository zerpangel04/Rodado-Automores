import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { usuarioInputSchema } from "@/lib/validation";

export async function GET() {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const usuarios = await prisma.usuario.findMany({
    where: { tenantId: session.user.tenantId },
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(usuarios);
}

export async function POST(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (session.user.rol !== "DUENIO") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = usuarioInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", detalles: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { nombre, email, password, rol } = parsed.data;

  const existente = await prisma.usuario.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const usuario = await prisma.usuario.create({
    data: {
      tenantId: session.user.tenantId,
      nombre,
      email,
      passwordHash,
      rol,
    },
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
  });

  return NextResponse.json(usuario, { status: 201 });
}
