'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { BotonIcono, cn } from '@barber-shop/ui';
import type { NombreRol } from '@barber-shop/tipos';

import { BarraLateral, type GrupoBarra } from './barra-lateral';

/**
 * Armazón con barra lateral (sección 6.5 del sistema de diseño).
 *
 * Lo usan las DOS mitades del sistema: el panel de la barbería y el portal
 * del cliente. Antes el portal tenía el suyo propio, con navegación superior
 * en escritorio e inferior en el teléfono; se unificó a pedido del equipo,
 * para que quien pasa de una mitad a la otra no tenga que aprender dos formas
 * de moverse.
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
 *
 * 3. HAY UN ÁREA QUE REEMPLAZA LA BARRA. Al entrar en Configuración, la barra
 *    del sistema deja lugar a la del área, con su propio juego de grupos y un
 *    enlace «Volver al sistema» arriba. Se resuelve acá, mirando la ruta, y no
 *    con dos layouts de Next.js: dos layouts obligarían a resolver la sesión
 *    dos veces por petición -`usuarioActual()` no está memorizada- y a mover de
 *    carpeta las diecisiete rutas del panel. Ver `RUTAS_AREA_CONFIGURACION`.
 */
/** Un juego de navegación que reemplaza al del sistema mientras se está adentro. */
export interface AreaBarra {
  /** Las rutas que pertenecen al área. Una ruta y sus hijas cuentan. */
  rutas: string[];
  grupos: GrupoBarra[];
  volver: { etiqueta: string; ruta: string };
}

export function MarcoLateral({
  grupos,
  area,
  usuario,
  inicio,
  acciones,
  aviso,
  /** Ancho máximo del contenido. El portal usa una columna más angosta. */
  anchoContenido = 'max-w-[1440px]',
  children,
}: {
  grupos: GrupoBarra[];
  /** El área que se adueña de la barra en sus rutas. Hoy, Configuración. */
  area?: AreaBarra;
  usuario: { nombre: string; rol: NombreRol };
  /** Adonde lleva el logotipo de la barra lateral. */
  inicio: string;
  acciones: ReactNode;
  /** Franja de ancho completo sobre todo lo demás. Hoy, el aviso de demostración. */
  aviso?: ReactNode;
  anchoContenido?: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const ruta = usePathname();

  // Adentro del área, la barra es la del área. Se compara con la ruta exacta
  // y con el prefijo seguido de barra, no con `startsWith` a secas: si no,
  // `/panel/usuarios-invitados` -una ruta que hoy no existe pero podría-
  // entraría al área por parecerse de nombre.
  const enArea =
    area?.rutas.some((r) => ruta === r || ruta.startsWith(`${r}/`)) ?? false;
  const gruposVisibles = enArea && area ? area.grupos : grupos;
  const volver = enArea ? area?.volver : undefined;

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
          <BarraLateral
            grupos={gruposVisibles}
            usuario={usuario}
            inicio={inicio}
            volver={volver}
          />
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
            <BarraLateral
              grupos={gruposVisibles}
              usuario={usuario}
              inicio={inicio}
              volver={volver}
            />
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
            <div className={cn('mx-auto w-full p-4 sm:p-6', anchoContenido)}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
