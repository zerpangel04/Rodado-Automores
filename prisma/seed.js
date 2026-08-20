// Seed puntual: carga stock realista en la agencia "agencia-demo" para una
// demo comercial. No borra nada existente, solo agrega vehículos nuevos.
// Ejecutar: npx prisma db seed
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DOMINIO = "agencia-demo";

const docsCompletos = {
  docTitulo: true,
  docCedula: true,
  docDominio: true,
  docLibreDeuda: true,
};

const vehiculos = [
  {
    marca: "Toyota",
    modelo: "Corolla XEI",
    anio: 2025,
    km: 8500,
    precioUsd: 26800,
    categoria: "Sedán",
    transmision: "CVT",
    motor: "1.8L 16v",
    estado: "DISPONIBLE",
    vtvVencimiento: "2027-06-15",
    ...docsCompletos,
  },
  {
    marca: "Toyota",
    modelo: "Hilux SRX",
    anio: 2026,
    km: 50,
    precioUsd: 52000,
    categoria: "Pickup",
    transmision: "Automática",
    motor: "2.8 Turbo Diesel",
    estado: "DISPONIBLE",
    vtvVencimiento: "2028-01-10",
    ...docsCompletos,
  },
  {
    marca: "Volkswagen",
    modelo: "Taos Highline",
    anio: 2024,
    km: 18200,
    precioUsd: 34500,
    categoria: "SUV",
    transmision: "Automática DSG",
    motor: "1.4 TSI",
    estado: "RESERVADO",
    vtvVencimiento: "2027-03-20",
    ...docsCompletos,
  },
  {
    marca: "Volkswagen",
    modelo: "Gol Trend",
    anio: 2019,
    km: 62000,
    precioUsd: 11200,
    categoria: "Compacto",
    transmision: "Manual",
    motor: "1.6L 8v",
    estado: "DISPONIBLE",
    vtvVencimiento: "2026-11-05",
    ...docsCompletos,
  },
  {
    marca: "Chevrolet",
    modelo: "Tracker Premier",
    anio: 2025,
    km: 4100,
    precioUsd: 27900,
    categoria: "SUV",
    transmision: "Automática",
    motor: "1.2 Turbo",
    estado: "DISPONIBLE",
    vtvVencimiento: "2027-08-12",
    ...docsCompletos,
  },
  {
    marca: "Chevrolet",
    modelo: "Onix Turbo LTZ",
    anio: 2023,
    km: 21400,
    precioUsd: 18500,
    categoria: "Compacto",
    transmision: "Manual",
    motor: "1.0 Turbo",
    estado: "RESERVADO",
    vtvVencimiento: "2027-02-01",
    ...docsCompletos,
  },
  {
    marca: "Fiat",
    modelo: "Cronos Precision",
    anio: 2026,
    km: 20,
    precioUsd: 18900,
    categoria: "Sedán",
    transmision: "Manual",
    motor: "1.3L Firefly",
    estado: "DISPONIBLE",
    vtvVencimiento: "2028-02-01",
    ...docsCompletos,
  },
  {
    marca: "Fiat",
    modelo: "Toro Volcano",
    anio: 2022,
    km: 41300,
    precioUsd: 29800,
    categoria: "Pickup",
    transmision: "Automática",
    motor: "2.0 Turbo Diesel 4x4",
    estado: "DISPONIBLE",
    // Caso a propósito con VTV vencida, para mostrar la alerta.
    vtvVencimiento: "2025-09-10",
    ...docsCompletos,
  },
  {
    marca: "Ford",
    modelo: "Ranger XLT",
    anio: 2021,
    km: 58000,
    precioUsd: 33200,
    categoria: "Pickup",
    transmision: "Automática",
    motor: "3.2 Diesel",
    estado: "DISPONIBLE",
    vtvVencimiento: "2027-05-18",
    ...docsCompletos,
  },
  {
    marca: "Ford",
    modelo: "Territory Titanium",
    anio: 2025,
    km: 6700,
    precioUsd: 31500,
    categoria: "SUV",
    transmision: "Automática",
    motor: "1.5 Turbo",
    estado: "RESERVADO",
    vtvVencimiento: "2027-09-25",
    ...docsCompletos,
  },
  {
    marca: "Peugeot",
    modelo: "2008 Allure",
    anio: 2024,
    km: 12300,
    precioUsd: 26900,
    categoria: "SUV",
    transmision: "Automática CVT",
    motor: "1.6L 16v",
    estado: "DISPONIBLE",
    vtvVencimiento: "2027-10-05",
    ...docsCompletos,
  },
  {
    marca: "Renault",
    modelo: "Sandero Intens",
    anio: 2025,
    km: 5600,
    precioUsd: 17200,
    categoria: "Compacto",
    transmision: "Manual",
    motor: "1.6L 16v",
    estado: "DISPONIBLE",
    vtvVencimiento: "2027-06-30",
    ...docsCompletos,
  },
  {
    marca: "Renault",
    modelo: "Duster Iconic",
    anio: 2024,
    km: 15200,
    precioUsd: 24500,
    categoria: "SUV",
    transmision: "CVT",
    motor: "1.3 Turbo",
    estado: "VENDIDO",
    vtvVencimiento: "2027-07-01",
    ...docsCompletos,
  },
];

async function main() {
  const tenant = await prisma.tenant.findUnique({ where: { dominio: DOMINIO } });
  if (!tenant) {
    throw new Error(`No existe un tenant con dominio "${DOMINIO}"`);
  }

  const dueño = await prisma.usuario.findFirst({
    where: { tenantId: tenant.id, rol: "DUENIO" },
  });
  if (!dueño) {
    throw new Error(`El tenant "${DOMINIO}" no tiene un usuario DUENIO para asignar ventas`);
  }

  let creados = 0;
  let vendidos = 0;

  for (const v of vehiculos) {
    const { estado, vtvVencimiento, ...rest } = v;

    const vehiculo = await prisma.vehiculo.create({
      data: {
        ...rest,
        tenantId: tenant.id,
        estado: estado === "VENDIDO" ? "DISPONIBLE" : estado,
        vtvVencimiento: new Date(vtvVencimiento),
      },
    });
    creados += 1;

    if (estado === "VENDIDO") {
      const comision = Math.round(v.precioUsd * 0.03);
      await prisma.$transaction([
        prisma.venta.create({
          data: {
            tenantId: tenant.id,
            vehiculoId: vehiculo.id,
            vendedorId: dueño.id,
            precioFinal: v.precioUsd,
            comision,
          },
        }),
        prisma.vehiculo.update({
          where: { id: vehiculo.id },
          data: { estado: "VENDIDO" },
        }),
      ]);
      vendidos += 1;
    }

    console.log(`✓ ${v.marca} ${v.modelo} (${estado})`);
  }

  console.log(`\nListo: ${creados} vehículos creados en "${tenant.nombre}", ${vendidos} con venta registrada.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
