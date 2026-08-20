# Rodado — Brief técnico para desarrollo

Este documento es el punto de partida para construir la aplicación real (backend + base de datos + multi-tenant). Todo lo mencionado acá ya fue validado en diseño y lógica con prototipos funcionales — el trabajo en Claude Code es llevarlo a producción, no redefinirlo desde cero.

## 1. Qué es Rodado
SaaS de gestión comercial para concesionarias multimarca en Argentina (agencias chicas/medianas). Reemplaza Excel + WhatsApp + publicación manual en portales con un sistema único: stock, leads, ventas, financiación y documentación conectados.

Competencia directa: deConcesionarias, Autosoft.com.ar, DeAutos.io. Paridad funcional ya mapeada — ver sección 6.

## 2. Stack técnico sugerido
- **Frontend**: React (ya hay prototipos HTML/CSS/JS que sirven de referencia visual exacta — colores, tipografía, layout).
- **Backend**: Node.js + API REST, o Next.js full-stack si se prefiere un solo repo.
- **Base de datos**: PostgreSQL — necesaria por el modelo relacional (agencias → vehículos → leads → ventas) y porque Prisma/Drizzle facilitan el multi-tenant.
- **Auth**: sistema de login con roles (dueño, vendedor, admin) y aislamiento de datos por agencia (multi-tenant).
- **Hosting**: a definir según presupuesto (Vercel + Railway/Supabase es la combinación más simple para arrancar).

## 3. Modelo de datos (borrador)

**Tenant (Agencia)**: id, nombre, plan, dominio/subdominio, fecha de alta.

**Usuario**: id, tenant_id, nombre, email, rol (dueño/vendedor/admin), password_hash.

**Vehículo**: id, tenant_id, marca, modelo, año, km, precio_usd, estado (disponible/reservado/vendido), categoría, fotos (urls), fecha_ingreso.
  - Sub-objeto documentación: título (bool), cédula (bool), informe_dominio (bool), libre_deuda (bool), vtv_vencimiento (date).

**Lead**: id, tenant_id, vehiculo_id (nullable), nombre_cliente, contacto, canal (whatsapp/mercadolibre/instagram/web), etapa (nuevo/contactado/test_drive/negociacion/cerrado), vendedor_asignado_id, fecha_creacion.

**Venta**: id, tenant_id, vehiculo_id, lead_id, vendedor_id, precio_final, comision, fecha, estado_cobro.

## 4. Sistema de diseño (ya definido, no rediseñar)
- **Landing pública / marketing**: fondo blanco cálido `#FAF9F5`, panel oscuro `#14161C`, acento amarillo señal `#F5B400`, azul `#2A4CD6` para kickers, verde `#1E8A5C` para éxito. Tipografía: Space Grotesk (títulos), Inter (cuerpo), IBM Plex Mono (datos/números).
- **Panel interno (app)**: sidebar oscura `#14161C`, contenido claro sobre `#FAF9F5`, mismos acentos.
- Los 4 archivos HTML ya generados en esta conversación son la referencia pixel-a-pixel: landing B2B, panel con Stock/Leads/Ventas, y la versión con cotización de dólar en vivo + tasación IA + documentación. Llevarlos a Claude Code como referencia de diseño.

## 5. Funcionalidades — orden de construcción

**Sprint 1 — Fundaciones**
- Auth + multi-tenant (una agencia = datos aislados)
- CRUD de vehículos (stock)
- Catálogo público por agencia (subdominio o URL propia)

**Sprint 2 — Operación**
- CRM de leads (kanban, tal como está prototipado)
- Registro de venta
- Roles y permisos (dueño ve todo, vendedor ve lo suyo)

**Sprint 3 — Diferenciales ya prototipados**
- Cotización de dólar en vivo (ya probado con dolarapi.com, funciona)
- Gestión documental con alertas de vencimiento (VTV)
- Tasación con IA — **en el prototipo es simulada**; para producción evaluar fuente de datos real (API de mercado o modelo entrenado con datos propios)

**Sprint 4 — Integraciones externas (dependen de terceros, arrancar el trámite en paralelo)**
- Certificación como partner de Mercado Libre (proceso administrativo, no solo desarrollo)
- Multipublicador a otros portales
- WhatsApp Business API para el asistente con IA

## 6. Paridad funcional de referencia
Ver documento `rodado-paridad-funcional.md` generado antes en esta conversación — tiene el detalle de qué tiene la competencia y prioridad de cada función.

## 7. Qué NO redefinir en Claude Code
Ya está resuelto y no hay que volver a discutirlo:
- Nombre: Rodado
- Segmento: agencias chicas/medianas multimarca en Argentina
- Identidad visual completa (colores, tipografía, tono de marca)
- Estructura de módulos y su prioridad
