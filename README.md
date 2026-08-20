# Rodado

SaaS de gestión comercial para concesionarias multimarca en Argentina — stock, leads, ventas, documentación y financiación en un solo sistema.

## Antes de tocar código, leé esto
- **`docs/rodado-brief-tecnico.md`** — resumen del producto, stack sugerido, modelo de datos y orden de construcción por sprint. Es el punto de partida para Claude Code.
- **`docs/rodado-paridad-funcional.md`** — qué funciones tiene la competencia (deConcesionarias) y cuáles ya cubrimos.
- **`docs/rodado-desglose-proyecto.md`** — plan completo del proyecto por fases (validación, MVP, diferenciación, escala).
- **`design-reference/`** — dos prototipos HTML funcionales (landing comercial y panel interno) que son la referencia exacta de diseño: colores, tipografía, layout. No rediseñar desde cero, migrar este lenguaje visual a los componentes reales.

## Estado actual
Este repo tiene el esqueleto inicial: `package.json`, esquema de base de datos (`prisma/schema.prisma`) ya modelado según el negocio (Tenant, Usuario, Vehículo, Lead, Venta), y toda la documentación de producto. **Todavía no hay código de aplicación** — eso es lo que se construye a partir de acá.

## Cómo arrancar

```bash
npm install
cp .env.example .env
# completar DATABASE_URL en .env con una base Postgres real
# (Supabase, Railway o Neon tienen planes gratuitos para arrancar)

npx prisma generate
npx prisma migrate dev --name init

npm run dev
```

## Orden de construcción sugerido
Ver `docs/rodado-brief-tecnico.md`, sección 5. Resumen:
1. Auth + multi-tenant + CRUD de stock
2. CRM de leads (kanban) + registro de ventas
3. Cotización de dólar en vivo + documentación + tasación con IA
4. Integraciones externas (Mercado Libre, WhatsApp) — requieren trámites, no solo código

## Decisiones ya tomadas (no volver a discutir)
- Nombre: **Rodado**
- Segmento: agencias chicas/medianas multimarca en Argentina
- Identidad visual: ver `design-reference/`
