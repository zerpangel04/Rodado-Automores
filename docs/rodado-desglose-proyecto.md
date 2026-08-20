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
2. **Asistente de WhatsApp con IA**: responde consultas 24/7, califica al lead antes de pasarlo al vendedor (ya lo mostramos en la landing).
3. **Catálogo público de mejor calidad visual** que el de la competencia — esto ya lo tenés resuelto en diseño.
4. **Multipublicador** (Mercado Libre + otros portales): funcionalidad cara de construir (requiere certificación con cada portal) pero es lo que más pide el mercado. Evaluar si construirlo propio o integrarlo vía terceros al principio.
5. **Simulador de financiación en vivo**: ya lo tenés armado en el prototipo.

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
