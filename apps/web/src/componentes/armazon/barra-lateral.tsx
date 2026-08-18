'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChipEstado, Icono, PRESENTACION_ROL, cn } from '@barber-shop/ui';
import type { NombreRol } from '@barber-shop/tipos';

import { LogoHorizontal, Isotipo } from '@/componentes/marca/logo';
import type { EntradaMenu } from '@/lib/navegacion';

/**
 * Barra lateral: 264 px desplegada, 64 px colapsada (seccion 6.5).
 *
 * `usePathname` marca la entrada activa. `aria-current="page"` es lo que
 * permite a un lector de pantalla anunciar en que seccion esta el usuario, y
 * no puede sustituirse por un cambio de color.
 */
export function BarraLateral({
  entradas,
  usuario,
  colapsada = false,
}: {
  entradas: EntradaMenu[];
  usuario: { nombre: string; rol: NombreRol };
  colapsada?: boolean;
}) {
  const ruta = usePathname();

  return (
    // `h-full`, no `h-screen`: el alto lo fija el marco del panel, que ya
    // ocupa exactamente la ventana. Con `h-screen` la barra sobresaldría por
    // debajo cuando hay un aviso arriba.
    <aside
      className={cn(
        'bg-navegacion border-borde-sutil flex h-full shrink-0 flex-col border-r',
        colapsada ? 'w-16' : 'w-[264px]',
      )}
    >
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link href="/panel/agenda" aria-label="Barber Shop, ir al inicio">
          {colapsada ? <Isotipo className="h-7 w-7" /> : <LogoHorizontal />}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Secciones del sistema">
        <ul className="space-y-1">
          {entradas.map((e) => {
            const activa = ruta === e.ruta || ruta.startsWith(`${e.ruta}/`);

            return (
              <li key={e.modulo}>
                <Link
                  href={e.ruta}
                  aria-current={activa ? 'page' : undefined}
                  title={colapsada ? e.etiqueta : undefined}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-md px-3',
                    'text-cuerpo transition-colors duration-[var(--movimiento-rapido)]',
                    colapsada && 'justify-center px-0',
                    activa
                      ? 'bg-elevado text-principal font-medium'
                      : 'text-secundario hover:bg-elevado hover:text-principal',
                  )}
                >
                  <Icono
                    nombre={e.icono}
                    tamano="md"
                    className={activa ? 'text-marca' : undefined}
                  />
                  {!colapsada && e.etiqueta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-borde-sutil shrink-0 border-t p-3">
        {colapsada ? (
          <div className="bg-elevado text-marca text-etiqueta mx-auto flex h-9 w-9 items-center justify-center rounded-full font-semibold">
            {usuario.nombre.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <div className="px-1">
            <p className="text-cuerpo text-principal truncate font-medium">{usuario.nombre}</p>
            <div className="mt-1.5">
              <ChipEstado presentacion={PRESENTACION_ROL[usuario.rol]} />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
