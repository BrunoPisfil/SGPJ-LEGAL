/** @type {import('next').NextConfig} */

const BACKEND_URL = "https://sgpj-legal-backend.vercel.app"

const securityHeaders = [
  // Evita clickjacking — nadie puede meter tu app en un iframe externo
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Evita MIME-sniffing — el browser respeta el Content-Type declarado
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Controla qué información se envía en el header Referer al navegar
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Fuerza HTTPS por 1 año e incluye subdominios
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  // Deshabilita features del navegador que no usa la app
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
  },
  // Content Security Policy — fuentes explícitamente permitidas
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: solo mismo origen + inline necesario para Next.js
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Estilos: mismo origen + inline (Tailwind genera estilos inline)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fuentes: Google Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Imágenes: mismo origen + data URIs
      "img-src 'self' data: blob:",
      // Conexiones API: solo el backend propio
      `connect-src 'self' ${BACKEND_URL}`,
      // Frames: nadie
      "frame-src 'none'",
      // Objetos: nadie (sin Flash, PDFs embebidos, etc.)
      "object-src 'none'",
      // Base URI: solo mismo origen
      "base-uri 'self'",
      // Forms: solo mismo origen
      "form-action 'self'",
    ].join("; "),
  },
]

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Aplica a todas las rutas del frontend
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
