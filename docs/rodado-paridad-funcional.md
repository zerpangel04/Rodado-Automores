# Paridad funcional — Rodado vs. deConcesionarias

## Ya resuelto en Rodado (diseño + prototipo funcional)
| Función | Estado |
|---|---|
| e-Stock (alta, edición, estados: disponible/reservado/vendido) | ✅ Prototipo funcional con datos persistentes |
| e-CRM / gestión de leads por etapa | ✅ Kanban funcional (Nuevo → Contactado → Test drive → Negociación) |
| Registro de venta | ✅ Se completa automático al marcar un auto "Vendido" |
| Precios en USD | ✅ |
| Panel con KPIs en tiempo real | ✅ |
| Landing comercial para vender la plataforma | ✅ |

## Lo que tiene deConcesionarias y todavía no construimos
| Función de ellos | Qué es | Prioridad para Rodado |
|---|---|---|
| **Certificación oficial Mercado Libre** | Sincronización automática de stock con ML, cada consulta entra como lead | 🔴 Alta — es su feature ancla. Requiere trámite de partner con ML, no es solo código. |
| **Multipublicador** | Cargás el auto una vez y se publica en ML + 10 portales a la vez | 🔴 Alta — lo tenemos en el diseño de la landing como promesa, falta construirlo de verdad |
| **Tasación / peritaje con IA** | Cargás la patente, trae datos del vehículo y sugiere precio de compra según mercado en vivo | 🟡 Media — fuerte diferenciador pero requiere fuente de datos de mercado (scraping o API de terceros) |
| **Gestión documental** | Control de título, cédula, VTV, informe de dominio por vehículo | 🟡 Media — relativamente simple de construir (son campos + recordatorios de vencimiento) |
| **Asistente WhatsApp con IA** | Responde consultas automáticamente | 🟢 Ya está en el concepto de Rodado (lo mostramos en la landing), falta implementación real |
| **Cotización de dólar diaria automática** | Actualiza precios según cotización del día | 🟢 Baja complejidad — es una API pública |

## Cómo lo leo
Las dos funciones "Alta prioridad" (ML certificado + multipublicador) son las que de verdad les dan ventaja hoy, pero también son las más caras de construir — no es solo programarlas, hay que pasar un proceso de certificación con Mercado Libre que lleva tiempo. No es bloqueante para arrancar: podés vender la Fase 1 (Stock + CRM + Ventas, que ya tenés funcionando) mientras tramitás eso en paralelo.

Las de "Media" y "Baja" prioridad las podemos ir sumando al prototipo funcional ahora mismo, sin depender de terceros.
