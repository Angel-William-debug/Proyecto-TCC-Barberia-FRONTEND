'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { CONTROL, Envoltorio } from './base';
import { cn } from '../../utilidades';

/**
 * Campo de texto (seccion 9.11.3). Es el mas usado del sistema.
 *
 * Antes vivia en `campo.tsx`, al lado de `campos.tsx` con los otros cuatro:
 * dos nombres que se diferenciaban en una letra. Y ademas dibujaba su propia
 * etiqueta, su propia ayuda y su propio error, duplicando lo que ya hacia
 * `Envoltorio`. Ahora usa el mismo, que es justamente lo que garantiza que los
 * cinco campos se vean iguales.
 */
export interface PropsCampo extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  etiqueta: string;
  /** Debajo del campo. Lo reemplaza el mensaje de error cuando lo hay. */
  ayuda?: string;
  error?: string;
  /** Contenido a la derecha dentro del campo: un sufijo como «Gs.» o «min». */
  sufijo?: ReactNode;
  className?: string;
  claseContenedor?: string;
}

export const Campo = forwardRef<HTMLInputElement, PropsCampo>(function Campo(
  { etiqueta, ayuda, error, sufijo, required, id, className, claseContenedor, ...resto },
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
      <div className="relative flex items-center">
        <input
          ref={ref}
          id={idCampo}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
          className={cn(
            CONTROL,
            'h-10',
            error ? 'border-peligro' : 'border-borde-control',
            // El sufijo se dibuja encima del campo, no al lado: sin este
            // relleno el texto largo pasa por debajo de «Gs.».
            sufijo && 'pr-14',
            className,
          )}
          {...resto}
        />
        {sufijo && (
          <span className="text-terciario text-cuerpo-sm pointer-events-none absolute right-3">
            {sufijo}
          </span>
        )}
      </div>
    </Envoltorio>
  );
});
