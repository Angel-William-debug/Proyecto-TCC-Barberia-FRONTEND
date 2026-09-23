'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Boton } from '../boton';

/**
 * Pie de paginacion de una tabla (seccion 9.5).
 *
 * Se dibuja solo cuando hay mas de una pagina: con diez filas o menos no hay
 * nada que paginar, y un «Pagina 1 de 1» es ruido.
 *
 * La pagina vive en la URL como los filtros (9.9): el boton Atras vuelve a la
 * anterior y el enlace se puede compartir. A diferencia de `useFiltros`, aca
 * se toca UN solo parametro y se conservan los demas, incluida la pagina de
 * la otra tabla si la pantalla tiene dos.
 */
export interface PropsPaginacion {
  pagina: number;
  totalPaginas: number;
  total: number;
  porPagina: number;
  /** `pagina` por defecto; `pagina_<tabla>` en la segunda tabla de una pantalla. */
  parametro?: string;
}

export function Paginacion({
  pagina,
  totalPaginas,
  total,
  porPagina,
  parametro = 'pagina',
}: PropsPaginacion) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  if (totalPaginas <= 1) return null;

  function ir(n: number) {
    const siguientes = new URLSearchParams(params.toString());
    // La primera pagina no se escribe: `?pagina=1` ensucia el enlace.
    if (n <= 1) siguientes.delete(parametro);
    else siguientes.set(parametro, String(n));
    const consulta = siguientes.toString();
    router.push(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
  }

  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <nav
      aria-label="Paginación"
      className="border-borde-sutil flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
    >
      <p className="text-cuerpo-sm text-terciario tabular-nums">
        {desde}–{hasta} de {total} · Página {pagina} de {totalPaginas}
      </p>
      <div className="flex gap-2">
        <Boton
          variante="secundario"
          tamano="sm"
          icono="chevron-left"
          disabled={pagina <= 1}
          onClick={() => ir(pagina - 1)}
        >
          Anterior
        </Boton>
        <Boton
          variante="secundario"
          tamano="sm"
          iconoDerecha="chevron-right"
          disabled={pagina >= totalPaginas}
          onClick={() => ir(pagina + 1)}
        >
          Siguiente
        </Boton>
      </div>
    </nav>
  );
}
