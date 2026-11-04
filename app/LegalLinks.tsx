import styles from "./auth.module.css";

// Links legales chicos para las pantallas de login y signup.
export function LegalLinks({ className = "" }: { className?: string }) {
  return (
    <div className={`${styles.legalLinks} ${className}`}>
      <a href="/politica-privacidad">Privacidad</a>
      <a href="/terminos-servicio">Términos</a>
    </div>
  );
}
