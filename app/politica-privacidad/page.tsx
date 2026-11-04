import type { Metadata } from "next";
import { LegalShell } from "../LegalShell";

export const metadata: Metadata = {
  title: "Política de privacidad — Rodado",
  description: "Qué datos maneja Rodado, para qué los usa y cómo podés pedir que se borren.",
};

const SOPORTE = "soporte@rodado.com.ar";

export default function PoliticaPrivacidadPage() {
  return (
    <LegalShell
      titulo="Política de privacidad"
      bajada="Qué datos maneja Rodado, para qué los usa, con quién los comparte y cómo podés pedir que se borren."
      actualizado="4 de noviembre de 2026"
    >
      <h2>1. Quiénes somos</h2>
      <p>
        Rodado es un software de gestión comercial para concesionarias de Argentina. Cada agencia
        tiene su propia cuenta, donde administra stock, consultas, clientes y ventas. Esta política
        se basa en la Ley 25.326 de Protección de los Datos Personales.
      </p>
      <p>
        El responsable del tratamiento de los datos es Angel David Zerpa Menezes, persona humana que
        opera Rodado a título personal, sin una sociedad constituida. Podés contactarlo en{" "}
        <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a>.
      </p>
      <p>
        Hay dos situaciones distintas. Para los datos de las cuentas de la agencia y sus usuarios,
        Rodado decide cómo se tratan. Para los datos de clientes y consultas que carga o recibe cada
        agencia, la responsable es esa agencia y Rodado los procesa por cuenta de ella.
      </p>

      <h2>2. Qué datos manejamos</h2>
      <ul>
        <li>
          <strong>Cuenta de usuarios de la agencia</strong> (dueño, administrador, vendedor): nombre,
          email, rol y contraseña. La contraseña se guarda hasheada, nunca en texto legible.
        </li>
        <li>
          <strong>Login con Google</strong>: Google nos comparte tu nombre, email y foto de perfil.
          Ver el punto 4.
        </li>
        <li>
          <strong>Leads y clientes</strong> de cada agencia: nombre, teléfono o email, la consulta
          realizada y su seguimiento. Pueden cargarlos los usuarios de la agencia o llegar desde el
          catálogo público, por el formulario o el asistente de IA.
        </li>
        <li>
          <strong>Vehículos y operación</strong>: stock, fotos, documentación, sucursales, ventas y
          comisiones.
        </li>
        <li>
          <strong>Datos técnicos</strong>: la dirección IP, que usamos de forma temporal para limitar
          abusos en el catálogo público, y las cookies del punto 9.
        </li>
      </ul>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Prestar el servicio: dar acceso al panel y mostrar a cada agencia su información.</li>
        <li>Proteger las cuentas, por ejemplo con códigos de verificación al iniciar sesión.</li>
        <li>Enviar emails del servicio, como recupero de contraseña y avisos de seguridad.</li>
        <li>Dar soporte cuando la agencia o un usuario nos lo pide.</li>
        <li>Hacer funcionar el asistente de IA y las integraciones que la agencia decida activar.</li>
      </ul>
      <p>No usamos estos datos para publicidad ni para enviar comunicaciones de terceros.</p>

      <h2>4. Datos de tu cuenta de Google</h2>
      <p>
        Si entrás con Google, usamos tu nombre y tu email para crear tu cuenta o identificarte. La
        foto de perfil no se guarda en nuestra base de datos. No accedemos a tu Gmail, tu Drive, tus
        contactos ni a ningún otro dato de tu cuenta de Google.
      </p>
      <p>
        El uso de la información recibida de las API de Google se ajusta a la{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">
          Política de datos de usuario de los servicios de API de Google
        </a>
        , incluidos los requisitos de uso limitado.
      </p>

      <h2>5. Cada agencia tiene sus datos separados</h2>
      <p>
        Los datos de una agencia están aislados de los del resto: una agencia no puede ver la
        información de otra. Dentro de cada agencia, el acceso depende del rol de cada usuario. El
        personal de Rodado accede a los datos de una cuenta solo cuando hace falta para dar soporte,
        resolver un problema técnico o cumplir una obligación legal.
      </p>

      <h2>6. No vendemos tus datos</h2>
      <p>
        Rodado no vende datos personales a terceros. Solo los compartimos con estos proveedores, que
        los procesan en nuestro nombre para que el servicio funcione:
      </p>
      <ul>
        <li>
          <strong>Vercel</strong>: alojamiento de la aplicación.
        </li>
        <li>
          <strong>Supabase</strong>: alojamiento de la base de datos y de archivos, como fotos de
          vehículos y logos.
        </li>
        <li>
          <strong>Resend</strong>: envío de emails. Recibe la dirección del destinatario y el
          contenido del mensaje.
        </li>
        <li>
          <strong>Anthropic</strong>: procesa las conversaciones con el asistente de IA. En el
          asistente del catálogo recibe los mensajes del visitante y el stock de la agencia. En el
          asistente del panel recibe los mensajes del usuario, su nombre y rol, y datos de uso de la
          cuenta. Te recomendamos no escribir información sensible en esos chats.
        </li>
        <li>
          <strong>Mercado Libre</strong>: solo si la agencia activa la integración. Recibe los datos
          de los vehículos que se publican. La agencia puede desconectarla desde el panel.
        </li>
      </ul>
      <p>También podemos revelar datos si una ley o una autoridad competente nos lo exige.</p>

      <h2>7. Dónde se guardan</h2>
      <p>
        Nuestra base de datos se aloja en Estados Unidos, y algunos proveedores procesan datos fuera
        de Argentina. Al usar Rodado, aceptás que los datos se transfieran y se procesen allí para
        prestar el servicio.
      </p>

      <h2>8. Cuánto tiempo los conservamos</h2>
      <p>
        Conservamos los datos mientras la cuenta de la agencia esté activa. Cuando se cancela, los
        eliminamos dentro de los 30 días, salvo que una ley nos obligue a conservar algo por más
        tiempo. Pueden permanecer un tiempo adicional en copias de seguridad hasta que se renueven.
      </p>
      <p>
        Las conversaciones con el asistente de IA no se guardan en nuestra base de datos. Si una
        conversación del catálogo termina en una consulta, sí queda registrado el lead con los datos
        que dejó la persona.
      </p>

      <h2>9. Cookies</h2>
      <p>
        Usamos solo las cookies necesarias para mantener tu sesión iniciada y para recordar un
        dispositivo de confianza durante hasta 90 días, así no te pedimos un código en cada ingreso.
        No usamos cookies publicitarias.
      </p>

      <h2>10. Tus derechos y cómo pedir que se borren tus datos</h2>
      <p>
        Podés pedir acceder a tus datos, corregirlos, actualizarlos o eliminarlos. Escribinos a{" "}
        <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a> desde el email de tu cuenta, indicando qué querés
        hacer. Te respondemos dentro de los plazos que fija la ley.
      </p>
      <ul>
        <li>
          <strong>Si sos usuario de una agencia</strong>, podemos eliminar tu cuenta. Si querés dar de
          baja toda la agencia, el pedido tiene que hacerlo su dueño.
        </li>
        <li>
          <strong>Si sos cliente o dejaste una consulta en una agencia</strong>, esa agencia es la
          responsable de tus datos, así que lo mejor es contactarla directamente. Si no podés, o si no
          te responde, escribinos y te ayudamos a canalizar el pedido.
        </li>
      </ul>
      <p>
        El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los
        mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un
        interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº
        25.326. La Agencia de Acceso a la Información Pública, Órgano de Control de la Ley Nº 25.326,
        tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten
        afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección
        de datos personales.
      </p>

      <h2>11. Cambios en esta política</h2>
      <p>
        Si cambiamos esta política, publicamos la versión nueva en esta página con su fecha. Si el
        cambio es importante, también lo avisamos por email a las cuentas activas.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Por cualquier duda sobre tus datos, escribinos a <a href={`mailto:${SOPORTE}`}>{SOPORTE}</a>.
      </p>
    </LegalShell>
  );
}
