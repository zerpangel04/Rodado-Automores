import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "vehiculos-fotos";

function getStorageClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Faltan configurar SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  }
  // Service role key: nunca se expone al cliente, solo se usa acá server-side.
  return createClient(url, key).storage.from(BUCKET);
}

export async function uploadVehiculoFoto(
  tenantId: string,
  vehiculoId: string,
  file: File
): Promise<string> {
  const storage = getStorageClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${tenantId}/${vehiculoId}/${randomUUID()}.${ext}`;

  const { error } = await storage.upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    throw new Error(`No se pudo subir la imagen: ${error.message}`);
  }

  return storage.getPublicUrl(path).data.publicUrl;
}
