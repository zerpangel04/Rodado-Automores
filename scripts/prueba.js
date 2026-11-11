// Corre un comando contra la base de PRUEBA definida en .env.prueba.
// Uso: node scripts/prueba.js npx prisma migrate deploy
//
// Protección: se niega a correr si la base o el proyecto de Supabase de
// .env.prueba coinciden con los de .env (producción). Las variables de
// .env.prueba pisan a las del entorno, así Prisma y Next no leen las de .env.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const raiz = path.join(__dirname, "..");

function leerEnv(archivo) {
  const ruta = path.join(raiz, archivo);
  if (!fs.existsSync(ruta)) return {};
  const vars = {};
  for (const linea of fs.readFileSync(ruta, "utf8").split(/\r?\n/)) {
    const m = linea.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    vars[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return vars;
}

// Identifica una base por usuario + host + base (sin contraseña).
function idBase(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `${decodeURIComponent(u.username)}@${u.hostname}${u.pathname}`;
  } catch {
    return null;
  }
}

function abortar(msg) {
  console.error(`\n[prueba] ABORTADO: ${msg}\n`);
  process.exit(1);
}

const prueba = leerEnv(".env.prueba");
const prod = leerEnv(".env");

for (const k of ["DATABASE_URL", "DIRECT_URL", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!prueba[k]) abortar(`falta ${k} en .env.prueba`);
}

const idsProd = new Set(
  [idBase(prod.DATABASE_URL), idBase(prod.DIRECT_URL)].filter(Boolean)
);
for (const k of ["DATABASE_URL", "DIRECT_URL"]) {
  if (idsProd.has(idBase(prueba[k]))) abortar(`${k} de .env.prueba apunta a la base de producción`);
}
if (prod.SUPABASE_URL && prod.SUPABASE_URL === prueba.SUPABASE_URL) {
  abortar("SUPABASE_URL de .env.prueba es la de producción");
}
if (prod.SUPABASE_SERVICE_ROLE_KEY && prod.SUPABASE_SERVICE_ROLE_KEY === prueba.SUPABASE_SERVICE_ROLE_KEY) {
  abortar("SUPABASE_SERVICE_ROLE_KEY de .env.prueba es la de producción");
}

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) abortar("falta el comando a correr");

console.error(`[prueba] usando base de prueba: ${idBase(prueba.DIRECT_URL)}`);
const r = spawnSync(cmd, args, {
  cwd: raiz,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, ...prueba, ENTORNO_PRUEBA: "1" },
});
process.exit(r.status ?? 1);
