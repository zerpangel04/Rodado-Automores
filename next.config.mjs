const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' en script-src: el script inline de app/layout.tsx que
  // aplica el tema guardado antes del primer paint (evita flash del tema
  // equivocado) es estático, no depende de nada que un usuario envíe.
  // 'unsafe-eval' SOLO en dev: el runtime de Fast Refresh de Next usa
  // eval() para el hot-reload; en el build de producción no corre, así
  // que ahí no hace falta debilitar la política.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  // 'unsafe-inline' en style-src: React compila los style={{...}} inline a
  // atributos style reales — sin esto se rompe media tarjeta del panel.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  // dolarapi.com: la cotización del dólar en el sidebar se pide desde el
  // browser (app/panel/FxBox.tsx), no desde el server.
  "connect-src 'self' https://dolarapi.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
