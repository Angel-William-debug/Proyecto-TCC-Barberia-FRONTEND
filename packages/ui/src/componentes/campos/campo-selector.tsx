'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

import { CONTROL, Envoltorio } from './base';
import { cn } from '../../utilidades';

/** Selector de un valor de una lista cerrada (seccion 9.11.3). */
export interface OpcionCampo {
  valor: string | number;
  etiqueta: string;
}

export interface PropsCampoSelector
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  etiqueta: string;
  opciones: OpcionCampo[];
  /** Texto de la opcion vacia. Sin el, el primer valor queda elegido sin querer. */
  marcador?: string;
  ayuda?: string;
  error?: string;
  claseContenedor?: string;
}

/**
 * Elemento `select` nativo, igual que en los filtros.
 *
 * Uno propio se ve mas moderno y funciona peor: el nativo ya trae navegacion
 * por teclado, busqueda escribiendo la inicial, y en el telefono abre la rueda
 * del sistema.
 */
export const CampoSelector = forwardRef<HTMLSelectElement, PropsCampoSelector>(
  function CampoSelector(
    { etiqueta, opciones, marcador = 'Seleccione una opción', ayuda, error, required, id, claseContenedor, ...resto },
    ref,
  ) {
    const generado = useId();
    const idCampo = id ?? generado;

    return (
      <Envoltorio
        id={idCampo}
        etiqueta={etiqueta}
        requerido={required}
        ayuda={ayuda}
        error={error}
        className={claseContenedor}
      >
        <select
          ref={ref}
          id={idCampo}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
          className={cn(CONTROL, 'h-10', error ? 'border-peligro' : 'border-borde-control')}
          {...resto}
        >
          <option value="">{marcador}</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </Envoltorio>
    );
  },
);
