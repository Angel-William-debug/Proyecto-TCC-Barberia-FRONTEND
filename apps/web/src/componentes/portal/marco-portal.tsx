'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { Icono, cn, type NombreIcono } from '@barber-shop/ui';

import { LogoHorizontal } from '@/componentes/marca/logo';

/**
 * Armazon del portal del cliente.
 *
 * NO reutiliza `MarcoPanel`, y esa es la decision de fondo de toda esta parte
 * del sistema. Las dos mitades comparten la paleta, la tipografia y los
 * componentes -son la misma barberia- pero no comparten la forma:
 *
 *   El panel   barra lateral fija de 264 px, catorce secciones, densidad alta,
 *              tablas. Esta pensado para alguien que pasa ocho horas ahi y
 *              necesita llegar rapido a cualquier lado.
 *
 *   El portal  navegacion superior de cuatro entradas, una columna angosta,
 *              tarjetas, aire. Esta pensado para alguien que entra dos
 *              minutos, desde el telefono, a reservar un turno.
 *
 * Meter al cliente en el armazon del panel habria sido mas barato y habria
 * dado una pantalla que se siente como un sistema de gestion con casi todo
 * apagado. Es exactamente lo que se pidio evitar.
 *
 * POR QUE LA NAVEGACION VA ABAJO EN EL TELEFONO
 *
 * El portal se usa parado, con una mano, casi siempre en el telefono. Una
 * barra inferior queda al alcance del pulgar; uno menu superior obliga a
 * recolocar la mano. En pantallas grandes esa misma barra sube al encabezado,
 * donde el recorrido del mouse no cuesta nada.
 */

export interface EntradaPortal {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
}

export const ENTRADAS_PORTAL: EntradaPortal[] = [
  { etiqueta: 'Reservar', ruta: '/mi-cuenta/reservar', icono: 'calendar-days' },
  { etiqueta: 'Mis turnos', ruta: '/mi-cuenta', icono: 'clipboard-list' },
  { etiqueta: 'Historial', ruta: '/mi-cuenta/historial', icono: 'file-text' },
  { etiqueta: 'Mi perfil', ruta: '/mi-cuenta/perfil', icono: 'user-round' },
];

/**
 * `/mi-cuenta` es prefijo de todas las demas, asi que la comparacion por
 * prefijo la marcaria como activa siempre. Se compara exacta para esa y por
 * prefijo para el resto, que si tienen subrutas.
 */
function estaActiva(ruta: string, actual: string): boolean {
  if (ruta === '/mi-cuenta') return actual === '/mi-cuenta';
  return actual.startsWith(ruta);
}

export function MarcoPortal({
  nombre,
  acciones,
  aviso,
  children,
}: {
  nombre: string;
  acciones: ReactNode;
  aviso?: ReactNode;
  children: ReactNode;
}) {
  const actual = usePathname();

  const enlaces = ENTRADAS_PORTAL.map((e) => {
    const activa = estaActiva(e.ruta, actual);
    return { ...e, activa };
  });

  return (
    <div className="bg-fondo flex min-h-dvh flex-col">
      {aviso}

      <header className="border-borde-sutil bg-navegacion sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/mi-cuenta" className="shrink-0">
            <LogoHorizontal />
          </Link>

          {/* Navegacion de escritorio */}
          <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Portal">
            {enlaces.map((e) => (
              <Link
                key={e.ruta}
                href={e.ruta}
                aria-current={e.activa ? 'page' : undefined}
                className={cn(
                  'text-cuerpo-sm rounded-md px-3 py-2 font-medium transition-colors',
                  e.activa
                    ? 'bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]'
                    : 'text-secundario hover:text-principal hover:bg-elevado',
                )}
              >
                {e.etiqueta}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">{acciones}</div>
        </div>
      </header>

      {/* `pb-24` en movil deja lugar a la barra inferior fija: sin eso, la
          ultima tarjeta de cualquier lista queda tapada por la navegacion. */}
      <main id="contenido" className="flex-1 pb-24 md:pb-12">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <p className="text-cuerpo-sm text-terciario">Hola, {nombre.split(' ')[0]}</p>
          {children}
        </div>
      </main>

      {/* Navegacion de telefono: fija abajo, al alcance del pulgar.
          `pb-[env(safe-area-inset-bottom)]` la despega de la franja del gesto
          de inicio en los telefonos sin boton. */}
      <nav
        aria-label="Portal"
        className="border-borde-sutil bg-navegacion fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex">
          {enlaces.map((e) => (
            <li key={e.ruta} className="flex-1">
              <Link
                href={e.ruta}
                aria-current={e.activa ? 'page' : undefined}
                // 44 px es el minimo de objetivo tactil del sistema de diseno
                // (seccion 6.6); con el texto debajo del icono queda en 60.
                className={cn(
                  'flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 py-2',
                  e.activa ? 'text-[var(--chip-marca-texto)]' : 'text-terciario',
                )}
              >
                <Icono nombre={e.icono} tamano="md" />
                <span className="text-titulillo font-medium">{e.etiqueta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
