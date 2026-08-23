# Rodado — Desglose completo del proyecto

Plataforma comercial para concesionarias multimarca en Argentina. Este documento organiza todo lo que falta definir y construir, dividido en fases y áreas, para que sirva de mapa de trabajo.

---

## Fase 0 — Validación (antes de escribir una línea de backend)

Objetivo: confirmar que hay 3-5 dueños de agencia dispuestos a probarlo antes de invertir en desarrollo real.

- **Marca**: registrar "Rodado" — dominio (.com.ar), Instagram/WhatsApp Business, y chequear que no choque con una marca ya registrada en INPI.
- **Guion de venta**: adaptar la landing que ya armamos en un pitch de 10 minutos para mostrar en persona o por videollamada.
- **Lista de contactos**: 15-20 agencias chicas/medianas (tu segmento definido) para pedir feedback o una demo — no need to vender todavía, solo validar dolor real.
- **Pregunta clave a validar**: ¿cuánto pagan hoy por Excel + WhatsApp + publicación manual (tiempo, plata, errores)? Esto define tu pricing.
- **Criterio de avance**: si 3 de 10 conversaciones terminan en "cuándo lo puedo probar", seguís. Si no, revisás el enfoque antes de construir.

---

## Fase 1 — MVP funcional (el core que no puede fallar)

### Producto — módulos imprescindibles
1. **e-Stock**: alta de vehículo (foto, marca, modelo, año, km, precio ARS/USD, estado), edición, baja.
2. **Catálogo público**: página con el stock de cada agencia (multi-tenant, cada una con su propia URL/subdominio).
3. **e-CRM básico**: leads entrando desde formulario del catálogo, estado del lead (nuevo/contactado/cerrado), asignación a vendedor.
4. **Registro de venta**: marcar vehículo como vendido, precio final, comisión, vendedor.
5. **Login y roles**: dueño, vendedor, admin — permisos distintos.

### Tecnología
- **Multi-tenant**: cada concesionaria = una cuenta aislada, mismo código, datos separados.
- **Backend**: API + base de datos (esto es lo que definimos cuando pasemos a Claude Code — probablemente Node/Postgres o similar).
- **Frontend**: ya tenés el lenguaje visual resuelto (landing + panel); falta conectarlo a datos reales.
- **Hosting**: dónde vive la app (Vercel, Railway, AWS — se define según presupuesto).
- **Dominio y subdominios**: `agencia.rodado.app` por cliente, o dominio propio si el cliente lo pide.

### Negocio
- **Pricing MVP**: un plan único simple (ej. por cantidad de vehículos en stock) para no complicar la venta al principio. Mirá los planes de deConcesionarias como referencia de rango de precios del mercado.
- **Condiciones comerciales**: forma de cobro (mensual, adelantado), moneda (pesos vs. dólares — decisión importante en Argentina).

### Legal
- **Términos y condiciones + política de privacidad** (vas a manejar datos de clientes de tus clientes — dato sensible).
- **Estructura societaria**: monotributo, SRL, etc. — depende de cuánto factures y con cuántos socios arranques.

---

## Fase 2 — Diferenciación (lo que te separa de deConcesionarias/Autosoft)

Elegimos antes 1-2 focos: **IA + experiencia del catálogo**. Estos son los candidatos, priorizados:

1. **Carga por patente/foto con IA**: sacás una foto, la IA completa ficha técnica y sugiere precio de mercado (esto es lo que hace único a deConcesionarias hoy — replicarlo es tabla stakes, no diferenciador).
2. **Asistente de WhatsApp con IA**: responde consultas 24/7, califica al lead antes de pasarlo al vendedor (ya lo mostramos en la landing). Requiere aprobación de Meta Business API — trámite propio, no solo desarrollo. **Decidido (22/08/2026): se deja para el final del proyecto**, junto con el asistente de IA en el catálogo.
3. **Asistente de IA en el catálogo web** (más viable primero que el de WhatsApp, sin depender de terceros): chat anclado al stock real de cada agencia, deriva a Lead cuando hay intención de compra real. Brief técnico ya escrito. **Decidido (22/08/2026): se deja para el final del proyecto**, junto con el bot de WhatsApp.
4. **Catálogo público de mejor calidad visual** que el de la competencia — esto ya lo tenés resuelto en diseño (rediseño completo neón/glass con modo claro/oscuro, hecho el 22/08/2026).
5. **Multipublicador** (Mercado Libre + otros portales): certificación no es un trámite bloqueante — te registrás como developer gratis e inmediato, construís la integración básica con la API pública, y aplicás a la certificación recién cuando tengas 3 meses de uso real. Ver docs/rodado-brief-tecnico.md para el detalle.

   **Actualización (22/08/2026) — integración construida y probada, con un hallazgo de negocio importante**: la conexión OAuth y la publicación de vehículos ya funcionan de punta a punta (probado contra una cuenta real). PERO Mercado Libre no tiene plan gratuito para publicar vehículos — es una suscripción mensual con cupo de publicaciones (piso ~$45.715/mes interior, ~$91.500/mes CABA/GBA, +IVA), y **no se contrata por API**: cada agencia tiene que hablar con un ejecutivo comercial de Mercado Libre para activar su cuenta como "vendedor de vehículos" antes de poder publicar de verdad. Esto significa: (a) el costo del paquete de ML lo paga cada agencia cliente, no Rodado — hay que comunicarlo con transparencia total, nunca vender esto como "gratis"; (b) cada agencia nueva que quiera usar la función tiene un paso manual de onboarding con Mercado Libre que Rodado no puede saltarse ni automatizar. **Decidido (22/08/2026): pausado el paso de sincronización (precio/estado) — se deja para el final del proyecto**, junto con los asistentes de IA. Se retoma cuando haya un cliente real con el paquete de ML contratado.
6. **Simulador de financiación en vivo**: ya lo tenés armado en el prototipo.

### Tecnología adicional
- Integración con APIs de IA (para fichas automáticas y el bot de WhatsApp).
- Integración con WhatsApp Business API.
- Integración con Mercado Libre (requiere solicitud de certificación como partner).

---

## Fase 3 — Escala (una vez que tengas 5-10 clientes pagando)

- Multisucursal (grupos con varias agencias bajo una cuenta).
- Reportes avanzados y analítica.
- Subastas entre agencias, negocios digitales (seguros, garantías — ingresos por comisión, como hace deConcesionarias).
- App móvil.
- Programa de referidos entre concesionarias.
- **Vista 3D/AR del vehículo real** (idea de largo plazo, agosto 2026): que el cliente pueda "caminar alrededor" del auto real con la cámara del celular antes de ir a verlo en persona. Ningún competidor local lo ofrece — sería un diferenciador fuerte. No viable hoy: requiere un modelo 3D del auto específico (no genérico, para no romper la promesa de "stock verificado, lo que ves es lo que hay"), y escanear cada unidad es caro/lento para un lote que rota seguido. Revisar de nuevo cuando: (a) haya tracción real y presupuesto para invertir en diferenciación, y (b) las apps de escaneo 3D por celular (tipo Polycam/Scaniverse, hoy ya funcionales con LiDAR) maduren lo suficiente como para que una agencia lo haga sola, sin equipo especializado.

---

## Áreas transversales (corren en paralelo a todas las fases)

### Diseño
- ✅ Landing B2B (hecha)
- ✅ Panel interno — Stock, Leads, Ventas (hecho)
- Pendiente: pantalla de detalle de vehículo, pantalla de configuración de cuenta, versión mobile del panel.

### Marketing / Ventas
- Landing ya sirve como material de venta.
- Definir canal de adquisición: ¿referidos boca a boca en concesionarias, Instagram/Meta ads, salir a tocar puertas?
- Casos de éxito / testimonios (necesitás tus primeros 3-5 clientes para esto).

### Soporte
- Cómo vas a dar soporte a los primeros clientes (vos mismo por WhatsApp al principio, como hacen deConcesionarias y Autosoft).
- Onboarding: cuánto tarda un cliente nuevo en cargar su stock y estar operativo.

---

## Próximo paso concreto

Con esto mapeado, el cuello de botella real es **Fase 1 — Tecnología**: pasar de maqueta a app real con datos que persistan. Eso es trabajo de Claude Code, no de esta conversación. El resto (validación, pricing, legal) lo podés ir avanzando en paralelo sin bloquear el desarrollo.

---

## Estado real al 20 de agosto de 2026

Lo de arriba es el plan original. Esto es lo que efectivamente existe hoy:

- **Producción funcionando**: https://rodado-automores.vercel.app
- **Hecho**: auth + multi-tenant, CRUD de stock con documentación (título/cédula/dominio/libre deuda/VTV con alertas), CRM de leads (kanban de 5 etapas), registro de ventas con comisión, roles (dueño ve todo, vendedor ve lo suyo), cotización de dólar en vivo, tasación con IA simulada, catálogo público con diseño de marca + filtros + página de detalle + formulario que crea Lead real conectado al CRM.
- **Cuenta demo lista para mostrar**: "Agencia Demo" con 13 vehículos variados, 6 leads repartidos en las 5 etapas, 1 venta cerrada, 1 vendedor de prueba (Martín López) — pensada para mostrarle a dueños de agencia reales sin que se vea vacía ni con datos de test evidentes.
- **Pendiente: asistente de IA en el catálogo** (decidido dejar para el final, agosto 2026). Brief técnico ya escrito, esperando que se complete el resto del roadmap:

> Quiero agregar un asistente de IA en el catálogo público (`/c/[dominio]`), como un widget de chat flotante. Especificaciones: (1) Anclado a datos reales — recibe el stock actual de esa agencia (marca, modelo, año, km, precio, estado, transmisión, motor) consultado en vivo, nunca inventa autos ni precios. (2) Alcance: disponibilidad, precios, specs, simulación de financiación; deriva a dejar contacto si la consulta excede eso. (3) Si el visitante deja sus datos, crea un Lead real (canal="WEB_IA") conectado al kanban existente. (4) Multi-tenant: cada agencia ve solo su propio stock. (5) API de Anthropic (Claude), key en variable de entorno `ANTHROPIC_API_KEY`.

- **Pendientes de higiene**: rotar la contraseña de la base de Supabase (quedó escrita en el historial de esta conversación durante el debugging).
- **Pendiente de negocio**: registrarse como developer en Mercado Libre (developers.mercadolibre.com.ar) para arrancar la integración básica — no bloqueante, se puede hacer en paralelo a seguir mostrando la demo.
