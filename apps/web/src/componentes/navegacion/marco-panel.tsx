'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { BotonIcono, cn } from '@barber-shop/ui';
import type { NombreRol } from '@barber-shop/tipos';

import { BarraLateral } from './barra-lateral';
import type { EntradaMenu } from '@/lib/navegacion';

/**
 * Armazón del panel (sección 6.5 del sistema de diseño).
 *
 * Dos cosas que resuelve y conviene no deshacer:
 *
 * 1. LA BARRA LATERAL NO SE DESPLAZA. El contenedor exterior ocupa exactamente
 *    el alto de la ventana y no desborda; el desplazamiento vertical vive en
 *    el `<main>`. Si el desplazamiento fuera de la página entera, la
 *    navegación se iría hacia arriba al bajar por una tabla larga, que es
 *    justo cuando hace falta cambiar de sección.
 *
 * 2. EN MÓVIL LA BARRA ES UN CAJÓN. Por debajo de `lg` desaparece y se abre
 *    desde el botón de la barra superior, sobre un velo. Se cierra al navegar,
 *    con Escape, y al tocar fuera.
 */
export function MarcoPanel({
  entradas,
  usuario,
  acciones,
  aviso,
  children,
}: {
  entradas: EntradaMenu[];
  usuario: { nombre: string; rol: NombreRol };
  acciones: ReactNode;
  /** Franja de ancho completo sobre todo lo demás. Hoy, el aviso de demostración. */
  aviso?: ReactNode;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  // Navegar cierra el cajón. Sin esto, al elegir una sección el usuario se
  // queda mirando el menú en lugar de la pantalla que pidió.
  useEffect(() => {
    setAbierto(false);
  }, [ruta]);

  // Escape cierra, como cualquier capa superpuesta del sistema.
  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [abierto]);

  // Con el cajón abierto, el fondo no debe desplazarse.
  useEffect(() => {
    document.body.style.overflow = abierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [abierto]);

  return (
    <div className="bg-fondo flex h-dvh flex-col overflow-hidden">
      {aviso && <div className="shrink-0">{aviso}</div>}

      <div className="flex min-h-0 flex-1">
        {/* Barra lateral de escritorio: fija, nunca se desplaza con el contenido */}
        <div className="hidden lg:flex">
          <BarraLateral entradas={entradas} usuario={usuario} />
        </div>

      {/* Cajón de móvil */}
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar el menú"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-[var(--fondo-velo)]"
          />
          <div className="animate-in slide-in-from-left relative h-full w-[264px] duration-200">
            <BarraLateral entradas={entradas} usuario={usuario} />
            <div className="absolute top-3 -right-12">
              <BotonIcono
                icono="x"
                etiqueta="Cerrar el menú"
                variante="secundario"
                onClick={() => setAbierto(false)}
              />
            </div>
          </div>
        </div>
      )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header
            className={cn(
              'border-borde-sutil bg-navegacion flex h-14 shrink-0 items-center gap-2 border-b px-4 sm:px-6',
            )}
          >
            <div className="lg:hidden">
              <BotonIcono
                icono="menu"
                etiqueta="Abrir el menú"
                variante="terciario"
                onClick={() => setAbierto(true)}
                aria-expanded={abierto}
              />
            </div>

            <div className="ml-auto flex items-center gap-2">{acciones}</div>
          </header>

          {/* El único elemento que se desplaza.
              `relative` no es decorativo: sin el, un descendiente con
              `position: absolute` y ningun antepasado posicionado toma como
              bloque contenedor el documento entero, se escapa de este scroller
              y estira la altura de la pagina. Pasaba con el `<caption>` de las
              tablas, que lleva `solo-lectores`: la ventana quedaba con DOS
              barras de desplazamiento y la barra lateral se iba hacia arriba. */}
          <main id="contenido" className="relative flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1440px] p-4 sm:p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
