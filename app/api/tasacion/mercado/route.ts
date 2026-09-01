import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { buscarPrecioReferenciaMercado } from "@/lib/argAutos";

export async function GET(req: NextRequest) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const marca = searchParams.get("marca")?.trim() ?? "";
  const modelo = searchParams.get("modelo")?.trim() ?? "";
  const anio = Number(searchParams.get("anio"));

  if (!marca || !modelo || !anio) {
    return NextResponse.json({ referencia: null });
  }

  try {
    const referencia = await buscarPrecioReferenciaMercado({ marca, modelo, anio });
    return NextResponse.json({ referencia });
  } catch {
    // buscarPrecioReferenciaMercado ya maneja sus propios errores; este
    // catch es solo para no romper la sugerencia de precio ante algo
    // inesperado — el cliente cae a la estimación simulada igual.
    return NextResponse.json({ referencia: null });
  }
}
