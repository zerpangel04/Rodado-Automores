"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./landing.module.css";
import { Reveal } from "./Reveal";
import { LandingMobileMenu } from "./LandingMobileMenu";

const NAV_ITEMS = [
  { label: "Panel general", icon: "▣", active: true },
  { label: "Stock", icon: "◫" },
  { label: "Leads", icon: "◍" },
  { label: "Ventas", icon: "◈" },
  { label: "Reportes", icon: "◔" },
  { label: "Equipo", icon: "◎" },
];

const MOCK_KPIS = [
  { label: "Stock disponible", value: "6 / 6", ring: "#f0a13c", featured: false, valueColor: undefined },
  { label: "Leads en negociación", value: "4 / 17", ring: "#ffffff", featured: true, valueColor: "#fff" },
  { label: "Conversión lead→venta", value: "10 / 27", ring: "#4ade80", featured: false, valueColor: "var(--success-text)" },
  { label: "Publicaciones activas", value: "24", ring: "#60a5fa", featured: false, valueColor: "var(--info-text)" },
] as const;

const MOCK_LEADS = [
  { nombre: "Bruno Castro", contacto: "11-4411-2290", vehiculo: "Toyota Corolla XEI", canal: "WhatsApp", canalColor: "#4ade80", etapa: "Contactado", etapaBg: "rgba(96,165,250,0.14)", etapaColor: "#93c5fd" },
  { nombre: "Valentina Torres", contacto: "11-5544-1122", vehiculo: "Toyota Hilux SRX", canal: "WhatsApp", canalColor: "#4ade80", etapa: "Negociación", etapaBg: "rgba(240,161,60,0.16)", etapaColor: "#f3bd77" },
  { nombre: "Diego Martinez", contacto: "11-3321-9087", vehiculo: "Fiat Cronos Precision", canal: "Instagram", canalColor: "#c084fc", etapa: "Cerrado", etapaBg: "rgba(74,222,128,0.14)", etapaColor: "#86efac" },
  { nombre: "Sofía Ramirez", contacto: "11-6789-2345", vehiculo: "Ford Ranger XLT", canal: "Mercado Libre", canalColor: "#fbbf24", etapa: "Test drive", etapaBg: "rgba(192,132,252,0.14)", etapaColor: "#d8b4fe" },
  { nombre: "Lucia Fernandez", contacto: "11-4444-5555", vehiculo: "Peugeot 2008 Allure", canal: "Web", canalColor: "#60a5fa", etapa: "Nuevo", etapaBg: "rgba(255,255,255,0.07)", etapaColor: "#b0b7be" },
] as const;

const MARQUEE_BASE = [
  { plate: "AF 482 KQ", model: "Toyota Hilux SRX", state: "publicado en 3 canales" },
  { plate: "AC 917 TL", model: "Ford Ranger XLT", state: "2 consultas hoy" },
  { plate: "AE 205 BR", model: "Fiat Cronos Precision", state: "reservado" },
  { plate: "AD 771 MZ", model: "Toyota Corolla XEI", state: "en negociación" },
  { plate: "AG 034 PS", model: "Peugeot 2008 Allure", state: "publicado en 4 canales" },
  { plate: "AB 566 HN", model: "Chevrolet Onix Turbo LTZ", state: "test drive agendado" },
];
const MARQUEE_ITEMS = [...MARQUEE_BASE, ...MARQUEE_BASE];

const MODULOS = [
  { icon: "◫", title: "e-Stock", desc: "Alta con fotos reales y recorte manual, más la carpeta completa del auto: título, cédula, informe de dominio, libre de deuda y VTV con alerta de vencimiento.", meta: "Núcleo" },
  { icon: "◍", title: "e-CRM", desc: "Pipeline kanban de Nuevo a Cerrado o vista de tabla con filtros, con el mensaje completo de cada comprador en su ficha.", meta: "Núcleo" },
  { icon: "◈", title: "Ventas y comisiones", desc: "Registrás la venta con vendedor y la comisión se calcula sola. Si algo se cae, revertís la operación.", meta: "Núcleo" },
  { icon: "◔", title: "Reportes", desc: "Ventas en el tiempo, conversión por canal, rotación promedio de stock y ranking por vendedor.", meta: "Núcleo" },
  { icon: "⬡", title: "Multisucursal", desc: "Una cuenta, varias sucursales: mirás todo consolidado o filtrás por ubicación.", meta: "Módulo" },
  { icon: "◎", title: "Equipo y roles", desc: "El dueño ve toda la operación; cada vendedor ve solo lo suyo.", meta: "Módulo" },
  { icon: "$", title: "Cotización del dólar", desc: "Oficial y blue actualizados en vivo dentro del panel, para cotizar sin salir del sistema.", meta: "Incluido" },
  { icon: "◇", title: "Tasación con IA", desc: "Precio de referencia sugerido según categoría, año y kilometraje. Es una estimación para orientarte, no un dato de mercado en vivo.", meta: "Módulo" },
  { icon: "⇱", title: "Catálogo público", desc: "Tu propia URL con tu stock, tus filtros y tus fotos. Cada consulta entra como lead al CRM.", meta: "Incluido" },
] as const;

const PASOS = [
  { n: "01", title: "Cargás el auto una vez", desc: "Fotos, precio y datos en una ficha. Se acabó repetir el mismo auto en cada plataforma." },
  { n: "02", title: "Se publica solo", desc: "La misma ficha alimenta tu catálogo público y tu cuenta de Mercado Libre. Cambiás el precio en un lugar y cambia en los dos." },
  { n: "03", title: "Seguís cada consulta", desc: "Todo lo que entra cae en el pipeline con vendedor, etapa y próxima acción. Nada se pierde en un chat." },
] as const;

const MOVIL_CHECKS = [
  "Subís las fotos del auto desde la cámara y las recortás ahí mismo",
  "Contestás una consulta sin volver al escritorio",
  "Movés el lead de etapa o cerrás la venta en el momento",
  "Chequeás precio y documentación con el cliente adelante",
];

const MOVIL_CARDS = [
  { icon: "⌗", titulo: "iPhone y Android", detalle: "Funciona en el navegador de cualquier teléfono, sin descargar una app." },
  { icon: "◎", titulo: "Los mismos permisos", detalle: "Cada vendedor ve solo lo suyo, igual que en la computadora." },
  { icon: "⇱", titulo: "Fotos desde la cámara", detalle: "Sacás la foto del auto y la subís a la ficha en el momento." },
  { icon: "⌁", titulo: "Avisos al instante", detalle: "Te llega la notificación cuando entra una consulta nueva." },
];

const PHONE_PENDIENTES = [
  { a: "Contactar a Franco Molina", b: "Lead sin contactar", c: "40 d" },
  { a: "Asignar vendedor", b: "Milagros Vega", c: "hoy" },
  { a: "Revisar VTV", b: "Ford Ranger XLT", c: "12 d" },
  { a: "Llamar a Bruno Castro", b: "Negociación abierta", c: "hoy" },
];

const PHONE_ACTIVIDAD = [
  { text: "Sofía Ramírez pasó a Test drive", time: "12 min", dot: "#d8b4fe" },
  { text: "Se publicó Peugeot 2008 Allure", time: "1 h", dot: "#fbbf24" },
  { text: "Venta registrada · Corolla XEI", time: "3 h", dot: "#4ade80" },
];

const TABS = [
  {
    label: "Stock",
    url: "rodado.app/stock",
    title: "Cada auto, con su carpeta al día.",
    desc: "Fotos reales con recorte al subirlas, precio, y toda la documentación del vehículo en la misma ficha. La VTV avisa sola cuando está por vencer.",
    bullets: ["Título, cédula, informe de dominio y libre de deuda", "Alerta automática de vencimiento de VTV", "Badge de interesados por unidad"],
    panelLabel: "STOCK ACTIVO",
    rows: [
      { a: "Toyota Corolla XEI", b: "2021 · 48.000 km", c: "4 interesados" },
      { a: "Ford Ranger XLT", b: "VTV vence en 12 días", c: "Revisar" },
      { a: "Fiat Cronos Precision", b: "2022 · 31.200 km", c: "Reservado" },
      { a: "Peugeot 2008 Allure", b: "Documentación completa", c: "2 interesados" },
    ],
  },
  {
    label: "Leads",
    url: "rodado.app/leads",
    title: "Ningún interesado se enfría.",
    desc: "Pipeline visual de Nuevo a Cerrado, o vista de tabla con filtros. Cada ficha guarda el mensaje completo que dejó el comprador.",
    bullets: ["Kanban: Nuevo → Contactado → Test drive → Negociación → Cerrado", "Si vendés un auto con interesados abiertos, te avisa y los reasignás a otra unidad", "Alertas de leads sin contactar y sin vendedor"],
    panelLabel: "PIPELINE DE HOY",
    rows: [
      { a: "Nuevo", b: "Entraron desde el catálogo", c: "6" },
      { a: "Contactado", b: "Con vendedor asignado", c: "5" },
      { a: "Test drive", b: "Agendados esta semana", c: "2" },
      { a: "Negociación", b: "Con oferta sobre la mesa", c: "4" },
    ],
  },
  {
    label: "Reportes",
    url: "rodado.app/reportes",
    title: "Sabés qué canal te vende.",
    desc: "Ventas en el tiempo, conversión por canal de origen, rotación de stock y ranking de vendedores — con los datos que ya cargás todos los días.",
    bullets: ["Tasa de conversión por canal de origen", "Rotación: días promedio entre carga y venta", "Ranking de performance por vendedor"],
    panelLabel: "LEADS POR CANAL",
    rows: [
      { a: "Mercado Libre", b: "Conversión a venta", c: "—" },
      { a: "Catálogo propio", b: "Conversión a venta", c: "—" },
      { a: "WhatsApp", b: "Conversión a venta", c: "—" },
      { a: "Instagram", b: "Conversión a venta", c: "—" },
    ],
  },
  {
    label: "Catálogo",
    url: "rodado.app/c/tu-agencia",
    title: "Tu catálogo público, con tu marca.",
    desc: "Cada agencia tiene su propia URL con su stock real, filtros y fichas con galería. Las consultas caen directo al CRM, no a un mail que nadie mira.",
    bullets: ["Filtros por marca, precio y estado", "Ficha con galería, specs y sucursal", "El formulario genera un lead real en tu pipeline"],
    panelLabel: "CONSULTAS DEL CATÁLOGO",
    rows: [
      { a: "“¿Acepta permuta?”", b: "Toyota Hilux SRX", c: "Nuevo" },
      { a: "“¿Está financiado?”", b: "Fiat Cronos Precision", c: "Nuevo" },
      { a: "“Quiero verlo el sábado”", b: "Ford Ranger XLT", c: "Test drive" },
      { a: "“¿Tiene service al día?”", b: "Peugeot 2008 Allure", c: "Contactado" },
    ],
  },
];

const CANALES = [
  { name: "Mercado Libre", note: "Conexión OAuth con tu propia cuenta", logo: "/logos/mercadolibre.svg" },
  { name: "Tu catálogo público", note: "Formularios que entran como lead", color: "#60a5fa" },
  { name: "Email", note: "Notificaciones y recupero de cuenta", color: "#c084fc" },
  { name: "Asistente de IA", note: "Responde sobre tu stock real · en desarrollo", color: "#4ade80" },
];

const PLANES_BASE = [
  {
    name: "Núcleo",
    desc: "Para la agencia que hoy vive en Excel y quiere ordenar stock y clientes.",
    items: ["e-Stock con documentación y alertas de VTV", "e-CRM: pipeline kanban y vista de tabla", "Catálogo público con tu marca", "Ventas con comisión automática", "Cotización del dólar en vivo", "1 sucursal · 2 vendedores"],
    nota: "Ideal hasta 25 autos en stock",
    precio: "$60.000",
  },
  {
    name: "Agencia",
    desc: "Para la que publica en varios canales y no quiere cargar el mismo auto tres veces.",
    items: ["Todo lo del Núcleo", "Publicación en Mercado Libre (OAuth)", "Tasación con IA", "Reportes y analítica completos", "Hasta 3 sucursales", "Vendedores ilimitados"],
    nota: "Ideal de 25 a 80 autos en stock",
    precio: "$85.000",
  },
  {
    name: "Multisucursal",
    desc: "Para grupos con varios locales y equipos de venta separados.",
    items: ["Todo lo del plan Agencia", "Sucursales ilimitadas", "Permisos por equipo y rol", "Reportes consolidados por sucursal", "Soporte dedicado"],
    nota: "Para más de 80 autos en stock",
    precio: "$120.000",
  },
] as const;

const MATRIZ: [string, string, string, string][] = [
  ["e-Stock con documentación y alertas de VTV", "✓", "✓", "✓"],
  ["e-CRM: pipeline kanban y vista de tabla", "✓", "✓", "✓"],
  ["Catálogo público con tu marca", "✓", "✓", "✓"],
  ["Ventas con comisión automática", "✓", "✓", "✓"],
  ["Cotización del dólar en vivo", "✓", "✓", "✓"],
  ["Publicación en Mercado Libre", "—", "✓", "✓"],
  ["Tasación con IA", "—", "✓", "✓"],
  ["Reportes y analítica", "Básico", "Completo", "Consolidado"],
  ["Sucursales", "1", "Hasta 3", "Ilimitadas"],
  ["Vendedores con rol propio", "2", "Ilimitados", "Ilimitados"],
  ["Soporte", "Por mail", "Prioritario", "Dedicado"],
];

const SEGURIDAD = [
  { title: "Datos aislados por agencia", desc: "Ninguna concesionaria ve el stock ni los leads de otra." },
  { title: "Protección contra fuerza bruta", desc: "Los intentos de acceso se limitan automáticamente." },
  { title: "Contraseñas hasheadas", desc: "Nunca se guardan en texto plano, ni las vemos nosotros." },
  { title: "Formularios a prueba de bots", desc: "El catálogo público filtra spam antes de que llegue a tu CRM." },
];

function matrixCellColor(v: string) {
  if (v === "—") return "#4d545b";
  if (v === "✓") return "var(--success-text)";
  return "#a8b0b8";
}

export function LandingView() {
  return (
    <>
      <div className={styles.bgLayer}>
        <div className={styles.bgGlow1} />
        <div className={styles.bgGlow2} />
        <div className={styles.bgFade} />
      </div>

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>
              <Image src="/logo-rodado.png" alt="Rodado" width={64} height={64} />
            </div>
            <div className={`${styles.logoText} disp`}>Rodado</div>
          </div>
          <div className={styles.navLinks}>
            <a href="#plataforma">Plataforma</a>
            <a href="#modulos">Módulos</a>
            <a href="#movil">Celular</a>
            <a href="#catalogo">Catálogo</a>
            <a href="#precios">Precios</a>
          </div>
          <div className={styles.navRight}>
            <a className={styles.loginLink} href="/login">
              Iniciar sesión
            </a>
            <a className={styles.btnGlow} href="/signup">
              Pedí tu demo →
            </a>
            <LandingMobileMenu />
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <Reveal>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Stock, leads y ventas en un solo sistema
          </div>
        </Reveal>
        <Reveal delayMs={60}>
          <h1 className="disp">
            Dejá el Excel.
            <br />
            Manejá tu concesionaria
            <br />
            <span className={styles.hl}>desde un solo panel.</span>
          </h1>
        </Reveal>
        <Reveal delayMs={120}>
          <p className={styles.sub}>
            Cargás el auto una vez y corre por todo el sistema: publicaciones, consultas de cada
            canal y el seguimiento de cada comprador hasta la venta.
          </p>
        </Reveal>
        <Reveal delayMs={180}>
          <div className={styles.heroCtas}>
            <a className={`${styles.btnGlow} ${styles.btnHero}`} href="/signup">
              Pedí tu demo →
            </a>
            <a className={styles.btnOutline} href="#plataforma">
              Ver la plataforma
            </a>
          </div>
        </Reveal>
        <Reveal delayMs={220}>
          <div className={styles.heroTags}>
            <span>Sin instalación</span>
            <span className={styles.dot}>·</span>
            <span>Migramos tu stock actual</span>
            <span className={styles.dot}>·</span>
            <span>Hecho para agencias argentinas</span>
          </div>
        </Reveal>
      </section>

      <section id="plataforma" className={styles.mockSection}>
        <Reveal>
          <div className={styles.mockFrame}>
            <div className={styles.mockTitlebar}>
              <div className={styles.mockDots}>
                <span />
                <span />
                <span />
              </div>
              <div className={styles.mockUrl}>rodado.app/panel</div>
            </div>
            <div className={styles.mockBody}>
              <div className={styles.mockNav}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px 12px" }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      background: "var(--accent-mark-grad)",
                    }}
                  />
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em" }}>RODADO</div>
                </div>
                {NAV_ITEMS.map((n) => (
                  <div key={n.label} className={`${styles.mockNavItem} ${n.active ? styles.active : ""}`}>
                    <span className={styles.mockNavIcon} style={{ color: n.active ? "var(--accent)" : undefined }}>
                      {n.icon}
                    </span>
                    {n.label}
                  </div>
                ))}
                <div className={styles.mockDollar}>
                  <div className={styles.label}>DÓLAR</div>
                  <div className={styles.row}>
                    <span>Oficial</span>
                    <span>$1.535</span>
                  </div>
                  <div className={styles.row}>
                    <span>Blue</span>
                    <span>$1.555</span>
                  </div>
                </div>
              </div>

              <div className={styles.mockContent}>
                <div className={styles.mockGreeting}>
                  <div>
                    <div className={styles.date}>Domingo, 30 de agosto</div>
                    <div className={styles.hi}>Buenos días, Alejandro</div>
                  </div>
                </div>

                <div className={styles.mockKpiGrid}>
                  {MOCK_KPIS.map((k) => (
                    <div key={k.label} className={`${styles.mockKpi} ${k.featured ? styles.featured : ""}`}>
                      <div
                        className={styles.mockKpiRing}
                        style={{ background: `conic-gradient(${k.ring} 0% 70%, rgba(255,255,255,0.08) 0)` }}
                      >
                        <div
                          className={styles.mockKpiHole}
                          style={{
                            background: k.featured ? "#d5842f" : "var(--surface)",
                            color: k.featured ? "#fff" : "var(--accent-light)",
                          }}
                        >
                          %
                        </div>
                      </div>
                      <div>
                        <div className={styles.label} style={{ color: k.featured ? "rgba(255,255,255,0.8)" : "#8d949e" }}>
                          {k.label}
                        </div>
                        <div className={styles.value} style={{ color: k.valueColor ?? "var(--ink)" }}>
                          {k.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.mockLeadsPanel}>
                  <div className={styles.mockLeadsHead}>
                    <div className={styles.title}>Leads recientes</div>
                    <div className={styles.mockLive}>
                      <span className={styles.pulseDot} />
                      en vivo
                    </div>
                    <div className={styles.more}>Ver todos →</div>
                  </div>
                  <div className={styles.mockTableHead}>
                    <div>NOMBRE</div>
                    <div>CONTACTO</div>
                    <div>VEHÍCULO</div>
                    <div>CANAL</div>
                    <div>ETAPA</div>
                  </div>
                  {MOCK_LEADS.map((l) => (
                    <div key={l.nombre} className={styles.mockLeadRow}>
                      <div className={styles.nombre}>{l.nombre}</div>
                      <div className={styles.contacto}>{l.contacto}</div>
                      <div className={styles.vehiculo}>{l.vehiculo}</div>
                      <div>
                        <span
                          className={styles.mockChip}
                          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", color: "#c3c9cf" }}
                        >
                          <span className={styles.mockChipDot} style={{ background: l.canalColor }} />
                          {l.canal}
                        </span>
                      </div>
                      <div>
                        <span className={styles.mockChip} style={{ background: l.etapaBg, color: l.etapaColor }}>
                          <span className={styles.mockChipDot} style={{ background: l.etapaColor }} />
                          {l.etapa}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className={styles.marqueeSection}>
        <div className={styles.marqueeTrack}>
          {MARQUEE_ITEMS.map((m, i) => (
            <div key={i} className={styles.marqueeItem}>
              <span className={styles.marqueePlate}>{m.plate}</span>
              {m.model}
              <span className={styles.marqueeState}>{m.state}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="modulos" className={styles.section}>
        <Reveal>
          <div className={styles.sectionHead}>
            <div className={styles.kicker}>LOS MÓDULOS</div>
            <h2 className="disp">Un núcleo. Sumás lo que tu agencia necesita.</h2>
            <p>Todo comparte el mismo dato: cargás el auto una vez y corre por todo el sistema.</p>
          </div>
        </Reveal>
        <div className={styles.modGrid}>
          {MODULOS.map((m, i) => (
            <Reveal key={m.title} delayMs={(i % 3) * 60}>
              <div className={styles.mcard}>
                <div className={styles.mcardIcon}>{m.icon}</div>
                <div className={styles.mcardTitleRow}>
                  <h4 className="disp">{m.title}</h4>
                </div>
                <p>{m.desc}</p>
                <div className={styles.mcardMeta}>{m.meta}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="como" className={`${styles.section} ${styles.sectionAlt}`} style={{ maxWidth: "none" }}>
        <div className={styles.wrap}>
          <Reveal>
            <div className={styles.sectionHead}>
              <div className={styles.kicker}>CÓMO FUNCIONA</div>
              <h2 className="disp">Tres pasos, una sola carga.</h2>
            </div>
          </Reveal>
          <div className={styles.pasosGrid}>
            {PASOS.map((p, i) => (
              <Reveal key={p.n} delayMs={i * 80}>
                <div className={styles.pasoCard}>
                  <div className={styles.pasoN}>{p.n}</div>
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="movil" className={styles.movilSection}>
        <div className={styles.movilGlow} />
        <div className={styles.movilGrid}>
          <Reveal>
            <div className={styles.movilCol}>
              <div className={styles.kicker}>DESDE EL CELULAR</div>
              <h2 className="disp">El panel entero, en tu bolsillo.</h2>
              <p>
                Rodado está adaptado a celular: entrás desde el teléfono y tenés exactamente lo
                mismo que en la computadora. Sin apps para instalar.
              </p>
              <div className={styles.checkList}>
                {MOVIL_CHECKS.map((c) => (
                  <div key={c} className={styles.checkItem}>
                    <span className={styles.checkMark}>✓</span>
                    {c}
                  </div>
                ))}
              </div>
              <div className={styles.movilCardsGrid}>
                {MOVIL_CARDS.map((c) => (
                  <div key={c.titulo} className={styles.movilCard}>
                    <div className={styles.movilCardHead}>
                      <span className={styles.movilCardIcon}>{c.icon}</span>
                      <div className={styles.titulo}>{c.titulo}</div>
                    </div>
                    <div className={styles.detalle}>{c.detalle}</div>
                  </div>
                ))}
              </div>
              <div className={styles.movilCtaRow}>
                <a className={styles.btnGlow} href="/signup">
                  Pedí tu demo →
                </a>
                <div className={styles.movilCtaNote}>Entrás desde el navegador del celular, sin instalar nada.</div>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className={styles.phoneMock}>
              <div className={styles.phoneStatus}>
                <span>9:41</span>
                <span>▮▮▮ ⌁</span>
              </div>
              <div className={styles.phoneBody}>
                <div className={styles.phoneHeadRow}>
                  <div className={styles.phoneMark}>R</div>
                  <div>
                    <div className={styles.agencia}>Agencia Demo</div>
                    <div className={styles.titulo}>Panel general</div>
                  </div>
                </div>

                <div className={styles.phoneKpis}>
                  <div className={styles.phoneKpi}>
                    <div className={styles.label}>Stock disponible</div>
                    <div className={styles.value}>6 / 6</div>
                  </div>
                  <div className={`${styles.phoneKpi} ${styles.featured}`}>
                    <div className={styles.label} style={{ color: "rgba(255,255,255,0.82)" }}>
                      En negociación
                    </div>
                    <div className={styles.value} style={{ color: "#fff" }}>
                      4 / 17
                    </div>
                  </div>
                  <div className={styles.phoneKpi}>
                    <div className={styles.label}>Conversión</div>
                    <div className={styles.value} style={{ color: "var(--success-text)" }}>
                      37%
                    </div>
                  </div>
                  <div className={styles.phoneKpi}>
                    <div className={styles.label}>VTV por vencer</div>
                    <div className={styles.value} style={{ color: "var(--warn-text)" }}>
                      2
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div className={styles.phoneSectionLabel}>
                    PENDIENTES DE HOY
                    <span className={styles.phoneCount}>10</span>
                  </div>
                  {PHONE_PENDIENTES.map((p) => (
                    <div key={p.a} className={styles.phoneRow}>
                      <div className={styles.phoneCheckbox} />
                      <div style={{ minWidth: 0 }}>
                        <div className={styles.a}>{p.a}</div>
                        <div className={styles.b}>{p.b}</div>
                      </div>
                      <div className={styles.c}>{p.c}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                  <div className={styles.phoneSectionLabel}>ACTIVIDAD RECIENTE</div>
                  {PHONE_ACTIVIDAD.map((a) => (
                    <div key={a.text} className={styles.phoneActivity}>
                      <span className={styles.phoneActivityDot} style={{ background: a.dot }} />
                      <div>{a.text}</div>
                      <div className={styles.time}>{a.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="demo" className={styles.section}>
        <TabsDemo />
      </section>

      <section id="catalogo" className={styles.section}>
        <div className={styles.catalogoGrid}>
          <Reveal>
            <div className={styles.catalogoCol}>
              <div className={styles.kicker}>CATÁLOGO PÚBLICO</div>
              <h2 className="disp">Tu vidriera online, conectada al CRM.</h2>
              <p>
                Cada agencia tiene su propia dirección con su stock real y su marca. El comprador
                filtra, entra a la ficha, deja su consulta — y eso aparece como lead en tu
                pipeline, con el auto y el mensaje ya cargados.
              </p>
              <div className={styles.urlChip}>
                <span>rodado.app/c/</span>tu-agencia
              </div>
              <div className={styles.checkList}>
                <div className={styles.checkItem}>
                  <span className={styles.checkMark}>✓</span>
                  Filtros por marca, precio y estado
                </div>
                <div className={styles.checkItem}>
                  <span className={styles.checkMark}>✓</span>
                  Galería, specs completos y sucursal en cada ficha
                </div>
                <div className={styles.checkItem}>
                  <span className={styles.checkMark}>✓</span>
                  Asistente de IA anclado a tu stock real{" "}
                  <span style={{ fontSize: 10, color: "#7d848d" }}>· en desarrollo</span>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <div className={styles.catalogoMock}>
              <div className={styles.mockTitlebar}>
                <div className={styles.mockDots}>
                  <span />
                  <span />
                  <span />
                </div>
                <div className={styles.mockUrl} style={{ padding: "4px 20px" }}>
                  rodado.app/c/agencia-demo
                </div>
              </div>
              <div className={styles.catalogoMockBody}>
                <div className={styles.catalogoChips}>
                  <span className={`${styles.catalogoChip} ${styles.active}`}>Todos</span>
                  <span className={styles.catalogoChip}>Toyota</span>
                  <span className={styles.catalogoChip}>Ford</span>
                  <span className={styles.catalogoChip}>Hasta $20M</span>
                  <span className={styles.catalogoChip}>Disponibles</span>
                </div>
                <div className={styles.catalogoCards}>
                  <div className={styles.catalogoCard}>
                    <div className={styles.catalogoCardPhoto}>Foto de tu stock</div>
                    <div className={styles.catalogoCardBody}>
                      <div className={styles.t}>Toyota Corolla XEI</div>
                      <div className={styles.s}>2021 · 48.000 km · Automático</div>
                    </div>
                  </div>
                  <div className={styles.catalogoCard}>
                    <div className={styles.catalogoCardPhoto}>Foto de tu stock</div>
                    <div className={styles.catalogoCardBody}>
                      <div className={styles.t}>Ford Ranger XLT</div>
                      <div className={styles.s}>2019 · 96.500 km · Diésel</div>
                    </div>
                  </div>
                </div>
                <div className={styles.catalogoNotice}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flex: "none",
                    }}
                  />
                  Consulta enviada → entró como lead en tu CRM
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`} style={{ maxWidth: "none" }}>
        <div className={styles.wrap}>
          <div className={styles.integracionesGrid}>
            <Reveal>
              <div className={styles.integracionesCol}>
                <div className={styles.kicker}>INTEGRACIONES</div>
                <h2 className="disp">Tus canales, una sola bandeja.</h2>
                <p>
                  Cada consulta entra al mismo lugar con el vehículo y el canal de origen ya
                  cargados. Nada se pierde en un chat.
                </p>
              </div>
            </Reveal>
            <Reveal delayMs={100}>
              <div className={styles.canalesGrid}>
                {CANALES.map((c) => (
                  <div key={c.name} className={styles.canalCard}>
                    {c.logo ? (
                      <span className={styles.canalLogo}>
                        <Image src={c.logo} alt={c.name} width={44} height={16} />
                      </span>
                    ) : (
                      <span
                        className={styles.canalDot}
                        style={{ background: c.color, boxShadow: `0 0 12px ${c.color}` }}
                      />
                    )}
                    <div>
                      <div className={styles.name}>{c.name}</div>
                      <div className={styles.note}>{c.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="precios" className={styles.section}>
        <PrecioSection />
      </section>

      <section className={styles.section}>
        <Reveal>
          <div className={styles.seguridadHead}>
            <div className={styles.k}>SEGURIDAD</div>
            <div className={styles.t}>Los datos de tu agencia son solo tuyos.</div>
          </div>
        </Reveal>
        <div className={styles.seguridadGrid}>
          {SEGURIDAD.map((s, i) => (
            <Reveal key={s.title} delayMs={i * 60}>
              <div className={styles.seguridadCard}>
                <div className={styles.title}>{s.title}</div>
                <div className={styles.desc}>{s.desc}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Reveal>
          <div className={styles.ctaCard}>
            <div className={styles.ctaGlow} />
            <div className={styles.ctaCopy}>
              <h2 className="disp">Te mostramos la plataforma con tu propio stock.</h2>
              <p>Cargamos algunos de tus autos y lo ves funcionando con tu operación real, no con datos de ejemplo.</p>
            </div>
            <div className={styles.ctaAction}>
              <a className={styles.btnGlow} href="/signup">
                Pedí tu demo →
              </a>
              <div className={styles.ctaNote}>Respondemos el mismo día hábil</div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>
              <Image src="/logo-rodado.png" alt="Rodado" width={64} height={64} />
            </div>
            <div className="disp" style={{ fontSize: 15, fontWeight: 700 }}>
              Rodado
            </div>
          </div>
          <div className={styles.tagline}>La plataforma comercial para concesionarias argentinas</div>
          <div className={styles.footerLinks}>
            <a href="#plataforma">Plataforma</a>
            <a href="#precios">Precios</a>
            <a href="/signup">Contacto</a>
          </div>
        </div>
      </footer>
    </>
  );
}

function TabsDemo() {
  const [tab, setTab] = useState(0);
  const active = TABS[tab];

  return (
    <>
      <Reveal>
        <div className={styles.tabsHead}>
          <div className={styles.sectionHead} style={{ marginBottom: 0 }}>
            <div className={styles.kicker}>EL PANEL POR DENTRO</div>
            <h2 className="disp">Mirá cómo se ve tu operación.</h2>
          </div>
          <div className={styles.tabsSwitch}>
            {TABS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                className={`${styles.tabBtn} ${i === tab ? styles.active : ""}`}
                onClick={() => setTab(i)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delayMs={80}>
        <div className={styles.tabFrame}>
          <div className={styles.mockTitlebar}>
            <div className={styles.mockDots}>
              <span />
              <span />
              <span />
            </div>
            <div className={styles.mockUrl} style={{ background: "transparent", border: "none" }}>
              {active.url}
            </div>
          </div>
          <div className={styles.tabBody}>
            <div className={styles.tabCopy}>
              <h3>{active.title}</h3>
              <p>{active.desc}</p>
              <div className={styles.tabBullets}>
                {active.bullets.map((b) => (
                  <div key={b} className={styles.tabBullet}>
                    <span className={styles.tabCheck}>✓</span>
                    {b}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.tabPanel}>
              <div className={styles.tabPanelLabel}>{active.panelLabel}</div>
              {active.rows.map((r) => (
                <div key={r.a} className={styles.tabRow}>
                  <div className={styles.tabRowIcon} />
                  <div style={{ minWidth: 0 }}>
                    <div className={styles.a}>{r.a}</div>
                    <div className={styles.b}>{r.b}</div>
                  </div>
                  <div className={styles.c}>{r.c}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </>
  );
}

function PrecioSection() {
  const [autos, setAutos] = useState(40);
  const rec = autos <= 25 ? 0 : autos <= 80 ? 1 : 2;
  const sucursales = autos <= 25 ? "1 sucursal" : autos <= 80 ? "1 a 3 sucursales" : "varias sucursales";
  const recomendado = ["Núcleo", "Agencia", "Multisucursal"][rec];

  return (
    <>
      <Reveal>
        <div className={styles.sectionHead}>
          <div className={styles.kicker}>PLANES</div>
          <h2 className="disp">Empezás por el núcleo y sumás módulos.</h2>
          <p>
            Precios de referencia por mes. El valor final depende de la cantidad de sucursales y
            módulos, y lo cerramos en la demo.
          </p>
        </div>
      </Reveal>

      <Reveal delayMs={60}>
        <div className={styles.priceSlider}>
          <div className={styles.priceSliderLabel}>
            <div className={styles.k}>TU AGENCIA HOY</div>
            <div className={styles.v}>
              {autos} autos en stock · {sucursales}
            </div>
          </div>
          <input
            type="range"
            min={5}
            max={150}
            step={5}
            value={autos}
            onChange={(e) => setAutos(Number(e.target.value))}
            className={styles.priceRange}
          />
          <div className={styles.priceRecommend}>
            Te recomendamos
            <span className={styles.priceRecommendBadge}>{recomendado}</span>
          </div>
        </div>
      </Reveal>

      <div className={styles.planesGrid}>
        {PLANES_BASE.map((p, i) => {
          const featured = i === rec;
          return (
            <Reveal key={p.name} delayMs={i * 80}>
              <div className={`${styles.planCard} ${featured ? styles.featured : ""}`}>
                <div className={styles.planNameRow}>
                  <div className={styles.name} style={{ color: featured ? "#f7d3a1" : "var(--ink)" }}>
                    {p.name}
                  </div>
                  {featured && <span className={styles.planBadge}>RECOMENDADO</span>}
                </div>
                <div style={{ fontSize: 12, color: "#7d848d" }}>
                  {p.nota}
                </div>
                <div className={styles.planPriceRow}>
                  <div className={styles.planPrice} style={{ color: featured ? "#f7d3a1" : "var(--ink)" }}>
                    {p.precio}
                  </div>
                  <div className={styles.planPer}>/ mes</div>
                </div>
                <div className={styles.planNote}>pesos + IVA · sin costo de instalación</div>
                <div className={styles.planDesc} style={{ color: featured ? "#b6a891" : "#949ba3" }}>
                  {p.desc}
                </div>
                <div className={styles.planDivider} />
                <div className={styles.planItems}>
                  {p.items.map((it) => (
                    <div key={it} className={styles.planItem} style={{ color: featured ? "#e0d6c7" : "#c3c9cf" }}>
                      <span className={styles.planCheck}>✓</span>
                      {it}
                    </div>
                  ))}
                </div>
                <a
                  href="/signup"
                  className={`${styles.planBtn} ${featured ? styles.featuredBtn : ""}`}
                >
                  Pedí tu demo →
                </a>
              </div>
            </Reveal>
          );
        })}
      </div>

      <Reveal delayMs={120}>
        <div className={styles.matrixCard}>
          <div className={styles.matrixHead}>
            <div>QUÉ INCLUYE CADA PLAN</div>
            <div className={styles.center}>NÚCLEO</div>
            <div className={`${styles.center} ${styles.featured}`}>AGENCIA</div>
            <div className={styles.center}>MULTISUCURSAL</div>
          </div>
          {MATRIZ.map(([label, c1, c2, c3]) => (
            <div key={label} className={styles.matrixRow}>
              <div className={styles.label}>{label}</div>
              <div className={styles.cell} style={{ color: matrixCellColor(c1) }}>
                {c1}
              </div>
              <div className={styles.cell} style={{ color: c2 === "—" ? "#4d545b" : c2 === "✓" ? "var(--success-text)" : "var(--accent-light)", fontWeight: 600 }}>
                {c2}
              </div>
              <div className={styles.cell} style={{ color: matrixCellColor(c3) }}>
                {c3}
              </div>
            </div>
          ))}
          <div className={styles.matrixFoot}>
            <span>Sin costo de instalación</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Migración de tu stock incluida</span>
            <span style={{ opacity: 0.4 }}>·</span>
            <span>Podés sumar módulos en cualquier momento</span>
          </div>
        </div>
      </Reveal>
    </>
  );
}
