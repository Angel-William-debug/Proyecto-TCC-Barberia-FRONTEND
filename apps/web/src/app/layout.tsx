import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import { COLOR_TEMA_NAVEGADOR } from '@barber-shop/ui';

import './globals.css';

/**
 * Seccion 5.1 del Sistema de Diseno.
 *
 * Las tres tipografias estan guardadas en `src/fuentes` y se sirven desde el
 * propio dominio. Se usa `next/font/local` y no `next/font/google` por tres
 * motivos:
 *
 *  1. Privacidad. Con la variante de Google, el navegador del usuario pide el
 *     archivo a fonts.gstatic.com y le entrega su direccion IP a un tercero.
 *     La Ley 6534/2020 obliga a considerarlo.
 *  2. Reproducibilidad. `next/font/google` descarga en cada compilacion; si
 *     Google rota una URL o no hay conexion, la compilacion falla.
 *  3. Velocidad. Un archivo menos que resolver por DNS en la primera visita.
 *
 * Son fuentes variables: un solo archivo cubre todo el rango de pesos, lo que
 * pesa menos que descargar cuatro archivos estaticos. Las tres estan bajo
 * licencia SIL Open Font License 1.1, que permite este uso.
 *
 * `display: swap` muestra la tipografia de respaldo mientras carga la real,
 * de modo que el texto nunca queda invisible.
 */
const oswald = localFont({
  src: '../fuentes/oswald-variable.woff2',
  weight: '200 700',
  variable: '--fuente-display',
  display: 'swap',
  fallback: ['Arial Narrow', 'system-ui', 'sans-serif'],
});

const inter = localFont({
  src: '../fuentes/inter-variable.woff2',
  weight: '100 900',
  variable: '--fuente-interfaz',
  display: 'swap',
  fallback: ['Segoe UI', 'system-ui', 'sans-serif'],
});

const mono = localFont({
  src: '../fuentes/jetbrains-mono-variable.woff2',
  weight: '100 800',
  variable: '--fuente-mono',
  display: 'swap',
  fallback: ['Consolas', 'ui-monospace', 'monospace'],
});

export const metadata: Metadata = {
  title: {
    default: 'Barber Shop',
    template: 'Barber Shop — %s',
  },
  description:
    'Sistema de gestión para barberías: agenda, clientes, cobros, inventario y ' +
    'recomendaciones basadas en aprendizaje automático.',
  applicationName: 'Barber Shop',
  authors: [{ name: 'Angel Rolon Martinez' }, { name: 'William Gimenez Delvalle' }],
};

export const viewport: Viewport = {
  // Del sistema de diseno, no escrito a mano: es --carbon-900. Lo lee el
  // sistema operativo desde una etiqueta <meta>, antes de que exista una
  // hoja de estilos, de modo que no puede ser una variable CSS.
  themeColor: COLOR_TEMA_NAVEGADOR,
  width: 'device-width',
  initialScale: 1,
};

/**
 * Aplica el tema guardado ANTES de que el navegador pinte.
 *
 * Sin esto, quien eligió el tema claro ve la página en oscuro durante un
 * instante y después cambia de golpe: el conmutador vive en un componente de
 * cliente y solo actúa después de hidratar. Un script en línea y sin `defer`
 * corre primero, de modo que el primer pintado ya sale con el tema correcto.
 *
 * Es deliberadamente pequeño y va envuelto en try/catch: si el navegador
 * bloquea el almacenamiento local, se cae al tema oscuro, que es el
 * predeterminado, en lugar de romper la página.
 */
const GUION_TEMA = `(function(){try{
var t=localStorage.getItem('barber-shop:tema');
if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'claro':'oscuro';}
if(t==='claro'){document.documentElement.setAttribute('data-tema','claro');}
}catch(e){}})();`;

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    // `data-tema` ausente significa tema oscuro, el predeterminado del sistema.
    <html lang="es-PY" className={`${oswald.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: GUION_TEMA }} />
      </head>
      <body>
        {/* Criterio 2.4.1 de la WCAG: permite saltear la navegacion repetida. */}
        <a
          href="#contenido"
          className="solo-lectores bg-marca text-sobre-marca focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-50 focus-visible:rounded-md focus-visible:px-4 focus-visible:py-2"
        >
          Saltar al contenido principal
        </a>
        {children}
      </body>
    </html>
  );
}
