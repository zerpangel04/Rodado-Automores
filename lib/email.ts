import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "Rodado <onboarding@resend.dev>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: "Restablecer tu contraseña — Rodado",
    text: `Recibimos un pedido para restablecer tu contraseña.\n\nEntrá a este link para elegir una nueva (válido por 1 hora):\n${resetUrl}\n\nSi vos no pediste esto, podés ignorar este email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Recibimos un pedido para restablecer tu contraseña.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block; background:#14161c; color:#fff; padding:11px 18px; border-radius:8px; text-decoration:none; font-weight:600;">
            Elegir nueva contraseña
          </a>
        </p>
        <p style="color:#63676a; font-size:13px;">Este link vence en 1 hora. Si vos no pediste esto, podés ignorar este email.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log("Email de reset enviado, id:", data?.id);
}

export async function sendLoginVerificationEmail(to: string, codigo: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject: `${codigo} es tu código de verificación — Rodado`,
    text: `Estamos verificando un inicio de sesión desde un dispositivo nuevo.\n\nTu código de verificación es: ${codigo}\n\nVence en 10 minutos. Si no fuiste vos, ignorá este email y te recomendamos cambiar tu contraseña.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Estamos verificando un inicio de sesión desde un dispositivo nuevo.</p>
        <p style="text-align:center; margin: 28px 0;">
          <span style="display:inline-block; background:#14161c; color:#f0a13c; font-size:28px; font-weight:700; letter-spacing:6px; padding:14px 22px; border-radius:10px;">
            ${codigo}
          </span>
        </p>
        <p style="color:#63676a; font-size:13px;">Este código vence en 10 minutos. Si no fuiste vos, ignorá este email y te recomendamos cambiar tu contraseña.</p>
      </div>
    `,
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
}: {
  email: string;
  count: number;
  windowHoras: number;
}) {
  const alertTo = process.env.SECURITY_ALERT_EMAIL;
  if (!alertTo) {
    console.warn(
      "SECURITY_ALERT_EMAIL no está configurado — no se pudo avisar de actividad sospechosa en la cuenta",
      email
    );
    return;
  }

  const momento = new Date().toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    dateStyle: "short",
    timeStyle: "short",
  });

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: alertTo,
    subject: `⚠ Actividad sospechosa de login — ${email}`,
    text: `La cuenta ${email} se bloqueó por intentos fallidos de login ${count} veces en las últimas ${windowHoras} horas (último bloqueo: ${momento}).\n\nEsto puede indicar un intento de fuerza bruta contra esta cuenta. El login sigue protegido por el límite normal de intentos — este email es solo un aviso.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p><strong>⚠ Actividad sospechosa de login</strong></p>
        <p>La cuenta <strong>${email}</strong> se bloqueó por intentos fallidos de login <strong>${count} veces</strong> en las últimas ${windowHoras} horas.</p>
        <p style="color:#63676a; font-size:13px;">Último bloqueo: ${momento}.</p>
        <p style="color:#63676a; font-size:13px;">Esto puede indicar un intento de fuerza bruta contra esta cuenta. El login sigue protegido por el límite normal de intentos — este email es solo un aviso.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log("Alerta de actividad sospechosa enviada, id:", data?.id);
}
