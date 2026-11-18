import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const AQUI = dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  reactStrictMode: true,

  /**
   * Raiz del monorepo. Sin esto, Next.js busca hacia arriba el archivo de
   * bloqueo mas cercano y puede quedarse con uno ajeno al proyecto que este
   * en la carpeta del usuario, lo que hace que rastree dependencias
   * equivocadas al empaquetar.
   */
  outputFileTracingRoot: resolve(AQUI, '../..'),

  /**
   * Los paquetes del monorepo se publican como TypeScript sin compilar.
   * Next.js los transpila junto con la aplicacion, lo que evita un paso de
   * construccion intermedio y hace que un cambio en `packages/ui` se refleje
   * al instante durante el desarrollo.
   */
  transpilePackages: ['@barber-shop/ui', '@barber-shop/api', '@barber-shop/tipos'],

  /**
   * El PDF del manual de usuario lleva las capturas de pantalla, que viven en
   * `public/`. En Vercel los archivos de `public/` los sirve la CDN y no
   * viajan con la funcion: sin esto, la ruta del PDF no los encuentra en
   * disco (igual los pide por HTTP como respaldo; ver `lib/ayuda/pdf.ts`).
   */
  outputFileTracingIncludes: {
    '/panel/ayuda/pdf': ['./public/ayuda/capturas/**'],
    '/mi-cuenta/ayuda/pdf': ['./public/ayuda/capturas/**'],
  },

  images: {
    // Seccion 8.2 del sistema de diseno: AVIF primero, WebP como respaldo.
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tmuntxynyopzbhzmulux.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },

  experimental: {
    // Importa solo los iconos que se usan en lugar del paquete completo.
    optimizePackageImports: ['lucide-react'],
  },
};

export default config;
