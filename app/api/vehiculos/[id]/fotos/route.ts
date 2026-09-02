import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { findOwnedVehiculo } from "@/lib/vehiculos";
import { uploadVehiculoFoto } from "@/lib/supabase";
import { FOTOS_MAX_COUNT, FOTO_MAX_BYTES, FOTO_ALLOWED_TYPES } from "@/lib/validation";

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = params;
  const existente = await findOwnedVehiculo(id, session.user.tenantId);
  if (!existente) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  // "keep" son las fotos ya existentes que el usuario no sacó del modal —
  // filtramos contra lo que ya está en la DB para no permitir inyectar URLs.
  let keep: string[] = [];
  try {
    const raw = formData.get("keep");
    const parsedKeep: unknown = raw ? JSON.parse(String(raw)) : [];
    if (Array.isArray(parsedKeep)) {
      keep = parsedKeep.filter(
        (u): u is string => typeof u === "string" && existente.fotos.includes(u)
      );
    }
  } catch {
    keep = [];
  }

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (keep.length + files.length > FOTOS_MAX_COUNT) {
    return NextResponse.json(
      { error: `Máximo ${FOTOS_MAX_COUNT} fotos por vehículo` },
      { status: 400 }
    );
  }

  for (const file of files) {
    if (!FOTO_ALLOWED_TYPES.includes(file.type as (typeof FOTO_ALLOWED_TYPES)[number])) {
      return NextResponse.json(
        { error: `${file.name}: formato no permitido, usá JPG, PNG o WEBP` },
        { status: 400 }
      );
    }
    if (file.size > FOTO_MAX_BYTES) {
      return NextResponse.json(
        { error: `${file.name}: pesa más de 5MB` },
        { status: 400 }
      );
    }
  }

  let nuevasUrls: string[];
  try {
    nuevasUrls = await Promise.all(
      files.map((file) => uploadVehiculoFoto(session.user.tenantId, id, file))
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudieron subir las fotos" },
      { status: 500 }
    );
  }

  const vehiculo = await prisma.vehiculo.update({
    where: { id },
    data: { fotos: [...keep, ...nuevasUrls] },
  });

  return NextResponse.json(vehiculo);
}
