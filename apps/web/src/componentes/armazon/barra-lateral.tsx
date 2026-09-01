'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ChipEstado, Icono, PRESENTACION_ROL, cn, type NombreIcono } from '@barber-shop/ui';
import type { NombreRol } from '@barber-shop/tipos';

import { LogoHorizontal, Isotipo } from '@/componentes/marca/logo';

/**
 * Barra lateral: 264 px desplegada, 64 px colapsada (seccion 6.5).
 *
 * La usan las DOS mitades del sistema: el panel de la barberia y el portal
 * del cliente. Por eso no sabe nada de modulos ni de grupos con nombre fijo:
 * recibe entradas y, si el grupo tiene titulo, lo dibuja. El panel le pasa
 * sus cinco grupos; el portal, uno solo y sin titulo, porque cuatro entradas
 * no necesitan encabezado.
 *
 * `usePathname` marca la entrada activa. `aria-current="page"` es lo que
 * permite a un lector de pantalla anunciar en que seccion esta el usuario, y
 * no puede sustituirse por un cambio de color.
 */
export interface EntradaBarra {
  etiqueta: string;
  ruta: string;
  icono: NombreIcono;
  /**
   * Marca la entrada como activa solo con la ruta exacta.
   *
   * Hace falta cuando una ruta es prefijo de sus hermanas. `/mi-cuenta` lo es
   * de `/mi-cuenta/reservar`, `/mi-cuenta/historial` y `/mi-cuenta/perfil`, de
   * modo que sin esto quedarian DOS entradas resaltadas a la vez en todas las
   * pantallas del portal, y `aria-current="page"` -que deberia senalar una
   * sola- apareceria repetido.
   */
  exacta?: boolean;
}

export interface GrupoBarra {
  /** Sin titulo, el grupo se dibuja sin encabezado. */
  titulo?: string;
  entradas: EntradaBarra[];
}

export function BarraLateral({
  grupos,
  usuario,
  inicio,
  colapsada = false,
}: {
  grupos: GrupoBarra[];
  usuario: { nombre: string; rol: NombreRol };
  /** Adonde lleva el logotipo. Distinto en cada mitad del sistema. */
  inicio: string;
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
        <Link href={inicio} aria-label="Barber Shop, ir al inicio">
          {colapsada ? <Isotipo className="h-7 w-7" /> : <LogoHorizontal />}
        </Link>
      </div>

      {/* Cada grupo es su propia `nav` con su nombre accesible, y no una sola
          lista con encabezados sueltos: asi un lector de pantalla puede
          saltar de un grupo a otro, que es lo mismo que hace la vista al
          recorrer los titulillos. Colapsada, los titulos desaparecen y solo
          queda una linea divisoria entre grupos: el ancho de 64 px no admite
          texto, y sin separacion las catorce entradas volverian a leerse como
          una lista continua. */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {grupos.map(({ titulo, entradas }, i) => (
          <nav
            key={titulo ?? i}
            aria-label={titulo ?? 'Secciones'}
            className={cn(
              i > 0 && (colapsada ? 'border-borde-sutil mt-2 border-t pt-2' : 'mt-5'),
            )}
          >
            {titulo && !colapsada && (
              <h2 className="text-titulillo text-terciario px-3 pb-2 font-semibold tracking-[0.06em] uppercase">
                {titulo}
              </h2>
            )}

            <ul className="space-y-1">
              {entradas.map((e) => {
                const activa = e.exacta
                  ? ruta === e.ruta
                  : ruta === e.ruta || ruta.startsWith(`${e.ruta}/`);

                return (
                  <li key={e.ruta}>
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
        ))}
      </div>

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
