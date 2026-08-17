import type { ReactNode } from 'react';

import { Icono } from './icono';
import type { NombreIcono } from '../iconos';
import { cn } from '../utilidades';

/**
 * Seccion 9.8 del Sistema de Diseno.
 *
 * Una tabla vacia no es un error, es una oportunidad de orientar. El titulo
 * dice que falta; la accion, como resolverlo. Nunca «Sin datos».
 */
export interface PropsEstadoVacio {
  icono?: NombreIcono;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}

export function EstadoVacio({
  icono = 'inbox',
  titulo,
  descripcion,
  accion,
  className,
}: PropsEstadoVacio) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}
    >
      <Icono nombre={icono} tamano="2xl" className="text-terciario" />
      <h3 className="text-titulo-3 text-principal mt-4 font-semibold">{titulo}</h3>
      {descripcion && (
        <p className="text-cuerpo-sm text-terciario medida-lectura mt-2">{descripcion}</p>
      )}
      {accion && <div className="mt-6">{accion}</div>}
    </div>
  );
}

/**
 * Esqueleto de carga. Ocupa el mismo alto que el contenido real para que la
 * pagina no salte cuando los datos llegan.
 */
export function Esqueleto({ className }: { className?: string }) {
  return (
    <div
      className={cn('bg-elevado animate-pulse rounded-md', className)}
      aria-hidden="true"
    />
  );
}

/** Esqueleto con forma de tabla: el caso mas frecuente del sistema. */
export function EsqueletoTabla({ filas = 6, columnas = 5 }: { filas?: number; columnas?: number }) {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-live="polite">
      <span className="solo-lectores">Cargando datos</span>
      {Array.from({ length: filas }).map((_, f) => (
        <div key={f} className="flex gap-4">
          {Array.from({ length: columnas }).map((__, c) => (
            <Esqueleto key={c} className={cn('h-8 flex-1', c === 0 && 'max-w-[3rem]')} />
          ))}
        </div>
      ))}
    </div>
  );
}
