'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

import { CONTROL, Envoltorio } from './base';
import { cn } from '../../utilidades';

/** Area de texto para notas y descripciones (seccion 9.11.3). */
export interface PropsCampoArea
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  claseContenedor?: string;
}

export const CampoArea = forwardRef<HTMLTextAreaElement, PropsCampoArea>(function CampoArea(
  { etiqueta, ayuda, error, required, id, rows = 3, claseContenedor, ...resto },
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
      <textarea
        ref={ref}
        id={idCampo}
        rows={rows}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
        className={cn(
          CONTROL,
          'resize-y py-2 placeholder:text-terciario',
          error ? 'border-peligro' : 'border-borde-control',
        )}
        {...resto}
      />
    </Envoltorio>
  );
});
