import { z } from "zod";

export const estadoVehiculoValues = ["DISPONIBLE", "RESERVADO", "VENDIDO"] as const;

export const vehiculoInputSchema = z.object({
  marca: z.string().trim().min(1, "La marca es obligatoria"),
  modelo: z.string().trim().min(1, "El modelo es obligatorio"),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  km: z.coerce.number().int().min(0),
  precioUsd: z.coerce.number().min(0),
  estado: z.enum(estadoVehiculoValues).default("DISPONIBLE"),
  categoria: z.string().trim().optional().nullable(),
  transmision: z.string().trim().optional().nullable(),
  motor: z.string().trim().optional().nullable(),
  docTitulo: z.coerce.boolean().default(false),
  docCedula: z.coerce.boolean().default(false),
  docDominio: z.coerce.boolean().default(false),
  docLibreDeuda: z.coerce.boolean().default(false),
  vtvVencimiento: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
});

export const vehiculoUpdateSchema = vehiculoInputSchema.partial();

export const canalLeadValues = [
  "WHATSAPP",
  "MERCADO_LIBRE",
  "INSTAGRAM",
  "WEB",
] as const;

export const etapaLeadValues = [
  "NUEVO",
  "CONTACTADO",
  "TEST_DRIVE",
  "NEGOCIACION",
  "CERRADO",
] as const;

export const leadInputSchema = z.object({
  nombreCliente: z.string().trim().min(1, "El nombre es obligatorio"),
  contacto: z.string().trim().optional().nullable(),
  canal: z.enum(canalLeadValues),
  vehiculoId: z.string().trim().optional().nullable(),
  vendedorId: z.string().trim().optional().nullable(),
});

export const publicLeadInputSchema = z.object({
  dominio: z.string().trim().min(1),
  vehiculoId: z.string().trim().min(1),
  nombreCliente: z.string().trim().min(1, "Dejanos tu nombre"),
  contacto: z.string().trim().min(1, "Dejanos un teléfono o email de contacto"),
  mensaje: z.string().trim().max(1000).optional().nullable(),
});

export const leadUpdateSchema = z.object({
  nombreCliente: z.string().trim().min(1).optional(),
  contacto: z.string().trim().optional().nullable(),
  canal: z.enum(canalLeadValues).optional(),
  etapa: z.enum(etapaLeadValues).optional(),
  vehiculoId: z.string().trim().optional().nullable(),
  vendedorId: z.string().trim().optional().nullable(),
});

export const ventaInputSchema = z.object({
  vendedorId: z.string().trim().min(1, "Elegí un vendedor"),
  precioFinal: z.coerce.number().min(0),
  comision: z.coerce.number().min(0),
});

export const rolValues = ["DUENIO", "ADMIN", "VENDEDOR"] as const;

export const usuarioInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  rol: z.enum(rolValues),
});
