// Cuadradito con el logo de la agencia, o la inicial de su nombre como
// fallback si todavía no subió uno. Reusado en el sidebar del panel y en
// el header del catálogo público — el className que recibe (workspaceMark,
// agencyMark, etc.) ya trae el tamaño/radio/fondo de cada lugar; acá solo
// decidimos qué contenido va adentro.
export function AgencyMark({
  nombre,
  logoUrl,
  className,
}: {
  nombre: string;
  logoUrl?: string | null;
  className: string;
}) {
  if (logoUrl) {
    return (
      <div className={className} style={{ background: "none", boxShadow: "none", overflow: "hidden", padding: 0 }}>
        <img
          src={logoUrl}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "inherit" }}
        />
      </div>
    );
  }

  return <div className={className}>{nombre.trim().charAt(0).toUpperCase() || "?"}</div>;
}
