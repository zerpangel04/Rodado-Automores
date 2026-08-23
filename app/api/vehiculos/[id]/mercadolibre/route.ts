import { NextRequest, NextResponse } from "next/server";
import { currentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { findOwnedVehiculo } from "@/lib/vehiculos";
import {
  getValidAccessToken,
  createMercadoLibreListing,
  getMercadoLibreAddress,
  VEHICLE_CATEGORY_ID,
} from "@/lib/mercadolibre";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await currentSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { id } = params;
  const vehiculo = await findOwnedVehiculo(id, session.user.tenantId);
  if (!vehiculo) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const accessToken = await getValidAccessToken(session.user.tenantId);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Conectá tu cuenta de Mercado Libre en Integraciones antes de publicar" },
      { status: 400 }
    );
  }

  const title = `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio}`.slice(0, 60);

  const attributes: { id: string; value_name: string }[] = [
    { id: "BRAND", value_name: vehiculo.marca },
    { id: "MODEL", value_name: vehiculo.modelo },
    { id: "VEHICLE_YEAR", value_name: String(vehiculo.anio) },
    { id: "KILOMETERS", value_name: `${vehiculo.km} km` },
    // TRIM/FUEL_TYPE/DOORS son obligatorios para esta categoría pero
    // Rodado no los guarda hoy — van con un valor por defecto razonable
    // hasta que sumemos esos campos al alta de vehículo.
    { id: "TRIM", value_name: vehiculo.modelo },
    { id: "FUEL_TYPE", value_name: "Nafta" },
    { id: "DOORS", value_name: "4" },
  ];
  if (vehiculo.transmision) {
    attributes.push({ id: "TRANSMISSION", value_name: vehiculo.transmision });
  }

  // Los clasificados de vehículos exigen ubicación; no tenemos dirección
  // de agencia en Rodado, así que reusamos la que el vendedor ya cargó
  // en su cuenta de Mercado Libre.
  const address = await getMercadoLibreAddress(accessToken);
  const location = address
    ? {
        address_line: address.address,
        zip_code: address.zip_code,
        country: { name: "Argentina" },
        state: { name: address.state },
        city: { name: address.city },
      }
    : undefined;

  const payload = {
    title,
    description: `${vehiculo.marca} ${vehiculo.modelo} ${vehiculo.anio} — ${vehiculo.km.toLocaleString("es-AR")} km. Publicado desde Rodado.`,
    category_id: VEHICLE_CATEGORY_ID,
    price: Number(vehiculo.precioUsd),
    currency_id: "USD",
    available_quantity: 1,
    // Obligatorio para vehículos, ver nota en lib/mercadolibre.ts
    buying_mode: "classified",
    condition: vehiculo.km === 0 ? "new" : "used",
    listing_type_id: "silver",
    channels: ["marketplace"],
    pictures: vehiculo.fotos.map((url) => ({ source: url })),
    attributes,
    ...(location ? { location } : {}),
  };

  const result = await createMercadoLibreListing(accessToken, payload);

  if (!result.ok) {
    const updated = await prisma.vehiculo.update({
      where: { id },
      data: { mlLastError: result.error },
    });
    return NextResponse.json(
      { error: result.error, vehiculo: updated },
      { status: 502 }
    );
  }

  const updated = await prisma.vehiculo.update({
    where: { id },
    data: { mlItemId: result.itemId, mlPermalink: result.permalink, mlLastError: null },
  });

  return NextResponse.json(updated);
}
