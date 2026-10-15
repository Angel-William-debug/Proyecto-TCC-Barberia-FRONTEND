'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Boton, EstadoVacio, Tarjeta } from '@barber-shop/ui';

/**
 * Acceso denegado (vista 92 del anexo; 15/10/2026).
 *
 * El menú ya esconde lo que un rol no puede usar, pero una ruta escrita a
 * mano o un enlace guardado llegaban igual a la pantalla, y la pantalla
 * fallaba con un error de permisos de la base (RLS) que no decía nada útil.
 * Ahora se reconoce antes y se explica.
 *
 * Va del lado del cliente porque necesita la ruta actual, y el layout no la
 * conoce. La autoridad sigue siendo RLS: esto solo cambia lo que se ve.
 */
export function GuardaRuta({
  permitidas,
  negadas,
  inicio,
  children,
}: {
  permitidas: string[];
  negadas: string[];
  inicio: string;
  children: React.ReactNode;
}) {
  const ruta = usePathname();
  const coincide = (r: string) => ruta === r || ruta.startsWith(`${r}/`);
  const largo = (lista: string[]) => Math.max(-1, ...lista.filter(coincide).map((r) => r.length));

  if (largo(negadas) > largo(permitidas)) {
    return (
      <Tarjeta className="mx-auto mt-10 max-w-xl">
        <EstadoVacio
          icono="shield-check"
          titulo="No tiene acceso a esta pantalla"
          descripcion="Su rol no incluye esta sección del sistema. Si la necesita para su trabajo, pídale al administrador que revise sus permisos."
          accion={
            <Link href={inicio}>
              <Boton variante="secundario" icono="arrow-left">
                Volver al inicio
              </Boton>
            </Link>
          }
        />
      </Tarjeta>
    );
  }

  return <>{children}</>;
}
