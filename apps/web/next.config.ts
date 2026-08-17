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
