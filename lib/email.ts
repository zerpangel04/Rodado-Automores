import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Rodado <onboarding@resend.dev>";
const EMAIL_LOGO_URL = "https://www.rodado.com.ar/email/rodado-logo.png";
const APP_URL = "https://www.rodado.com.ar";

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

function primerNombre(nombre: string) {
  return nombre.trim().split(/\s+/)[0] || nombre;
}

function formatFechaHoraAR(date: Date) {
  const formateada = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${formateada} (ART)`;
}

// Layout base compartido por los 4 templates (header con logo, barra
// ámbar, footer) — copiado del diseño en
// design-reference/Rediseño emails Rodado/emails/*.html. Cada email arma
// solo su contenido central; el resto queda idéntico entre los cuatro
// para no repetir ~40 líneas de markup de tabla por archivo.
function emailShellOpen(preheader: string, title: string) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>${title}</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style type="text/css">
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;}
  a{color:#f0a13c;}
  @media only screen and (max-width:620px){
    .wrap{width:100% !important;}
    .pad{padding-left:22px !important;padding-right:22px !important;}
    .code{font-size:34px !important;letter-spacing:8px !important;}
    .stack{display:block !important;width:100% !important;padding:0 0 12px 0 !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#0b0d10;">
<div style="display:none;font-size:1px;color:#0b0d10;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0d10" style="background-color:#0b0d10;">
  <tr>
    <td align="center" style="padding:32px 12px;">
      <table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#171b21" style="width:600px;max-width:600px;background-color:#171b21;border:1px solid #2b323c;border-radius:14px;">
        <tr>
          <td bgcolor="#0b0d10" style="background-color:#0b0d10;padding:24px 32px;border-radius:14px 14px 0 0;border-bottom:1px solid #2b323c;">
            <img src="${EMAIL_LOGO_URL}" width="150" alt="Rodado" style="display:block;width:150px;max-width:150px;height:auto;border:0;" />
          </td>
        </tr>
        <tr><td bgcolor="#f0a13c" height="3" style="background-color:#f0a13c;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr>
        <tr>
          <td class="pad" style="padding:36px 40px 40px;">`;
}

function emailShellClose() {
  return `
          </td>
        </tr>
        <tr>
          <td class="pad" bgcolor="#0b0d10" style="background-color:#0b0d10;padding:26px 40px 30px;border-top:1px solid #2b323c;border-radius:0 0 14px 14px;">
            <p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:20px;color:#8b94a1;">¿Necesitás una mano? Escribinos por <a href="https://wa.me/541130261955" style="color:#f0a13c;text-decoration:underline;">WhatsApp</a>.</p>
            <p style="margin:0 0 14px;font-family:${FONT};font-size:12px;line-height:18px;color:#98a1ad;">Este mail se envía de forma automática: por favor no respondas a esta dirección.</p>
            <p style="margin:0 0 14px;font-family:${FONT};font-size:12px;line-height:18px;color:#98a1ad;">
              <a href="https://www.instagram.com/rodado.app" style="color:#8b94a1;text-decoration:none;">Instagram</a>
              &nbsp;·&nbsp;<a href="${APP_URL}" style="color:#8b94a1;text-decoration:none;">rodado.com.ar</a>
            </p>
            <p style="margin:0;font-family:${FONT};font-size:11px;line-height:16px;color:#8b94a1;">Rodado · Gestión para concesionarias · Buenos Aires, Argentina</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function eyebrow(texto: string) {
  return `<p style="margin:0 0 10px;font-family:${FONT};font-size:12px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;color:#f0a13c;font-weight:700;">${texto}</p>`;
}

function h1(texto: string) {
  return `<h1 style="margin:0 0 18px;font-family:${FONT};font-size:24px;line-height:32px;font-weight:700;color:#ffffff;">${texto}</h1>`;
}

function bodyText(html: string, small = false) {
  const size = small ? "font-size:13px;line-height:20px;" : "";
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:24px;color:#b9c0ca;${size}">${html}</p>`;
}

function ctaButton(href: string, texto: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 24px;"><tr><td>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;">
                    <tr>
                      <td bgcolor="#f0a13c" style="border-radius:8px;border:1px solid #f0a13c;" align="center">
                        <a href="${href}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:16px;font-weight:700;line-height:20px;color:#0b0d10;text-decoration:none;">${texto}</a>
                      </td>
                    </tr>
                  </table>
            </td></tr></table>`;
}

function detailsTable(rows: Array<[string, string]>) {
  const filas = rows
    .map(
      ([label, value]) => `<tr>
                          <td style="padding:10px 0;font-family:${FONT};font-size:13px;line-height:18px;color:#8b94a1;" width="40%">${label}</td>
                          <td style="padding:10px 0;font-family:${FONT};font-size:14px;line-height:18px;color:#ffffff;font-weight:600;" align="right">${value}</td>
                        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1216" style="border:1px solid #2b323c;border-radius:8px;">
                    <tr><td style="padding:6px 20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${filas}
                      </table>
                    </td></tr>
                  </table>`;
}

export async function sendPasswordResetEmail(to: string, nombre: string, resetUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const linkDisplay = resetUrl.replace(/^https?:\/\//, "");

  const html = emailShellOpen(
    "Creá una contraseña nueva. El enlace vence en 60 minutos.",
    "Restablecé tu contraseña · Rodado"
  ) +
    eyebrow("Seguridad de la cuenta") +
    h1("Restablecé tu contraseña") +
    bodyText(
      `Hola ${primerNombre(nombre)}: recibimos un pedido para cambiar la contraseña de tu cuenta de Rodado. Hacé clic en el botón y elegí una nueva.`
    ) +
    ctaButton(resetUrl, "Crear contraseña nueva") +
    bodyText(`El enlace vence en <strong style="color:#ffffff;">60 minutos</strong> y se puede usar una sola vez.`) +
    bodyText(`Si no pediste este cambio, ignorá el mail: tu contraseña actual sigue funcionando.`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:26px;border-top:1px solid #2b323c;"><tr><td style="padding-top:18px;">
              <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#b9c0ca;">¿No te funciona el botón? Copiá y pegá esta dirección en el navegador:<br /><a href="${resetUrl}" style="color:#f0a13c;word-break:break-all;">${linkDisplay}</a></p>
            </td></tr></table>` +
    emailShellClose();

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Restablecer tu contraseña — Rodado",
    text: `Hola ${primerNombre(nombre)}: recibimos un pedido para restablecer tu contraseña.\n\nEntrá a este link para elegir una nueva (válido por 1 hora):\n${resetUrl}\n\nSi vos no pediste esto, podés ignorar este email.`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log("Email de reset enviado, id:", data?.id);
}

export async function sendLoginVerificationEmail(to: string, codigo: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const momento = formatFechaHoraAR(new Date());

  const html = emailShellOpen(
    `Código ${codigo} para verificar tu dispositivo nuevo.`,
    "Tu código de verificación · Rodado"
  ) +
    eyebrow("Dispositivo nuevo") +
    h1("Verificá tu dispositivo") +
    bodyText(
      "Detectamos un ingreso desde un dispositivo que no reconocemos. Ingresá este código para confirmar que sos vos:"
    ) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1216" style="margin:26px 0 22px;background-color:#0f1216;border:1px solid #2b323c;border-radius:10px;">
              <tr><td align="center" style="padding:28px 20px 30px;">
                <p class="code" style="margin:0;font-family:${FONT};font-size:44px;line-height:52px;font-weight:700;letter-spacing:14px;color:#f0a13c;text-indent:14px;">${codigo}</p>
                <p style="margin:12px 0 0;font-family:${FONT};font-size:13px;line-height:18px;color:#8b94a1;">Vence en 10 minutos</p>
              </td></tr>
            </table>` +
    detailsTable([["Fecha y hora", momento]]) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:22px;"><tr><td>
              <p style="margin:0;font-family:${FONT};font-size:13px;line-height:20px;color:#b9c0ca;">Nunca compartas este código. Si no intentaste iniciar sesión, cambiá tu contraseña y avisanos.</p>
            </td></tr></table>` +
    emailShellClose();

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${codigo} es tu código de verificación — Rodado`,
    text: `Estamos verificando un inicio de sesión desde un dispositivo nuevo.\n\nTu código de verificación es: ${codigo}\n\nVence en 10 minutos. Si no fuiste vos, ignorá este email y te recomendamos cambiar tu contraseña.`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log("Email de código de verificación enviado, id:", data?.id);
}

export async function sendSuspiciousActivityAlert({
  email,
  count,
  windowHoras,
  blockMinutos,
}: {
  email: string;
  count: number;
  windowHoras: number;
  blockMinutos: number;
}) {
  const alertTo = process.env.SECURITY_ALERT_EMAIL;
  if (!alertTo) {
    console.warn(
      "SECURITY_ALERT_EMAIL no está configurado — no se pudo avisar de actividad sospechosa en la cuenta",
      email
    );
    return;
  }

  const momento = formatFechaHoraAR(new Date());
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = emailShellOpen(
    `${count} bloqueos por intentos fallidos en la cuenta ${email}.`,
    "Actividad sospechosa · Rodado"
  ) +
    eyebrow("Alerta de seguridad") +
    h1("Detectamos actividad sospechosa") +
    bodyText(
      `Registramos <strong style="color:#ffffff;">${count} bloqueos por intentos fallidos de login</strong> en esta cuenta en las últimas ${windowHoras} horas.`
    ) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1216" style="margin:24px 0;background-color:#0f1216;border:1px solid #2b323c;border-left:4px solid #f0a13c;border-radius:8px;">
              <tr><td style="padding:18px 20px;">
                <p style="margin:0 0 6px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:700;color:#f0a13c;">Bloqueamos el acceso temporalmente</p>
                <p style="margin:0;font-family:${FONT};font-size:14px;line-height:21px;color:#b9c0ca;">Como medida preventiva, esta cuenta queda bloqueada por ${blockMinutos} minutos cada vez que se repiten los intentos fallidos. Nadie ingresó a la cuenta.</p>
              </td></tr>
            </table>` +
    detailsTable([
      ["Usuario afectado", email],
      ["Último bloqueo", momento],
    ]) +
    bodyText(
      "Si no reconocés estos intentos, te recomendamos que esa persona cambie su contraseña cuanto antes.",
      true
    ) +
    emailShellClose();

  const { data, error } = await resend.emails.send({
    from: FROM,
    to: alertTo,
    subject: `⚠ Actividad sospechosa de login — ${email}`,
    text: `La cuenta ${email} se bloqueó por intentos fallidos de login ${count} veces en las últimas ${windowHoras} horas (último bloqueo: ${momento}).\n\nEsto puede indicar un intento de fuerza bruta contra esta cuenta. El login sigue protegido por el límite normal de intentos — este email es solo un aviso.`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log("Alerta de actividad sospechosa enviada, id:", data?.id);
}

export async function sendWelcomeEmail(to: string, nombre: string, agenciaNombre: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const pasos: Array<[string, string, string]> = [
    ["1.", "Cargá tu primer vehículo", "Fotos, ficha técnica y precio en menos de dos minutos."],
    ["2.", "Invitá a tu equipo", "Sumá vendedores y administrativos con permisos separados."],
    ["3.", "Publicá tu stock", "Sincronizá con los portales donde ya vendés."],
  ];
  const pasosHtml = pasos
    .map(
      ([n, titulo, desc]) => `<tr>
                    <td width="34" valign="top" style="padding:14px 0;"><span style="display:inline-block;font-family:${FONT};font-size:15px;font-weight:700;color:#f0a13c;">${n}</span></td>
                    <td valign="top" style="padding:14px 0;">
                      <p style="margin:0 0 3px;font-family:${FONT};font-size:15px;line-height:21px;font-weight:600;color:#ffffff;">${titulo}</p>
                      <p style="margin:0;font-family:${FONT};font-size:14px;line-height:20px;color:#8b94a1;">${desc}</p>
                    </td>
                  </tr>`
    )
    .join("");

  const html = emailShellOpen(
    "Tu cuenta ya está lista. Cargá tu primer vehículo en dos minutos.",
    "Bienvenido a Rodado"
  ) +
    eyebrow("Tu cuenta está lista") +
    h1(`Bienvenido a Rodado, ${primerNombre(nombre)}`) +
    bodyText(
      `Ya podés gestionar el stock, las ventas y la documentación de ${agenciaNombre} desde un solo lugar. Estos son los tres pasos para arrancar:`
    ) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0f1216" style="margin:24px 0;background-color:#0f1216;border:1px solid #2b323c;border-radius:8px;">
              <tr><td style="padding:8px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                  ${pasosHtml}
                </table>
              </td></tr>
            </table>` +
    ctaButton(`${APP_URL}/login`, "Entrar al panel") +
    bodyText(
      "Si querés que te acompañemos en la puesta en marcha, respondé este mail y coordinamos una llamada de 20 minutos.",
      true
    ) +
    emailShellClose();

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Bienvenido a Rodado — tu cuenta ya está lista",
    text: `Bienvenido a Rodado, ${primerNombre(nombre)}.\n\nYa podés gestionar el stock, las ventas y la documentación de ${agenciaNombre} desde un solo lugar.\n\n1. Cargá tu primer vehículo\n2. Invitá a tu equipo\n3. Publicá tu stock\n\nEntrá al panel: ${APP_URL}/login`,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log("Email de bienvenida enviado, id:", data?.id);
}
