'use client';

import { useId, useState, type ReactNode } from 'react';

import { Boton } from '../boton';
import { useFiltros } from './url';
import { cn } from '../../utilidades';

/**
 * La barra de filtros estandar de toda tabla del sistema (seccion 9.9).
 *
 * UNA SOLA FORMA, EN TODAS LAS TABLAS
 *
 * Pedido de la directora: que filtrar se haga igual en todas partes. Antes
 * cada pantalla ponia sus controles en el orden que le parecia -en Clientes
 * la busqueda, el estado y la fecha; en Reportes el tipo primero- y todos a
 * la vista, asi que con cuatro filtros la barra ocupaba dos renglones.
 *
 * Ahora el orden lo decide este componente, no la pantalla:
 *
 *   [fijos]  [Buscar]  [Fecha]  [+ Filtros (n)]
 *   └── al tocar «Filtros», los propios de esa tabla, en una fila debajo
 *
 * - `busqueda` y `fecha` son el estandar: van siempre que la tabla los tenga
 *   y siempre en ese lugar.
 * - `avanzados` son los filtros propios de cada tabla (estado, barbero,
 *   metodo de pago...). Quedan plegados detras del boton, que dice cuantos
 *   hay aplicados. Si al entrar ya hay alguno en la URL, la fila empieza
 *   abierta: esconder un filtro activo es la forma mas rapida de que alguien
 *   crea que se perdieron datos.
 * - `fijos` no son filtros sino el marco de lo que se mira: el tipo de
 *   reporte, el catalogo de la papelera, el dia de la agenda. Por eso van
 *   primero y nunca se pliegan.
 *
 * La fila avanzada se despliega debajo y no en un panel lateral: no tapa la
 * tabla mientras se filtra, y en el telefono se apila sola.
 */
export interface PropsBarraFiltros {
  /** Un `CampoBusqueda`. */
  busqueda?: ReactNode;
  /** Un `RangoFechas`. */
  fecha?: ReactNode;
  /** Lo que define que se esta mirando. Va primero y siempre visible. */
  fijos?: ReactNode;
  /** Los filtros propios de la tabla, plegados detras de «+ Filtros». */
  avanzados?: ReactNode;
  /**
   * Los parametros de URL que escriben los `avanzados`. Con ellos el boton
   * cuenta cuantos hay aplicados y «Limpiar» sabe que borrar, sin tocar la
   * busqueda, la fecha ni los filtros de otra tabla de la misma pantalla.
   */
  parametrosAvanzados?: string[];
}

export function BarraFiltros({
  busqueda,
  fecha,
  fijos,
  avanzados,
  parametrosAvanzados = [],
}: PropsBarraFiltros) {
  const { params, aplicar } = useFiltros();
  const idPanel = useId();

  const aplicados = parametrosAvanzados.filter((p) => params.get(p)).length;
  const [abierto, setAbierto] = useState(aplicados > 0);

  function limpiarAvanzados() {
    aplicar(Object.fromEntries(parametrosAvanzados.map((p) => [p, null])));
  }

  return (
    <div className="border-borde-sutil border-b">
      <div className="flex flex-wrap items-end gap-3 p-4">
        {fijos}
        {busqueda}
        {fecha}

        {avanzados && (
          <Boton
            type="button"
            variante={aplicados > 0 ? 'secundario' : 'terciario'}
            icono="plus"
            aria-expanded={abierto}
            aria-controls={idPanel}
            onClick={() => setAbierto((a) => !a)}
            className="sm:ml-auto"
          >
            Filtros
            {aplicados > 0 && (
              <span
                className={cn(
                  'bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]',
                  'text-etiqueta ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-sm px-1 font-semibold tabular-nums',
                )}
              >
                <span className="solo-lectores">aplicados: </span>
                {aplicados}
              </span>
            )}
          </Boton>
        )}
      </div>

      {avanzados && abierto && (
        <div
          id={idPanel}
          role="group"
          aria-label="Filtros avanzados"
          className="border-borde-sutil flex flex-wrap items-end gap-3 border-t px-4 py-4"
        >
          {avanzados}
          {aplicados > 0 && (
            <Boton type="button" variante="terciario" onClick={limpiarAvanzados}>
              Limpiar filtros
            </Boton>
          )}
        </div>
      )}
    </div>
  );
}
