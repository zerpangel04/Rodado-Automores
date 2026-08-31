import { z } from "zod";

export const FOTOS_MAX_COUNT = 6;
export const FOTO_MAX_BYTES = 5 * 1024 * 1024;
export const FOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const estadoVehiculoValues = ["DISPONIBLE", "RESERVADO", "VENDIDO"] as const;

export const vehiculoInputSchema = z.object({
  sucursalId: z.string().trim().min(1, "Elegí una sucursal"),
  marca: z.string().trim().min(1, "La marca es obligatoria").max(60),
  modelo: z.string().trim().min(1, "El modelo es obligatorio").max(80),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  km: z.coerce.number().int().min(0).max(2_000_000),
  precioUsd: z.coerce.number().min(0).max(100_000_000),
  estado: z.enum(estadoVehiculoValues).default("DISPONIBLE"),
  categoria: z.string().trim().max(40).optional().nullable(),
  transmision: z.string().trim().max(40).optional().nullable(),
  motor: z.string().trim().max(60).optional().nullable(),
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
  "WEB_IA",
] as const;

export const etapaLeadValues = [
  "NUEVO",
  "CONTACTADO",
  "TEST_DRIVE",
  "NEGOCIACION",
  "CERRADO",
] as const;

export const leadInputSchema = z.object({
  nombreCliente: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  contacto: z.string().trim().max(120).optional().nullable(),
  canal: z.enum(canalLeadValues),
  vehiculoId: z.string().trim().optional().nullable(),
  vendedorId: z.string().trim().optional().nullable(),
});

export const publicLeadInputSchema = z.object({
  dominio: z.string().trim().min(1).max(100),
  vehiculoId: z.string().trim().min(1),
  nombreCliente: z.string().trim().min(1, "Dejanos tu nombre").max(120),
  contacto: z.string().trim().min(1, "Dejanos un teléfono o email de contacto").max(120),
  mensaje: z.string().trim().max(1000).optional().nullable(),
  // Honeypot: campo oculto por CSS que un visitante real nunca completa.
  // Si viene con contenido, es un bot rellenando todos los inputs del
  // formulario — se descarta en silencio en vez de avisarle que lo
  // detectamos (ver app/api/public/leads/route.ts).
  sitioWeb: z.string().trim().max(200).optional(),
});

export const chatMensajeSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(4000),
});

export const chatInputSchema = z.object({
  messages: z.array(chatMensajeSchema).min(1).max(40),
  vehiculoId: z.string().trim().optional().nullable(),
});

export const leadUpdateSchema = z.object({
  nombreCliente: z.string().trim().min(1).max(120).optional(),
  contacto: z.string().trim().max(120).optional().nullable(),
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

export const forgotPasswordInputSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido").max(200),
});

export const resetPasswordInputSchema = z
  .object({
    token: z.string().trim().min(1).max(200),
    password: z.string().min(8, "Mínimo 8 caracteres").max(200),
    confirmPassword: z.string().min(8, "Mínimo 8 caracteres").max(200),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const sucursalInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  direccion: z.string().trim().max(200).optional().nullable(),
  telefono: z.string().trim().max(40).optional().nullable(),
});

export const sucursalUpdateSchema = sucursalInputSchema.partial();

export const rolValues = ["DUENIO", "ADMIN", "VENDEDOR"] as const;

export const usuarioInputSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(100),
  email: z.string().trim().toLowerCase().email("Email inválido").max(200),
  password: z.string().min(8, "Mínimo 8 caracteres").max(200),
  rol: z.enum(rolValues),
});

export const usuarioRolUpdateSchema = z.object({
  rol: z.enum(rolValues),
});
