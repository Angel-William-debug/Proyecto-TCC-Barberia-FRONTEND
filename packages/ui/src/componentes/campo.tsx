'use client';

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

import { Icono } from './icono';
import { cn } from '../utilidades';

/**
 * Seccion 9.4 del Sistema de Diseno.
 *
 * Anatomia de arriba hacia abajo: etiqueta, campo, ayuda o error.
 *
 * La etiqueta es SIEMPRE visible y esta asociada por `htmlFor`. El texto
 * interior (`placeholder`) es un ejemplo del formato esperado, nunca un
 * sustituto de la etiqueta: desaparece al escribir y deja al usuario sin
 * saber que estaba completando.
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
  const idGenerado = useId();
  const idCampo = id ?? idGenerado;
  const idAyuda = `${idCampo}-ayuda`;
  const idError = `${idCampo}-error`;

  return (
    <div className={cn('flex flex-col gap-2', claseContenedor)}>
      <label htmlFor={idCampo} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
        {required && (
          <span className="text-peligro ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="relative flex items-center">
        <input
          ref={ref}
          id={idCampo}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : ayuda ? idAyuda : undefined}
          className={cn(
            'bg-fondo text-principal h-10 w-full rounded-md px-3',
            'text-cuerpo placeholder:text-terciario',
            'border transition-colors duration-[var(--movimiento-rapido)]',
            error ? 'border-peligro' : 'border-borde-control',
            'disabled:bg-superficie disabled:text-deshabilitado disabled:cursor-not-allowed',
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

      {error ? (
        // `role="alert"` hace que el lector de pantalla lo anuncie sin que el
        // foco se mueva. Criterio 4.1.3 de la WCAG.
        <p id={idError} role="alert" className="text-peligro text-cuerpo-sm flex items-center gap-1">
          <Icono nombre="circle-alert" tamano="xs" />
          {error}
        </p>
      ) : ayuda ? (
        <p id={idAyuda} className="text-terciario text-cuerpo-sm">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
});
