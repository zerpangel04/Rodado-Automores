# Handoff: Rodado — restyling completo (grafito ámbar)

## Overview
Rodado es un SaaS de gestión comercial para concesionarias multimarca en Argentina (reemplaza Excel + WhatsApp suelto + carga manual en portales). Este paquete contiene el rediseño visual completo: 9 pantallas del panel interno, el catálogo público que ven los compradores, la landing comercial y el login.

**El contenido y la estructura funcional no cambiaron.** Es un cambio de identidad visual (de violeta/rosa a grafito ámbar), más mejoras de jerarquía, densidad de información y estados accionables sobre las mismas pantallas que ya existen.

## About the Design Files
Los archivos de `designs/` son **referencias de diseño hechas en HTML** — prototipos que muestran el aspecto y el comportamiento buscados, **no código de producción para copiar y pegar**.

La tarea es **recrear estos diseños en el codebase actual** (por lo visto en `rodado-automores.vercel.app`, un proyecto React/Next.js) usando sus patrones, componentes y librerías ya establecidos. Los `.dc.html` son componentes de un runtime de prototipado: leelos como especificación visual (markup + estilos inline + lógica de estado), no como fuente a importar.

Cada archivo abre en el navegador y es interactivo: conviene abrirlos y hacer clic para entender los estados antes de implementar.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciados, radios, sombras y estados están definitivos. Los valores exactos están en "Design Tokens". Se espera recreación pixel-perfect con los componentes del codebase.

Los datos son de demo pero **están cruzados entre pantallas** (6 vehículos, 17 leads, 7 ventas del mes, 3 personas, 2 sucursales). Al conectar datos reales, mantener esa coherencia: los KPIs se derivan de los registros, nunca se hardcodean.

## Design Tokens

### Colores — superficies
| Uso | Hex |
|---|---|
| Fondo app / página | `#0b0d10` |
| Fondo del shell (contenedor) | `#12151a` |
| Sidebar | `#0f1216` |
| Área de contenido (main) | `#11141a` |
| Tarjeta / panel | `#171b21` |
| Tarjeta elevada (gradiente) | `linear-gradient(165deg, #1a1f26, #15191f)` |
| Tarjeta de lead / ítem | `#191e25` |
| Input | `#14171c` |
| Fondo con halo (páginas de panel) | `radial-gradient(1200px 600px at 20% -10%, #1c2129 0%, #0e1116 55%, #0b0d10 100%)` |

### Colores — bordes y líneas
- Borde de contenedor: `rgba(255,255,255,0.07)`
- Borde de tarjeta: `rgba(255,255,255,0.06)` – `rgba(255,255,255,0.07)`
- Hairline divisor: `rgba(255,255,255,0.055)`
- Divisor de fila de tabla: `rgba(255,255,255,0.04)`
- Highlight interno superior: `inset 0 1px 0 rgba(255,255,255,0.05)`

### Colores — acento (ámbar)
| Uso | Valor |
|---|---|
| Acento base | `#f0a13c` |
| Acento claro (texto sobre oscuro) | `#f3bd77` |
| Acento muy claro (títulos destacados) | `#f7d3a1` |
| Gradiente de botón primario | `linear-gradient(140deg, #f5b45c, #e08c2c)` |
| Texto sobre botón ámbar | `#17130c` |
| Sombra de botón primario | `0 8px 20px rgba(224,140,44,0.25)` |
| Fondo de estado activo (nav/chip) | `rgba(240,161,60,0.14)` con borde `rgba(240,161,60,0.22)` |
| Logo / avatar de marca | `linear-gradient(140deg, #f0a13c, #c9762a)` |

### Colores — semánticos
| Significado | Texto | Fondo | Borde |
|---|---|---|---|
| Éxito / disponible / cobrado | `#86efac` (punto `#4ade80`) | `rgba(74,222,128,0.12)` | `rgba(74,222,128,0.26)` |
| Atención / pendiente / demora | `#fcd34d` (punto `#fbbf24`) | `rgba(251,191,36,0.12)` | `rgba(251,191,36,0.26)` |
| Error / crítico / lead frío | `#fca5a5` (punto `#f87171`) | `rgba(248,113,113,0.10)` | `rgba(248,113,113,0.26)` |
| Informativo | `#93c5fd` (punto `#60a5fa`) | `rgba(96,165,250,0.12)` | `rgba(96,165,250,0.24)` |
| Secundario / etapa | `#d8b4fe` (punto `#c084fc`) | `rgba(192,132,252,0.14)` | — |

### Colores — texto
| Nivel | Hex |
|---|---|
| Máximo énfasis (números, títulos) | `#f2f5f7` / `#f7f9fa` |
| Título / cuerpo fuerte | `#eff2f4` |
| Cuerpo | `#e9ecef` |
| Cuerpo secundario | `#dfe4e9` / `#c3c9cf` |
| Terciario | `#b0b7be` / `#a8b0b8` |
| Muted | `#949ba3` / `#8d949e` |
| Muy muted / metadatos | `#7d848d` / `#6a7179` |
| Deshabilitado / placeholder | `#5d656d` / `#4d545b` |

### Canales (colores de origen de lead)
WhatsApp `#4ade80` · Catálogo propio / Web `#60a5fa` · Instagram `#c084fc` · Mercado Libre `#fbbf24` · Asistente IA `#8d949e`

### Etapas del pipeline
Nuevo `#60a5fa` · Contactado `#f0a13c` · Test drive `#c084fc` · Negociación `#fbbf24` · Cerrado `#4ade80`

### Avatares (por persona, consistente en todas las pantallas)
- Alejandro Rivas: `linear-gradient(140deg, #f5b45c, #e08c2c)`
- Gustavo Ledesma: `linear-gradient(140deg, #93c5fd, #3b82f6)`
- Martín López: `linear-gradient(140deg, #86efac, #22c55e)`

### Tipografía
**Familia:** Plus Jakarta Sans (Google Fonts), pesos 400/500/600/700/800. Fallback `system-ui, sans-serif`. `-webkit-font-smoothing: antialiased`.

| Rol | Tamaño | Peso | Letter-spacing | Line-height |
|---|---|---|---|---|
| H1 landing / catálogo | 54–62px | 800 | -0.035 – -0.04em | 1.02–1.06 |
| H2 sección landing | 36–38px | 800 | -0.03em | 1.1 |
| Número KPI grande | 24–27px | 700 | -0.035em | 0.95–1 |
| Precio en tarjeta | 21–22px | 700 | -0.02 – -0.03em | 1 |
| Título de página (panel) | 21px | 700 | -0.01em | — |
| Título de tarjeta / sección | 13–16.5px | 700 | -0.01em | 1.35 |
| Cuerpo | 12.5–15.5px | 400–600 | — | 1.5–1.65 |
| Fila de tabla | 12.5px | 400–600 | — | 1.35–1.4 |
| Etiqueta versalita | 9–10px | 700 | 0.12–0.16em | — |
| Metadato | 10.5–11.5px | 400–600 | — | 1.35 |

**Reglas tipográficas obligatorias:**
- Todo número (precios, km, cantidades, teléfonos, fechas) lleva `font-variant-numeric: tabular-nums`.
- Nombres de persona y textos que pueden desbordar: `line-height` explícito ≥1.35 + `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` (sin `line-height` los ascendentes se recortan).
- Párrafos: `text-wrap: pretty`. Títulos grandes: `text-wrap: balance`.
- Patentes y URLs: `font-family: ui-monospace, SFMono-Regular, Menlo, monospace`, `letter-spacing: 0.1–0.14em`.

### Espaciado, radios y sombras
- Escala de gap: 2, 3, 6, 8, 9, 10, 11, 12, 14, 16, 18, 22px.
- Padding de página: `20px 22px 28px`. Padding de tarjeta: 14–18px. Padding de fila de tabla: `14px 18px`.
- Radios: input/botón 8–11px · tarjeta 12–14px · contenedor 16px · modal 18px · chip/pill 20–22px · avatar 50%.
- Sombra de shell: `0 30px 80px rgba(0,0,0,0.55)`. Modal: `0 50px 120px rgba(0,0,0,0.7)`. Drawer: `-40px 0 100px rgba(0,0,0,0.6)`. Hover de tarjeta: `0 26px 54px rgba(0,0,0,0.45)`.
- Scrollbar: 6px, thumb `rgba(255,255,255,0.12)` radio 6px, track transparente.

## Patrones compartidos (implementar una vez, reusar)

### 1. Shell del panel
`display: grid; grid-template-columns: 212px minmax(1000px, 1fr)` dentro de un contenedor con borde, radio 16px, `overflow-x: auto; overflow-y: hidden` (el scroll horizontal evita que se corten columnas en anchos chicos). Padding externo 18px.

### 2. Sidebar (212px)
Logo → selector de agencia → tarjeta de cotización del dólar (oficial/blue con punto verde) → grupo OPERACIÓN (Panel general, Stock 6, Leads 17, Ventas, Reportes) → grupo AGENCIA (Sucursales 2, Equipo 3, Integraciones) → al pie, usuario con rol y botón de salida.
Ítem inactivo: texto `#8d949e`, hover `background: rgba(255,255,255,0.04)`. Ítem activo: fondo `rgba(240,161,60,0.14)`, borde `rgba(240,161,60,0.22)`, texto `#f2f5f7`, ícono `#f3bd77`, badge de contador en ámbar.

### 3. Topbar
Búsqueda tipo pill (260px) + a la derecha: correo, notificaciones con punto rojo, y chip de usuario con avatar, nombre y rol.

### 4. Tarjeta KPI (el patrón más repetido)
```
fondo linear-gradient(165deg, #1a1f26, #15191f)
borde rgba(255,255,255,0.07), radio 13px
box-shadow: inset 0 1px 0 rgba(255,255,255,0.05)
hairline superior de 1px: linear-gradient(90deg, <color>, transparent 65%) con opacity .5
fila 1: punto de color 6px con glow (box-shadow 0 0 7px) + label 12px #949ba3
fila 2: número 24px 700 tabular + unidad 11.5px #7d848d + tendencia a la derecha (color semántico)
fila 3: barra de 3px, track rgba(255,255,255,0.07), fill linear-gradient(90deg, c1, c2)
```

### 5. Control segmentado (filtros)
Contenedor `rgba(255,255,255,0.03)` + borde `rgba(255,255,255,0.07)`, radio 11px, padding 3px. Ítem activo: `background: rgba(255,255,255,0.07)` + `box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 2px 8px rgba(0,0,0,0.3)`, texto `#f7f9fa`. Inactivo: transparente, texto `#8d949e`. Cada ítem lleva contador en `#5d656d` (activo `#a8b0b8`) y, cuando corresponde, punto de color de 5px. **No usar el gradiente ámbar en estos filtros** (se probó y se descartó: demasiado ruido).

### 6. Dropdown de filtro (vehículo / vendedor)
Trigger con punto ámbar + label truncado + `▾`; cambia a fondo `rgba(240,161,60,0.10)` y borde `rgba(240,161,60,0.3)` cuando hay selección activa. Panel absoluto (top 42px, derecha 0), ancho 262–288px, fondo `#171b21`, radio 12px, sombra `0 30px 70px rgba(0,0,0,0.6)`, con encabezado versalita y filas de dos líneas (label + metadato) más contador a la derecha. Las opciones se derivan de los datos, ordenadas por cantidad.

### 7. Tabla
Encabezado: grid con las mismas fracciones que las filas, `gap: 14–18px`, padding `11px 18px`, versalitas 9.5px `#6a7179` con `letter-spacing: 0.1em`, fondo `rgba(255,255,255,0.015)`, borde inferior hairline. Filas: `padding: 14px 18px`, borde inferior `rgba(255,255,255,0.04)`, hover `rgba(240,161,60,0.055)`. Montos y comisiones alineados a la derecha. Cuando aplica, fila de totales al pie con fondo `rgba(255,255,255,0.022)` que **se recalcula según el filtro activo**.

### 8. Jerarquía de acciones
Primaria: gradiente ámbar, texto `#17130c`, peso 700. Secundaria: `rgba(255,255,255,0.05)` + borde `rgba(255,255,255,0.09)`, texto `#b0b7be`. **Destructiva (Eliminar): nunca visible en la fila/tarjeta — va dentro del menú `···`.** Esto fue un cambio explícito respecto del diseño anterior.

### 9. Animaciones
- `prefers-reduced-motion: reduce` → `animation: none !important; transition: none !important` (obligatorio).
- Punto pulsante "en vivo": `opacity .35→1` + `scale(1)→scale(1.35)`, 2–2.6s, `ease-in-out infinite`.
- Hover de tarjeta: `transform: translateY(-2 a -4px)`, transición `.2–.3s cubic-bezier(.2,.7,.3,1)`.
- Reveal al hacer scroll (landing): IntersectionObserver, `opacity 0→1` + `translateY(22px)→0`, `.7s cubic-bezier(.2,.7,.3,1)`, delay escalonado `(i % 3) * 0.07s`.
- Drawer: `translateX(18px)→0` + fade, `.28–.3s`. Modal/popover: `translateY(14px) scale(.98)→0`, `.28s`.

## Screens / Views

### 1. Panel general — `designs/Panel Rodado.dc.html`
Saludo con fecha + filtros (Hoy / Todas las sucursales). Cuatro KPIs con **anillos de progreso** (`conic-gradient(<color> 0% <pct>%, rgba(255,255,255,0.08) 0)` de 46px con hueco de 35px del color del fondo de la tarjeta); el segundo KPI es la tarjeta destacada en ámbar sólido (`linear-gradient(150deg, #e29a3a, #c9762a)`). Debajo: "Pendientes de hoy" (lista con checkbox y chip de antigüedad, 320px) + "Leads recientes" (tabla de 5 columnas con chips de canal y etapa).

### 2. Stock — `designs/Stock Rodado.dc.html`
Header con contexto (`6 vehículos · 2 sucursales · inventario USD 141.900 ≈ $217.816.500`). Cuatro KPIs (disponibles, reservados, documentación a revisar, rotación). Filtros segmentados por estado + orden cíclico (más reciente / precio / días en stock) + toggle Grilla/Tabla.

Tarjeta de vehículo: foto 196px con degradado `linear-gradient(180deg, rgba(11,13,16,0.55) 0%, transparent 38%, rgba(11,13,16,0.72) 100%)`; sobre la foto, chip de estado de vidrio (`rgba(11,13,16,0.55)` + `backdrop-filter: blur(10px)` + punto de color con glow — **no** píldora de color saturado), patente arriba a la derecha, modelo + specs abajo a la izquierda, badge de interesados pulsando a la derecha. Cuerpo: etiqueta versalita "PRECIO DE LISTA" + precio 21px + `≈ $ARS · dólar oficial`; a la derecha "EN STOCK" + días + sucursal. Fila de documentación entre hairlines (arriba y abajo) con ícono de color, texto y contador ("5 de 5"). Pie: estado de Mercado Libre como línea discreta + botones Editar / Publicar·Resolver·Ver ficha.

**Modal "Nuevo vehículo"** (4 pasos navegables, se abre desde el botón del header):
1. **Fotos** — 1 principal grande + 4 secundarias etiquetadas (lateral, interior, tablero, motor), controles Recortar/Girar, contador "6 de 20". Nota: subida desde el celular con recorte al subir.
2. **Datos** — marca, modelo, año, km, combustible, transmisión, patente, sucursal, observaciones para el catálogo (span 2).
3. **Precio** — USD + equivalente en pesos calculado, y bloque de **tasación con IA** con rango sugerido y botón "Usar sugerido". Debe decir explícitamente que es una estimación, no dato de mercado en vivo.
4. **Documentación** — título, cédula, informe de dominio, libre de deuda, VTV con fecha de vencimiento y aviso 30 días antes.

### 3. Leads — `designs/Leads Rodado.dc.html`
Alerta ámbar arriba: "5 leads sin contactar hace más de una semana" con botón que filtra el tablero a esos. Fila de filtros: segmentado (Todos / Sin contactar / Sin vendedor) + búsqueda que ocupa el espacio libre + dropdown "Todos los vehículos" (solo unidades con leads, con conteo y cuántos van avanzados) + toggle Kanban/Tabla.

**Kanban:** 5 columnas de `minmax(258px, 1fr)`, gap 12px. Cabecera de columna con hairline de color arriba, punto, nombre, contador y **valor USD en juego** de la etapa. Cuerpo con `max-height: 640px; overflow-y: auto` y placeholder punteado "Sin leads en esta etapa" cuando está vacía.

Tarjeta de lead (padding 15px, gap 13px): avatar 32px con iniciales + nombre 14.5px + teléfono; bloque del vehículo con precio; mensaje del comprador en cursiva truncado a 62 caracteres; chips de canal y de **antigüedad con color por urgencia** (rojo ≥7 días en Nuevo, ámbar ≥15 días, gris si está fresco — el rojo también tiñe el borde de la tarjeta); pie con vendedor (avatar "?" si no está asignado) + botón WhatsApp 30px + botón que **avanza de etapa** (mueve la tarjeta de columna).

**Drawer de ficha** (430px, clic en la tarjeta): acciones WhatsApp/Llamar/Email, mensaje completo del comprador, vehículo consultado con precio en ambas monedas, recorrido por etapas (timeline), vendedor asignado con opción de cambiar, y al pie "Avanzar a <etapa>" + "Marcar perdido".

### 4. Ventas — `designs/Ventas Rodado.dc.html`
Selector de período (Este mes / Trimestre / Todo — **los tres deben filtrar de verdad**) + Exportar. Cuatro KPIs: facturado (con equivalente en pesos), unidades vendidas, comisiones (con cuánto falta pagar en ámbar), ticket promedio. Filtros: segmentado Todas/Pendiente/Cobrado + búsqueda + dropdown de vendedor con lo facturado por cada uno.

Tabla (6 columnas): fecha con "hace N días" debajo · vehículo con patente y sucursal · vendedor con avatar · precio final con equivalente en pesos · comisión con su **porcentaje real sobre la venta** · chip de cobro. Fila de totales al pie.

Columna derecha (316px): "Por vendedor" (ranking con barras proporcionales, facturado y comisión) y "Comisiones a pagar" (por vendedor, total pendiente y botón "Registrar pago de comisiones").

### 5. Reportes — `designs/Reportes Rodado.dc.html`
Período 30/90 días/Rango + sucursal + Exportar. Cuatro KPIs con **sparklines** de barras (facturado, unidades, conversión lead→venta, rotación promedio).

- **Ventas en el tiempo** (1.45fr): barras de unidades por día (ámbar, con el valor arriba) + `polyline` SVG del monto superpuesta (verde `#86efac`, `vector-effect: non-scaling-stroke`), con 3 líneas de grilla y leyenda arriba a la derecha. Reemplaza los dos gráficos separados del diseño anterior, que mostraban lo mismo dos veces.
- **Embudo de conversión** (1fr): 5 etapas con barra proporcional, cantidad y **% de caída respecto de la etapa anterior** (rojo si cae ≥30%), más una lectura al pie señalando dónde está la fuga.
- **Leads por canal**: barras horizontales con doble capa (total en ámbar translúcido + cerrados en verde encima) y **% de conversión** por canal coloreado por rendimiento.
- **Rotación de stock**: barras por unidad vendida con color por velocidad (verde <14 días, ámbar 14–27, rojo ≥28), promedio arriba a la derecha y leyenda al pie. Solo vehículos ya vendidos (nunca "0 días").
- **Performance por vendedor**: tabla con leads, ventas, barra de cierre + %, facturado y comisión. La columna VENTAS lleva `padding-right: 18px` para no pegarse a la barra.
- **Tres lecturas automáticas** al pie (mejor canal, canal que no cierra, unidad con rotación lenta).

### 6. Sucursales — `designs/Sucursales Rodado.dc.html`
Alerta cuando faltan datos: "<Sucursal> no tiene dirección ni teléfono cargados" + la consecuencia real (el comprador del catálogo no sabe dónde ver el auto) + botón Completar. Cuatro KPIs. Una **tarjeta por sucursal** (grid de 2): ícono, nombre con chip PRINCIPAL, subtítulo (vehículos · vendedores), dirección y teléfono con botón "Cargar" cuando faltan, cuatro métricas divididas por hairlines (stock, leads, ventas, facturado), barra de **participación del stock**, y pie con avatares apilados del equipo (`margin-left: -7px` + borde 2px del color de la tarjeta) + Editar / Ver stock. Cierra con tarjeta punteada "Agregar otra sucursal" que explica qué se gana.

### 7. Equipo — `designs/Equipo Rodado.dc.html`
Filtro Todos/Dueño/Vendedores + "Invitar usuario". Cuatro KPIs (personas, leads asignados con los sin asignar en ámbar, cierre del equipo, comisiones del mes).

Fila por persona (grid `1.25fr | 1.6fr | auto`): avatar 42px con **punto de conexión** (verde en línea / gris offline), nombre, chip de rol, email, sucursal y última actividad; cuatro métricas (leads activos, ventas, **% de cierre coloreado**, comisión); acciones Permisos / Ver ficha / `···`.

Debajo: **"Qué ve cada rol"** (Dueño ve toda la operación; Vendedor solo sus leads, sus ventas y el stock de su sucursal) y **"Carga de trabajo"** (barras de leads por vendedor, rojo si ≥6, con los leads sin asignar y botón "Repartir").

> Regla de datos: los leads asignados por persona deben sumar **menos o igual** que el total de leads, y "sin asignar" se deriva con `Math.max(0, TOTAL - asignados)`. El mensaje solo aparece si el resto es > 0.

### 8. Integraciones — `designs/Integraciones Rodado.dc.html`
Chip global "1 conexión activa". Sección **CONECTADAS** con Mercado Libre a ancho completo: logo ML, estado Conectada, `Cuenta #1658994008`, quién la vinculó y cuándo; cuatro métricas (publicaciones activas 4 de 6, consultas importadas, última sincronización, **1 publicación que requiere atención**); a la izquierda log de sincronización de 24 h (timeline), a la derecha cuatro **switches funcionales** de qué se sincroniza (precios y stock, fotos y descripción, consultas como leads, pausar al vender). Acciones: Configurar / Sincronizar ahora (con estado "Sincronizando…") / `···` (reconectar, desconectar).

Sección **EN CAMINO**: cuatro tarjetas apagadas con estado real (WhatsApp en desarrollo, Instagram y Financieras planificadas, Contabilidad en evaluación) y botón "Avisarme" que queda marcado "✓ Te avisamos". Al pie, franja para pedir integraciones.
**Para agregar una integración nueva:** se suma una tarjeta al bloque de conectadas con el mismo patrón (métricas + log + switches).

### 9. Catálogo público — `designs/Catalogo Publico Rodado.dc.html`
Es la pantalla que ve el comprador; URL por agencia (`rodado.app/c/<slug>`).

- **Header sticky**: nombre de la agencia + "Stock actualizado hoy" con punto verde; a la derecha horario, sucursales, teléfono y botón WhatsApp verde (`linear-gradient(140deg, #86efac, #34d399)`). Los datos de la derecha se configuran por agencia.
- **Hero**: H1 54px "Las unidades de **<Nombre de la agencia>**" (el nombre en gradiente ámbar con `background-clip: text`) + subtítulo, y a la derecha panel **"Stock en vivo"** de 448px: cuatro datos calculados en una fila (unidades publicadas, precio desde, marcas, menor kilometraje) + acceso al asistente con dos preguntas sugeridas que abren el chat ya respondido.
- **Filtros**: búsqueda, orden cíclico (más nuevos / menor precio / menos kilómetros) y chips de marca con contador **generados desde el stock**.
- **Grilla de 3 columnas**: foto 208px (placeholder — las imágenes las publica el SaaS, **no incluir ninguna UI de subida acá**), chip de estado, contador de fotos, modelo y specs sobre el degradado; precio 22px + equivalente en pesos + **cuota estimada** (≈2,08% del precio USD); chips (combustible, documentación al día, acepta permuta); pie con sucursal + WhatsApp + Ver detalle.
- **Drawer de ficha** (470px): foto principal 250px con miniaturas, precio con equivalente y cuota, specs en grilla 2×3 con separadores de 1px, checklist de documentación, ubicación con "Cómo llegar", y formulario **"¿Te interesa este auto?"** (nombre + teléfono) que al enviar cambia a "Listo, ya tenemos tu consulta". **Ese envío es el lead que entra al CRM.**
- **Asistente de IA flotante** (reemplaza al botón de chat anterior): pill ámbar "Preguntale al asistente · Conoce todo el stock". Al abrirse, panel de 384px con cabecera ("Responde sobre las 6 unidades en stock"), historial de mensajes (burbujas: bot `rgba(255,255,255,0.045)` radio `13px 13px 13px 5px`; usuario gradiente ámbar radio `13px 13px 5px 13px`), estado "Buscando en el stock…", chips de preguntas sugeridas, input con botón enviar y salida a WhatsApp para hablar con una persona. **Debe responder anclado al stock real de esa agencia** (precios, km, sucursales, documentación). En el prototipo la respuesta es un matcher por palabras clave: reemplazar por la llamada real al asistente, manteniendo el formato de respuesta (concreto, nombra unidades y precios, cierra con una pregunta).
- **Footer**: agencia, las dos sucursales con dirección/teléfono/horario, y la aclaración de que los precios se actualizan a diario.

### 10. Landing comercial — `designs/Landing Rodado.dc.html`
Público: dueño de agencia multimarca chica/mediana en Argentina, no técnico, hoy con Excel y WhatsApp. CTA único: **"Pedí tu demo"**.

Secciones: header sticky con nav · hero con badge, H1 62px y el panel real animándose (KPIs contando desde 0 con easing cúbico de 1,7s + filas de leads entrando en loop de 9s) · marquee de patentes y modelos · **9 módulos** (e-Stock, e-CRM, Ventas y comisiones, Reportes, Multisucursal, Equipo y roles, Cotización del dólar, Tasación con IA, Catálogo público) · Cómo funciona en 3 pasos · **Desde el celular** (texto + 4 tarjetas + CTA a la izquierda, iPhone 390×844 a la derecha con el panel móvil real) · el panel por dentro con tabs Stock/Leads/Reportes/Catálogo · catálogo público con mockup · integraciones · seguridad (4 tarjetas) · **planes** con slider de "cuántos autos tenés en stock" que recomienda el plan en vivo ($60.000 / $85.000 / $120.000 por mes, pesos + IVA, precios de referencia) + matriz comparativa de 11 filas · CTA final · footer.

Fondo animado: dos halos radiales en movimiento (18s y 24s), grilla en perspectiva (`rotateX(62deg)` con `mask-image` hacia arriba, loop de 4,5s) y dos carriles de ruta corriendo horizontalmente. Intensidad de animación: media (3/5).

### 11. Login — `designs/Login Rodado.dc.html`
Split 50/50. Izquierda: logo, "Entrá al panel de tu agencia", email y contraseña con ver/ocultar, checkbox "Mantener la sesión abierta", "¿Olvidaste tu contraseña?", botón con spinner, alta de cuenta, y al pie la nota de conexión cifrada y datos aislados. **Validaciones reales**: formato de email, mínimo 6 caracteres, y mensaje de error con intentos restantes (guiño a la protección contra fuerza bruta). Derecha: foto a sangre con degradado, título "Tu playa, ordenada de punta a punta" y tres etiquetas (Stock y documentación · Catálogo y Mercado Libre · Leads y ventas). Todo con `clamp()` para aguantar pantallas bajas.

## Interactions & Behavior
Comportamientos que el prototipo ya implementa y deben conservarse:

| Pantalla | Interacción |
|---|---|
| Stock | Filtro por estado, orden cíclico (3 estados), toggle Grilla/Tabla, modal de 4 pasos con navegación adelante y por clic en el paso |
| Leads | Filtros combinables (segmentado + vehículo + alerta), botón que **avanza el lead de etapa** moviéndolo de columna, drawer de ficha, toggle Kanban/Tabla |
| Ventas | Período, filtro de cobro, dropdown de vendedor; **todos los totales y paneles se recalculan** |
| Reportes | Período que recalcula KPIs, series, embudo, canales, rotación y ranking |
| Equipo | Filtro por rol |
| Integraciones | Switches de sincronización, "Sincronizar ahora" con estado temporal (1,6s), "Avisarme" con estado marcado |
| Catálogo | Filtro por marca, orden, drawer de ficha, formulario con confirmación, chat del asistente con historial y respuestas |
| Landing | Reveal al scroll, tabs del demo, slider de stock que cambia el plan recomendado |
| Login | Validación, ver/ocultar contraseña, recordar sesión, spinner, error |

**Estados vacíos:** columna de kanban vacía → placeholder punteado. Dato faltante → nunca "—" a secas: texto explicativo ("Falta cargar la dirección") + acción ("Cargar").

## State Management
Estado local por pantalla (en el prototipo, `this.state`):
- Stock: `filtro`, `vista`, `orden`, `modal`, `paso`
- Leads: `vista`, `filtro`, `vehiculo`, `listaAbierta`, `abierto` (ficha), `soloUrgentes`, `movidos` (mapa id→etapa)
- Ventas: `periodo`, `filtro`, `vendedor`, `listaAbierta`
- Reportes: `periodo`
- Equipo: `filtro`
- Integraciones: `sync`, `opciones` (4 booleanos), `avisos` (mapa)
- Catálogo: `marca`, `orden`, `ficha`, `chat`, `mensajes`, `borrador`, `pensando`, `enviado`, `nombre`, `tel`
- Landing: `t` (progreso de animación), `tab`, `autos` (slider)
- Login: `email`, `pass`, `show`, `remember`, `loading`, `error`

**Datos:** todo KPI, total, porcentaje, conteo de filtro y barra se **deriva** de la lista de registros. Ningún número se escribe a mano en la vista (fue la causa de los dos bugs que hubo que corregir: "7 de 6 en stock" y "-1 leads sin asignar").

Cotización: `USD → ARS` con el dólar oficial (`1535` en el prototipo) desde el servicio en vivo que ya tiene la app. Mostrar siempre `USD` como valor principal y `≈ $ARS` como secundario.

## Assets
- **Fuente:** Plus Jakarta Sans (Google Fonts).
- **Iconografía:** caracteres Unicode geométricos (`▣ ◫ ◍ ◈ ◔ ⬡ ◎ ⌗ ⌖ ✆ ✓ ⚠ ◷ ⇱ ◇ ★ ···`). **Reemplazar por el set de íconos del codebase** (Lucide, Heroicons o el que ya use el proyecto) manteniendo tamaño y color.
- **Imágenes:** ninguna incluida. En los prototipos hay placeholders (`<image-slot>` en la landing/login, bloques con la leyenda "FOTO DEL VEHÍCULO" en el catálogo). En producción las fotos vienen del stock cargado en el SaaS.
- **Copy:** el de los archivos es definitivo, en español rioplatense (voseo). Evitar términos que se descartaron explícitamente: "usados" en títulos, "se enfrían", "se está durmiendo".

## Files
```
designs/
  Panel Rodado.dc.html              Panel general
  Stock Rodado.dc.html              Stock + modal Nuevo vehículo
  Leads Rodado.dc.html              Kanban/tabla de leads + drawer
  Ventas Rodado.dc.html             Ventas, comisiones y ranking
  Reportes Rodado.dc.html           Analítica (series, embudo, canales, rotación)
  Sucursales Rodado.dc.html         Sucursales
  Equipo Rodado.dc.html             Equipo, roles y carga de trabajo
  Integraciones Rodado.dc.html      Mercado Libre + roadmap
  Catalogo Publico Rodado.dc.html   Catálogo del comprador + asistente IA
  Landing Rodado.dc.html            Landing comercial
  Login Rodado.dc.html              Login
  image-slot.js                     Placeholder de imagen (solo prototipo)
  support.js                        Runtime del prototipo (NO portar)
```

`support.js` y `image-slot.js` son infraestructura del entorno de prototipado: no van al proyecto.

## Cómo abordar la implementación
1. Empezar por el **shell** (sidebar + topbar + fondo) y los **primitivos**: KPI, control segmentado, dropdown de filtro, tabla, chip de estado, botón primario/secundario. Con eso, 8 de las 9 pantallas del panel salen por composición.
2. Después las pantallas, en orden de valor: Stock → Leads → Ventas → Reportes → Sucursales → Equipo → Integraciones.
3. El **catálogo público** es independiente (no comparte shell) y es la cara al cliente: conviene tratarlo como app aparte con el tema compartido.
4. Landing y login se pueden hacer en cualquier momento.
5. Al conectar datos, verificar cada número contra su fuente: que las sumas cierren y que ningún contador pueda dar negativo o mayor que el total.
