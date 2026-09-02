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
