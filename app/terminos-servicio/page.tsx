import type { Metadata } from "next";
import { LegalShell } from "../LegalShell";

export const metadata: Metadata = {
  title: "Términos del servicio — Rodado",
  description: "Las condiciones para usar Rodado: planes, pagos, cancelación y datos de tu agencia.",
};

const SOPORTE = "soporte@rodado.com.ar";

export default function TerminosServicioPage() {
  return (
    <LegalShell
      titulo="Términos del servicio"
      bajada="Las condiciones para usar Rodado: planes, pagos, cancelación y qué pasa con los datos de tu agencia."
      actualizado="4 de noviembre de 2026"
    >
      <h2>1. Qué es Rodado</h2>
      <p>
        Rodado es un software online de gestión comercial para concesionarias. Permite administrar
        stock, consultas, clientes y ventas, publicar un catálogo y conectar integraciones como
        Mercado Libre. Rodado es operado por Angel David Zerpa Menezes, persona humana que presta el
        servicio a título personal, sin una sociedad constituida. Al crear una cuenta o usar el
        servicio, aceptás estos términos en nombre tuyo y de tu agencia.
      </p>

      <h2>2. Tu cuenta</h2>
      <ul>
        <li>Tenés que dar datos reales y mantenerlos actualizados.</li>
        <li>
          Sos responsable de cuidar tus credenciales y de lo que hagan los usuarios que agregues a tu
          agencia.
        </li>
        <li>
          No podés usar Rodado para actividades ilegales, para intentar acceder a datos de otras
          agencias ni para afectar el funcionamiento del servicio.
        </li>
        <li>
          Tu agencia es responsable de los datos que carga, incluidos los de sus clientes, y de tener
          una base legal para tratarlos. La <a href="/politica-privacidad">Política de privacidad</a>{" "}
          explica cómo los procesamos.
        </li>
      </ul>

      <h2>3. Planes y precios</h2>
      <p>
        Los planes, sus límites y sus precios de referencia están en la{" "}
        <a href="/#precios">página de precios</a>. El valor final puede depender de la operación de
        tu agencia y te lo confirmamos antes de contratar. Los precios se expresan en dólares, y el
        equivalente en pesos se calcula con la cotización oficial, más IVA.
      </p>
      <p>
        Podemos actualizar los precios. Si cambia lo que paga tu agencia, te avisamos por email con al
        menos 30 días de anticipación. Para cambiar de plan, escribinos a{" "}
        <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a>.
      </p>

      <h2>4. Pagos y falta de pago</h2>
      <p>
        El servicio se abona por mes, en la forma que acordemos con tu agencia. Si un pago se atrasa,
        te avisamos por email y tenés 15 días para regularizarlo. Si después de ese plazo sigue
        pendiente, podemos suspender el acceso a la cuenta. La suspensión no borra tus datos, y el
        acceso vuelve cuando se regulariza el pago.
      </p>
      <p>
        Si la cuenta sigue suspendida 30 días después, podemos darla por cancelada y se aplica el
        punto 6.
      </p>

      <h2>5. Tus datos son tuyos</h2>
      <p>
        Los datos que carga tu agencia, como stock, clientes, consultas y ventas, le pertenecen a tu
        agencia. Rodado no adquiere ningún derecho sobre ellos y solo los usa para prestar el
        servicio.
      </p>
      <p>
        Podés exportar tus ventas desde el panel en formato CSV. Para exportar el resto, como stock y
        clientes, escribinos a <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a> y te los enviamos en un
        formato estándar sin costo.
      </p>

      <h2>6. Cancelación</h2>
      <p>
        Podés cancelar cuando quieras escribiendo a <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a> desde
        el email del dueño de la cuenta, sin penalidad. La cancelación se aplica al final del período
        ya abonado, y ese período no se reembolsa.
      </p>
      <p>
        Después de cancelar, tenés 30 días para pedir la exportación de tus datos. Pasado ese plazo
        los eliminamos, como explica la <a href="/politica-privacidad">Política de privacidad</a>.
      </p>
      <p>
        También podemos cancelar una cuenta que incumpla estos términos de forma grave, avisando por
        email siempre que sea posible.
      </p>

      <h2>7. Disponibilidad, IA y servicios de terceros</h2>
      <p>
        Trabajamos para que Rodado funcione de forma continua, pero no podemos garantizar que nunca
        tenga interrupciones o errores. Podemos cambiar o mejorar funciones con el tiempo.
      </p>
      <p>
        Las funciones de IA, como los asistentes y la tasación, pueden equivocarse, y la tasación es
        una estimación, no un dato de mercado en vivo. Revisá sus resultados antes de tomar
        decisiones. Algunas funciones dependen de terceros, como Mercado Libre, y pueden verse
        afectadas por cambios o fallas en esos servicios.
      </p>

      <h2>8. Limitación de responsabilidad</h2>
      <p>
        El servicio se ofrece tal como está. Rodado no responde por lucro cesante, ventas perdidas ni
        daños indirectos derivados del uso del servicio o de no poder usarlo. La responsabilidad total
        de Rodado frente a tu agencia se limita a lo que esta haya pagado en los 3 meses anteriores al
        hecho que originó el reclamo.
      </p>
      <p>Nada en estos términos limita los derechos que, según la ley argentina, no pueden limitarse.</p>

      <h2>9. Cambios en estos términos</h2>
      <p>
        Si cambiamos estos términos, publicamos la versión nueva en esta página con su fecha. Si el
        cambio es importante, lo avisamos por email con al menos 30 días de anticipación. Si seguís
        usando el servicio después de esa fecha, se entiende que aceptás los cambios.
      </p>

      <h2>10. Ley aplicable</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Ante cualquier conflicto,
        primero intentaremos resolverlo de buena fe. Si no es posible, intervendrán los tribunales
        ordinarios de la Ciudad Autónoma de Buenos Aires, salvo que la ley establezca otra
        jurisdicción.
      </p>

      <h2>11. Contacto</h2>
      <p>
        Por cualquier consulta sobre estos términos, escribinos a{" "}
        <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a>.
      </p>
    </LegalShell>
  );
}
