// Seed de la base de PRUEBA: tres agencias (una por plan) con sucursales,
// stock y usuarios, para mostrar cada función del catálogo sin tocar datos
// reales. Borra y vuelve a crear solo estas tres agencias.
//
// Ejecutar SIEMPRE a través del script de protección:
//   node scripts/prueba.js node prisma/seed-prueba.js
const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

// --- Protección contra producción -----------------------------------------
function idBase(url) {
  try {
    const u = new URL(url);
    return `${decodeURIComponent(u.username)}@${u.hostname}${u.pathname}`;
  } catch {
    return null;
  }
}
function urlsDeProduccion() {
  const ruta = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(ruta)) return [];
  const txt = fs.readFileSync(ruta, "utf8");
  return ["DATABASE_URL", "DIRECT_URL"]
    .map((k) => txt.match(new RegExp(`^${k}\\s*=\\s*"?([^"\\r\\n]+)`, "m"))?.[1])
    .filter(Boolean)
    .map(idBase);
}
if (process.env.ENTORNO_PRUEBA !== "1") {
  console.error("ABORTADO: correlo con `node scripts/prueba.js node prisma/seed-prueba.js`.");
  process.exit(1);
}
const prod = urlsDeProduccion();
if (prod.includes(idBase(process.env.DATABASE_URL)) || prod.includes(idBase(process.env.DIRECT_URL))) {
  console.error("ABORTADO: la base configurada es la de producción.");
  process.exit(1);
}
const TOKEN = process.env.PRUEBA_DISPOSITIVO_TOKEN;
if (!TOKEN) {
  console.error("ABORTADO: falta PRUEBA_DISPOSITIVO_TOKEN en .env.prueba.");
  process.exit(1);
}

// --- Datos -----------------------------------------------------------------
const PASSWORD = "Prueba2026";
const DOMINIO_EMAIL = "prueba.rodado.test"; // .test no existe: ningún mail sale

const docs = { docTitulo: true, docCedula: true, docDominio: true, docLibreDeuda: true };

const AGENCIAS = [
  {
    dominio: "prueba-basico",
    nombre: "Autos del Sur",
    planId: "basico",
    // Básico sin "Sobre nosotros" cargado: el bloque no debería aparecer.
    sobreNosotros: null,
    anioInicio: null,
    // Color guardado de cuando tenía un plan más alto: no se tiene que aplicar.
    colorAcento: "#22c55e",
    sucursales: [
      { nombre: "Casa central", direccion: "Av. Hipólito Yrigoyen 8450, Lomas de Zamora", telefono: "11 4244-1020", horarios: null },
    ],
    usuarios: [
      { nombre: "Laura Sosa", slug: "basico.duenio", rol: "DUENIO" },
      { nombre: "Diego Paz", slug: "basico.admin", rol: "ADMIN" },
    ],
    vehiculos: [
      { marca: "Volkswagen", modelo: "Gol Trend 1.6", anio: 2018, km: 78000, precio: 8900, categoria: "Hatchback", transmision: "Manual", motor: "1.6 nafta" },
      { marca: "Chevrolet", modelo: "Onix LT 1.4", anio: 2019, km: 61000, precio: 10500, categoria: "Hatchback", transmision: "Manual", motor: "1.4 nafta" },
      { marca: "Fiat", modelo: "Cronos Drive 1.3", anio: 2021, km: 42000, precio: 13200, categoria: "Sedán", transmision: "Manual", motor: "1.3 nafta" },
      { marca: "Renault", modelo: "Sandero Stepway", anio: 2020, km: 55000, precio: 11800, categoria: "Hatchback", transmision: "Manual", motor: "1.6 nafta", estado: "RESERVADO" },
      { marca: "Ford", modelo: "Ka SE 1.5", anio: 2017, km: 89000, precio: 7600, categoria: "Hatchback", transmision: "Manual", motor: "1.5 nafta", estado: "VENDIDO" },
    ],
  },
  {
    dominio: "prueba-profesional",
    nombre: "Rivadavia Motors",
    planId: "profesional",
    sobreNosotros:
      "Somos una agencia familiar de Caballito. Vendemos usados seleccionados, todos con informe de dominio y garantía mecánica de 3 meses, y te ayudamos con la financiación y la permuta.",
    anioInicio: 2008,
    // Escrito con 0 y 15 a propósito: el link tiene que salir 5491123456789.
    whatsapp: "011 15 2345-6789",
    sucursales: [
      { nombre: "Casa central", direccion: "Av. Rivadavia 5230, CABA", telefono: "11 2345-6789", horarios: "Lun a vie 9 a 18 · Sáb 9 a 13" },
      { nombre: "Sucursal Flores", direccion: "Av. Directorio 2810, CABA", telefono: "11 4612-3300", horarios: "Lun a sáb 10 a 19" },
    ],
    usuarios: [
      { nombre: "Martín Rivas", slug: "profesional.duenio", rol: "DUENIO" },
      { nombre: "Carla Gómez", slug: "profesional.admin", rol: "ADMIN" },
      { nombre: "Nicolás Ferreyra", slug: "profesional.vendedor", rol: "VENDEDOR" },
    ],
    vehiculos: [
      { marca: "Toyota", modelo: "Corolla XEI 2.0", anio: 2023, km: 21000, precio: 27500, categoria: "Sedán", transmision: "CVT", motor: "2.0 nafta" },
      { marca: "Toyota", modelo: "Hilux SRX 2.8 4x4", anio: 2022, km: 48000, precio: 42000, categoria: "Pickup", transmision: "Automática", motor: "2.8 diésel" },
      { marca: "Volkswagen", modelo: "Amarok V6 Highline", anio: 2021, km: 63000, precio: 39500, categoria: "Pickup", transmision: "Automática", motor: "3.0 V6 diésel" },
      { marca: "Peugeot", modelo: "208 Feline 1.6", anio: 2022, km: 30000, precio: 17800, categoria: "Hatchback", transmision: "Automática", motor: "1.6 nafta", sucursal: 1 },
      { marca: "Jeep", modelo: "Renegade Longitude", anio: 2020, km: 58000, precio: 21900, categoria: "SUV", transmision: "Automática", motor: "1.8 nafta", sucursal: 1 },
      { marca: "Honda", modelo: "HR-V EXL", anio: 2021, km: 39000, precio: 25600, categoria: "SUV", transmision: "CVT", motor: "1.8 nafta" },
      { marca: "Ford", modelo: "Ranger XLT 3.2", anio: 2019, km: 92000, precio: 29800, categoria: "Pickup", transmision: "Automática", motor: "3.2 diésel", sucursal: 1, estado: "RESERVADO" },
      { marca: "Chevrolet", modelo: "Cruze LTZ 1.4T", anio: 2020, km: 51000, precio: 19900, categoria: "Sedán", transmision: "Automática", motor: "1.4 turbo nafta", estado: "VENDIDO" },
    ],
  },
  {
    dominio: "prueba-empresa",
    nombre: "Grupo Norte Automotores",
    planId: "empresa",
    sobreNosotros:
      "Desde 1995 acompañamos a las familias de zona norte en la compra de su auto. Tres locales, más de 60 unidades en stock y un equipo de posventa propio.",
    anioInicio: 1995,
    colorAcento: "#60a5fa",
    sucursales: [
      { nombre: "San Isidro", direccion: "Av. Centenario 1450, San Isidro", telefono: "11 4747-2020", horarios: "Lun a vie 9 a 19 · Sáb 9 a 14" },
      { nombre: "Pilar", direccion: "Panamericana Km 49,5, Pilar", telefono: "230 442-8800", horarios: "Lun a sáb 9 a 19 · Dom 10 a 14" },
      // Sin dirección ni horarios: muestra el caso "Cargar dirección".
      { nombre: "Tigre (próximamente)", direccion: null, telefono: null, horarios: null },
    ],
    usuarios: [
      { nombre: "Alejandra Núñez", slug: "empresa.duenio", rol: "DUENIO" },
      { nombre: "Pablo Iturbe", slug: "empresa.admin", rol: "ADMIN" },
    ],
    vehiculos: [
      { marca: "BMW", modelo: "320i Sport Line", anio: 2022, km: 26000, precio: 46500, categoria: "Sedán", transmision: "Automática", motor: "2.0 turbo nafta" },
      { marca: "Audi", modelo: "Q3 35 TFSI", anio: 2021, km: 34000, precio: 44800, categoria: "SUV", transmision: "Automática", motor: "1.4 turbo nafta" },
      { marca: "Toyota", modelo: "SW4 SRX 2.8", anio: 2023, km: 18000, precio: 61000, categoria: "SUV", transmision: "Automática", motor: "2.8 diésel" },
      { marca: "Volkswagen", modelo: "Taos Highline", anio: 2022, km: 29000, precio: 33900, categoria: "SUV", transmision: "Automática", motor: "1.4 turbo nafta", sucursal: 1 },
      { marca: "Nissan", modelo: "Frontier PRO-4X", anio: 2022, km: 41000, precio: 38700, categoria: "Pickup", transmision: "Automática", motor: "2.3 biturbo diésel", sucursal: 1 },
      { marca: "Mercedes-Benz", modelo: "GLA 200", anio: 2020, km: 47000, precio: 41200, categoria: "SUV", transmision: "Automática", motor: "1.3 turbo nafta" },
      { marca: "Ford", modelo: "Territory Titanium", anio: 2023, km: 15000, precio: 35500, categoria: "SUV", transmision: "Automática", motor: "1.5 turbo nafta", sucursal: 1 },
      { marca: "Chevrolet", modelo: "Tracker Premier", anio: 2022, km: 33000, precio: 24900, categoria: "SUV", transmision: "Automática", motor: "1.2 turbo nafta" },
      { marca: "Renault", modelo: "Koleos Intens", anio: 2019, km: 72000, precio: 26400, categoria: "SUV", transmision: "CVT", motor: "2.5 nafta", estado: "RESERVADO" },
      { marca: "Volkswagen", modelo: "Vento GLI", anio: 2021, km: 38000, precio: 31200, categoria: "Sedán", transmision: "Automática", motor: "2.0 turbo nafta", estado: "VENDIDO" },
    ],
  },
];

// --- Ejecución -------------------------------------------------------------
const prisma = new PrismaClient();

async function borrarAgencia(dominio) {
  const t = await prisma.tenant.findUnique({ where: { dominio }, select: { id: true } });
  if (!t) return;
  const tenantId = t.id;
  const usuarios = await prisma.usuario.findMany({ where: { tenantId }, select: { id: true } });
  const usuarioIds = usuarios.map((u) => u.id);
  await prisma.$transaction([
    prisma.actividadLog.deleteMany({ where: { tenantId } }),
    prisma.venta.deleteMany({ where: { tenantId } }),
    prisma.lead.deleteMany({ where: { tenantId } }),
    prisma.vehiculo.deleteMany({ where: { tenantId } }),
    prisma.dispositivoConfiable.deleteMany({ where: { usuarioId: { in: usuarioIds } } }),
    prisma.codigoVerificacionLogin.deleteMany({ where: { usuarioId: { in: usuarioIds } } }),
    prisma.passwordResetToken.deleteMany({ where: { usuarioId: { in: usuarioIds } } }),
    prisma.usuario.deleteMany({ where: { tenantId } }),
    prisma.sucursal.deleteMany({ where: { tenantId } }),
    prisma.mercadoLibreConexion.deleteMany({ where: { tenantId } }),
    prisma.solicitudIntegracion.deleteMany({ where: { tenantId } }),
    prisma.interesIntegracion.deleteMany({ where: { tenantId } }),
    prisma.tenant.delete({ where: { id: tenantId } }),
  ]);
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const tokenHash = createHash("sha256").update(TOKEN).digest("hex");
  const cuentas = [];

  for (const a of AGENCIAS) {
    await borrarAgencia(a.dominio);

    const tenant = await prisma.tenant.create({
      data: {
        nombre: a.nombre,
        dominio: a.dominio,
        planId: a.planId,
        sobreNosotros: a.sobreNosotros,
        anioInicio: a.anioInicio,
        whatsapp: a.whatsapp ?? null,
        colorAcento: a.colorAcento ?? null,
        onboardingOmitido: true,
      },
    });

    const sucursales = [];
    for (const s of a.sucursales) {
      sucursales.push(await prisma.sucursal.create({ data: { ...s, tenantId: tenant.id } }));
    }

    const hoy = Date.now();
    await prisma.vehiculo.createMany({
      data: a.vehiculos.map(({ sucursal = 0, estado = "DISPONIBLE", ...v }, i) => ({
        ...v,
        ...docs,
        estado,
        tenantId: tenant.id,
        sucursalId: sucursales[sucursal].id,
        fechaIngreso: new Date(hoy - i * 3 * 24 * 60 * 60 * 1000),
      })),
    });

    for (const u of a.usuarios) {
      const email = `${u.slug}@${DOMINIO_EMAIL}`;
      const usuario = await prisma.usuario.create({
        data: { nombre: u.nombre, email, passwordHash, rol: u.rol, tenantId: tenant.id },
      });
      await prisma.dispositivoConfiable.create({ data: { usuarioId: usuario.id, tokenHash } });
      cuentas.push({ agencia: a.nombre, plan: a.planId, rol: u.rol, email });
    }

    console.log(`✓ ${a.nombre} (${a.planId}) → /c/${a.dominio}`);
  }

  console.log(`\nCuentas (contraseña para todas: ${PASSWORD}):`);
  console.table(cuentas);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
