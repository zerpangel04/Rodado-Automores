// Fixup puntual para la demo: renombra el usuario de prueba, engancha los
// leads existentes a vehículos reales del stock actual, y suma leads nuevos
// repartidos en distintas etapas del kanban. No borra nada.
// Ejecutar: node prisma/seed-leads.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DOMINIO = "agencia-demo";

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { dominio: DOMINIO } });
  if (!tenant) throw new Error(`No existe un tenant con dominio "${DOMINIO}"`);

  const vendedorTest = await prisma.usuario.findFirst({
    where: { tenantId: tenant.id, email: "vendedor.test@rodado.dev" },
  });
  if (!vendedorTest) throw new Error('No se encontró el usuario "vendedor.test@rodado.dev"');

  const renombrado = await prisma.usuario.update({
    where: { id: vendedorTest.id },
    data: { nombre: "Martín López" },
  });
  console.log(`✓ Usuario renombrado: "${vendedorTest.nombre}" → "${renombrado.nombre}" (login sin cambios: ${renombrado.email})`);

  const vehiculo = (marca, modelo) =>
    prisma.vehiculo.findFirst({ where: { tenantId: tenant.id, marca, modelo } });

  const duster = await vehiculo("Renault", "Duster Iconic");
  const tracker = await vehiculo("Chevrolet", "Tracker Premier");
  const ranger = await vehiculo("Ford", "Ranger XLT");
  const cronos = await vehiculo("Fiat", "Cronos Precision");
  const hilux = await vehiculo("Toyota", "Hilux SRX");

  const mariaLopez = await prisma.lead.findFirst({
    where: { tenantId: tenant.id, nombreCliente: "Maria Lopez" },
  });
  if (mariaLopez && !mariaLopez.vehiculoId && duster) {
    await prisma.lead.update({
      where: { id: mariaLopez.id },
      data: { vehiculoId: duster.id },
    });
    console.log(`✓ Lead "Maria Lopez" enganchado a Renault Duster Iconic (vendido)`);
  }

  const carlosGomez = await prisma.lead.findFirst({
    where: { tenantId: tenant.id, nombreCliente: "Carlos Gomez" },
  });
  if (carlosGomez && !carlosGomez.vehiculoId && tracker) {
    await prisma.lead.update({
      where: { id: carlosGomez.id },
      data: { vehiculoId: tracker.id },
    });
    console.log(`✓ Lead "Carlos Gomez" enganchado a Chevrolet Tracker Premier`);
  }

  const nuevosLeads = [
    {
      nombreCliente: "Sofía Ramirez",
      contacto: "11-6789-2345",
      canal: "MERCADO_LIBRE",
      etapa: "CONTACTADO",
      vehiculoId: ranger?.id ?? null,
      vendedorId: null,
    },
    {
      nombreCliente: "Diego Martinez",
      contacto: "11-3321-9087",
      canal: "INSTAGRAM",
      etapa: "TEST_DRIVE",
      vehiculoId: cronos?.id ?? null,
      vendedorId: renombrado.id,
    },
    {
      nombreCliente: "Valentina Torres",
      contacto: "11-5544-1122",
      canal: "WHATSAPP",
      etapa: "NEGOCIACION",
      vehiculoId: hilux?.id ?? null,
      vendedorId: renombrado.id,
    },
  ];

  for (const l of nuevosLeads) {
    await prisma.lead.create({ data: { ...l, tenantId: tenant.id } });
    console.log(`✓ Lead nuevo: ${l.nombreCliente} (${l.canal} · ${l.etapa})`);
  }

  const totalLeads = await prisma.lead.count({ where: { tenantId: tenant.id } });
  console.log(`\nListo: ${totalLeads} leads en total para "${tenant.nombre}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
