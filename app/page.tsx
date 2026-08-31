import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import styles from "./landing.module.css";
import { Reveal } from "./Reveal";
import { LandingMobileMenu } from "./LandingMobileMenu";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/panel");

  return (
    <>
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
            <a href="#ia">IA</a>
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

      <section className={styles.hero} id="plataforma">
        <div className={styles.wrap}>
          <div className={styles.eyebrow}>● Stock, leads y ventas en un solo lugar</div>
          <h1 className="disp">
            La plataforma comercial
            <br />
            para tu <span className={styles.hl}>concesionaria.</span>
          </h1>
          <p className={styles.sub}>
            Stock, leads de todos tus canales y financiación, conectados en un solo sistema —
            pensado para agencias multimarca argentinas.
          </p>
          <div className={styles.heroCtas}>
            <a className={styles.btnGlow} href="/signup">
              Pedí tu demo →
            </a>
            <a className={styles.btnOutline} href="#modulos">
              Ver la plataforma
            </a>
          </div>

          <div className={styles.mockFrame}>
            <div className={styles.mockBody}>
              <div className={styles.mockKpis}>
                <div className={styles.mockKpi}>
                  <div className={styles.l}>Stock activo</div>
                  <div className={`${styles.v} disp`}>214</div>
                </div>
                <div className={styles.mockKpi}>
                  <div className={styles.l}>Leads hoy</div>
                  <div className={`${styles.v} disp`} style={{ color: "var(--magenta)" }}>
                    38
                  </div>
                </div>
                <div className={styles.mockKpi}>
                  <div className={styles.l}>Ventas del mes</div>
                  <div className={`${styles.v} disp`} style={{ color: "var(--success)" }}>
                    19
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section} id="modulos">
        <div className={styles.wrap}>
          <div className={styles.sectionHead}>
            <div className={styles.kicker}>La plataforma</div>
            <h2 className="disp">Un núcleo. Sumás los módulos que tu agencia necesita.</h2>
            <p>Todo comparte el mismo dato — cargás el auto una vez y corre por todo el sistema.</p>
          </div>
          <div className={styles.modGrid}>
            <Reveal delayMs={0}>
              <div className={styles.mcard}>
                <h4 className="disp">e-Stock</h4>
                <p>Inventario en tiempo real, siempre actualizado.</p>
              </div>
            </Reveal>
            <Reveal delayMs={60}>
              <div className={styles.mcard}>
                <h4 className="disp">e-CRM</h4>
                <p>Cliente y vehículo en una sola pantalla.</p>
              </div>
            </Reveal>
            <Reveal delayMs={120}>
              <div className={styles.mcard}>
                <div className={`${styles.brandChip} ${styles.brandChipWide}`}>
                  <Image
                    src="/logos/mercadolibre.svg"
                    alt="Mercado Libre"
                    width={72}
                    height={30}
                  />
                </div>
                <h4 className="disp">Multipublicador</h4>
                <p>Publicá en Mercado Libre y más canales a la vez.</p>
              </div>
            </Reveal>
            <Reveal delayMs={180}>
              <div className={`${styles.mcard} ${styles.comingSoon}`}>
                <span className={styles.comingSoonBadge}>Próximamente</span>
                <div className={styles.brandChip}>
                  <Image src="/logos/whatsapp.svg" alt="WhatsApp" width={20} height={20} />
                </div>
                <h4 className="disp">WhatsApp</h4>
                <p>Catálogo sincronizado, todo en un solo lugar.</p>
              </div>
            </Reveal>
            <Reveal delayMs={240}>
              <div className={styles.mcard} id="ia">
                <h4 className="disp">Financiación</h4>
                <p>Simulador de cuota en cada ficha.</p>
              </div>
            </Reveal>
            <Reveal delayMs={300}>
              <div className={styles.mcard}>
                <h4 className="disp">Reportes</h4>
                <p>KPIs reales de stock, ventas y leads.</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className={styles.section} id="precios">
        <div className={styles.wrap}>
          <div className={styles.priceStrip}>
            <div>
              <h3 className="disp">Te mostramos la plataforma con tu propio stock.</h3>
              <p>El 70% de las agencias que ven la demo empiezan en menos de una semana.</p>
            </div>
            <a className={styles.btnGlow} href="/signup">
              Pedí tu demo →
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>
              <Image src="/logo-rodado.png" alt="Rodado" width={64} height={64} />
            </div>
            <div className="disp" style={{ fontSize: 16, fontWeight: 700 }}>
              Rodado
            </div>
          </div>
          <p>La plataforma comercial para concesionarias argentinas</p>
        </div>
      </footer>
    </>
  );
}
