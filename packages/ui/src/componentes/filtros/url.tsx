'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Sección 9.9 del Sistema de Diseño: filtros de tabla.
 *
 * Toda tabla del sistema filtra con estas mismas piezas. No porque sea más
 * cómodo, sino porque un usuario que aprendió a filtrar la agenda tiene que
 * saber filtrar el inventario sin volver a aprender nada.
 *
 * EL ESTADO VIVE EN LA URL, no en `useState`. Consecuencias, todas buenas:
 *
 *   - Un listado filtrado se comparte pegando el enlace.
 *   - El botón Atrás del navegador deshace el último filtro.
 *   - El componente de servidor lee `searchParams` y consulta ya filtrado, en
 *     lugar de traer todo y descartar en el navegador.
 *   - Recargar la página no pierde el trabajo.
 *
 * Convención de nombres de parámetro, igual en las diez pantallas:
 *
 *   q         búsqueda de texto libre
 *   estado    valores múltiples separados por coma
 *   desde     fecha inicial, aaaa-MM-dd
 *   hasta     fecha final, aaaa-MM-dd
 *   pagina    número de página, base 1

/**
 * Lee y escribe los parametros de filtro de la URL.
 *
 * Lo comparten los seis controles: cada uno decide QUE parametro escribe, y
 * este decide COMO se escribe -conservando los demas y volviendo siempre a la
 * pagina 1-.
 */
export function useFiltros() {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  /**
   * Aplica cambios y navega. Un valor vacío o nulo BORRA el parámetro: dejar
   * `?estado=` en la barra de direcciones ensucia el enlace y complica la
   * lectura del lado del servidor.
   */
  const aplicar = useCallback(
    (cambios: Record<string, string | null>) => {
      const siguientes = new URLSearchParams(params.toString());

      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === '') siguientes.delete(clave);
        else siguientes.set(clave, valor);
      }

      // Cambiar un filtro siempre vuelve a la primera página. Quedarse en la
      // página 4 de un resultado que ahora tiene una sola es desconcertante.
      if (!('pagina' in cambios)) siguientes.delete('pagina');

      const consulta = siguientes.toString();
      router.push(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
    },
    [params, router, ruta],
  );

  const limpiar = useCallback(() => {
    router.push(ruta, { scroll: false });
  }, [router, ruta]);

  return { params, aplicar, limpiar };
}
