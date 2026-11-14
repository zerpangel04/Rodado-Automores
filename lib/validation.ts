import { z } from "zod";
import { SOBRE_NOSOTROS_MAX, HORARIOS_MAX, ANIO_INICIO_MIN } from "./catalogo";
import { WHATSAPP_MAX, normalizarWhatsappAR } from "./whatsapp";
import { CONTRASTE_MINIMO, contrasteSuficiente, normalizarHex } from "./colorAcento";
import { MONEDAS, PRECIO_MAXIMO, mensajeTopePrecio } from "./moneda";

export const FOTOS_MAX_COUNT = 6;
export const FOTO_MAX_BYTES = 5 * 1024 * 1024;
export const FOTO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const LOGO_MAX_BYTES = 3 * 1024 * 1024;
export const LOGO_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// La portada llega ya recortada (JPEG del canvas), pero se acepta el mismo
// set de formatos por si se sube sin pasar por el recorte.
export const PORTADA_MAX_BYTES = 5 * 1024 * 1024;
export const PORTADA_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
// Franja horizontal 3:1 para el fondo del hero del catálogo.
export const PORTADA_ASPECT = 3;

export const estadoVehiculoValues = ["DISPONIBLE", "RESERVADO", "VENDIDO"] as const;

// Campos de un vehículo SIN valores por defecto. El alta les suma los
// defaults (vehiculoInputSchema); la edición los usa tal cual, todos
// opcionales (vehiculoUpdateSchema).
//
// Ojo: en zod 4 `.partial()` NO anula los `.default()`. Antes la edición era
// `vehiculoInputSchema.partial()`, y un PATCH parcial como `{ estado }` (la
// etiqueta Disponible/Reservado de Stock) completaba docTitulo/docCedula/
// docDominio/docLibreDeuda con false, vtvVencimiento con null y, si no venía
// estado, lo volvía a DISPONIBLE: borraba datos que el usuario no tocó.
// Ver scripts/test-validacion.mjs.
const camposVehiculo = {
  sucursalId: z.string().trim().min(1, "Elegí una sucursal"),
  marca: z.string().trim().min(1, "La marca es obligatoria").max(60),
  modelo: z.string().trim().min(1, "El modelo es obligatorio").max(80),
  anio: z.coerce.number().int().min(1950).max(new Date().getFullYear() + 1),
  km: z.coerce.number().int().min(0).max(2_000_000),
  // Tope general = el más alto (ARS); el de cada moneda se valida aparte.
  precio: z.coerce
    .number({ error: "El precio tiene que ser un número" })
    .min(0, "El precio no puede ser negativo")
    .max(PRECIO_MAXIMO.ARS, "El precio es demasiado alto. Revisá que no tenga un cero de más."),
  // Moneda del precio. En la edición, si no viene, no se toca (sin default).
  moneda: z.enum(MONEDAS, { error: "La moneda tiene que ser USD o ARS" }),
  estado: z.enum(estadoVehiculoValues),
  categoria: z.string().trim().max(40).nullable(),
  transmision: z.string().trim().max(40).nullable(),
  motor: z.string().trim().max(60).nullable(),
  docTitulo: z.coerce.boolean(),
  docCedula: z.coerce.boolean(),
  docDominio: z.coerce.boolean(),
  docLibreDeuda: z.coerce.boolean(),
  // "" o null = sin VTV.
  vtvVencimiento: z
    .string()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
  // Opcional: si no se manda, Prisma usa su default (now()) al crear. Se
  // expone editable para que una agencia que migra stock existente pueda
  // declarar la fecha real en que ese auto entró a su lote — si no, la
  // rotación de stock en Reportes queda mal calculada para todo lo que
  // carguen al principio.
  fechaIngreso: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined))
    // +1 día de margen: el input es una fecha sin hora (se parsea como
    // medianoche UTC) comparada contra el instante exacto del server —
    // sin margen, "hoy" se rechazaría como "futuro" para cualquier
    // usuario en un huso horario adelantado a UTC.
    .refine((d) => !d || d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
      message: "La fecha de ingreso no puede ser futura",
    }),
};

// Alta (formulario nuevo e importación CSV): lo que no venga toma su default.
export const vehiculoInputSchema = z.object({
  ...camposVehiculo,
  moneda: camposVehiculo.moneda.default("USD"),
  estado: camposVehiculo.estado.default("DISPONIBLE"),
  categoria: camposVehiculo.categoria.optional(),
  transmision: camposVehiculo.transmision.optional(),
  motor: camposVehiculo.motor.optional(),
  docTitulo: camposVehiculo.docTitulo.default(false),
  docCedula: camposVehiculo.docCedula.default(false),
  docDominio: camposVehiculo.docDominio.default(false),
  docLibreDeuda: camposVehiculo.docLibreDeuda.default(false),
  vtvVencimiento: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : null)),
}).superRefine((v, ctx) => {
  // El tope depende de la moneda (ver PRECIO_MAXIMO).
  if (v.precio > PRECIO_MAXIMO[v.moneda]) {
    ctx.addIssue({ code: "custom", path: ["precio"], message: mensajeTopePrecio(v.moneda) });
  }
});

// Edición (PATCH): todos opcionales y sin defaults. Un campo que no viene
// en el body queda undefined y Prisma no lo toca. El tope por moneda se
// valida en la API, con la moneda/precio ya guardados si el PATCH trae solo
// uno de los dos (precioDentroDelTope).
export const vehiculoUpdateSchema = z.object(camposVehiculo).partial();

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

export const panelChatInputSchema = z.object({
  messages: z.array(chatMensajeSchema).min(1).max(40),
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
  compradorNombre: z.string().trim().max(200).optional(),
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

export const mercadoLibreConexionUpdateSchema = z
  .object({
    syncPrecios: z.boolean(),
    syncFotos: z.boolean(),
    pausarAlVender: z.boolean(),
  })
  .partial();

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

export const solicitudIntegracionInputSchema = z.object({
  nombrePlataforma: z.string().trim().min(1, "Contanos qué plataforma necesitás").max(120),
  comentario: z.string().trim().max(500).optional().nullable(),
});

// Coincide con las "key" de la lista `proximas` en IntegracionesView —
// si se agrega una integración nueva a esa lista, hay que sumar su key
// acá también.
export const integracionTipoValues = ["wpp", "ig", "fin", "cont"] as const;

export const interesIntegracionInputSchema = z.object({
  tipoIntegracion: z.enum(integracionTipoValues),
});

// Los mensajes de tipo (`error`) cubren tanto un campo que falta como uno
// con otro tipo: sin ellos zod responde en inglés ("Invalid input: expected
// boolean, received undefined") y eso es lo que mostraba el panel.
export const catalogoGeneralSchema = z.object(
  {
    sobreNosotros: z
      .string({ error: "El texto de Sobre nosotros no es válido" })
      .trim()
      .max(SOBRE_NOSOTROS_MAX, `Máximo ${SOBRE_NOSOTROS_MAX} caracteres`)
      .nullable()
      .transform((v) => v || null),
    anioInicio: z
      .number({ error: "El año de inicio tiene que ser un número" })
      .int("El año de inicio tiene que ser un número entero")
      .min(ANIO_INICIO_MIN, `El año tiene que ser ${ANIO_INICIO_MIN} o posterior`)
      .max(new Date().getFullYear(), "El año no puede ser futuro")
      .nullable(),
    mostrarMapa: z.boolean({ error: "Indicá si se muestra el mapa" }),
    whatsapp: z
      .string({ error: "El WhatsApp no es válido" })
      .trim()
      .max(WHATSAPP_MAX, "El WhatsApp es demasiado largo")
      .nullable()
      .transform((v) => v || null)
      .refine((v) => v === null || normalizarWhatsappAR(v) !== null, {
        message:
          "El WhatsApp no parece un celular argentino. Escribilo con código de área, ej. 11 2345 6789",
      }),
    sucursales: z
      .array(
        z.object(
          {
            id: z.string({ error: "Falta el id de la sucursal" }).min(1, "Falta el id de la sucursal"),
            horarios: z
              .string({ error: "Los horarios tienen que ser texto" })
              .trim()
              .max(HORARIOS_MAX, `Máximo ${HORARIOS_MAX} caracteres`)
              .nullable()
              .transform((v) => v || null),
          },
          { error: "Los datos de la sucursal no son válidos" }
        ),
        { error: "Falta la lista de sucursales" }
      )
      .max(50, "Demasiadas sucursales"),
    // Cotización para los "≈" del catálogo y del panel. Opcional: si no
    // viene, no se toca (un cliente viejo no la pisa con un default).
    cotizacionPreferida: z
      .enum(["OFICIAL", "BLUE"], { error: "Elegí dólar oficial o dólar blue" })
      .optional(),
  },
  { error: "Faltan los datos del catálogo" }
);

export const catalogoPersonalizacionSchema = z.object(
  {
    // null = volver al ámbar original de Rodado.
    colorAcento: z
      .string({ error: "El color tiene que ser un código como #F0A13C" })
      .trim()
      .nullable()
      .transform((v) => (v ? normalizarHex(v) ?? "invalido" : null))
      .refine((v) => v !== "invalido", { message: "El color tiene que ser un código como #F0A13C" })
      .refine((v) => v === null || v === "invalido" || contrasteSuficiente(v), {
        message: `Ese color se lee poco sobre el fondo oscuro del catálogo (contraste mínimo ${CONTRASTE_MINIMO}:1). Probá con uno más claro.`,
      }),
  },
  { error: "Faltan los datos de la personalización" }
);
