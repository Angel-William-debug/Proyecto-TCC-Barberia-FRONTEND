'use client';

import type { ReactNode } from 'react';

import { Icono } from '../icono';
import { cn } from '../../utilidades';

/**
 * Seccion 9.11.2 del Sistema de Diseno: la anatomia comun de todos los campos.
 *
 * Etiqueta arriba y siempre visible, asterisco si es obligatorio, y debajo la
 * ayuda o el error, nunca los dos. Vive aparte porque es lo que garantiza que
 * los cinco campos se vean igual: si cada uno dibujara su propia etiqueta, en
 * seis meses no coincidirian.
 */
export function Envoltorio({
  id,
  etiqueta,
  requerido,
  ayuda,
  error,
  className,
  children,
}: {
  id: string;
  etiqueta: string;
  requerido?: boolean;
  ayuda?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
        {requerido && (
          <span className="text-peligro ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-peligro text-cuerpo-sm flex items-center gap-1"
        >
          <Icono nombre="circle-alert" tamano="xs" />
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-terciario text-cuerpo-sm">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

/** Clases del control. Iguales en el campo de texto, el selector y el area. */
export const CONTROL = [
  'bg-fondo text-principal text-cuerpo w-full rounded-md border px-3',
  'transition-colors duration-[var(--movimiento-rapido)]',
  'disabled:bg-superficie disabled:text-deshabilitado disabled:cursor-not-allowed',
];
