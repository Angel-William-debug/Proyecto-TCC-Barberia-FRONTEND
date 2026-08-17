import type { HTMLAttributes, ReactNode } from 'react';

import { Icono } from './icono';
import type { NombreIcono } from '../iconos';
import { CLASES_TEXTO_TONO, type Tono } from '../estados';
import { cn } from '../utilidades';

/**
 * Seccion 6.3 del Sistema de Diseno, nivel de elevacion 1.
 * Superficie + borde sutil, sin sombra: sobre fondo oscuro la sombra no se
 * percibe y la jerarquia la da el cambio de superficie.
 */
export function Tarjeta({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('bg-superficie border-borde-sutil rounded-lg border', className)}
      {...resto}
    />
  );
}

export function TarjetaEncabezado({
  titulo,
  descripcion,
  accion,
  className,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-borde-sutil flex items-start justify-between gap-4 border-b px-6 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-titulo-2 text-principal font-semibold">{titulo}</h2>
        {descripcion && <p className="text-cuerpo-sm text-terciario mt-1">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}

export function TarjetaCuerpo({ className, ...resto }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...resto} />;
}

/**
 * Tarjeta de indicador para los reportes del modulo 7.
 *
 * La cifra usa la tipografia de display y numeros tabulares; la variacion
 * lleva icono ademas de color, porque el color solo no basta.
 */
export interface PropsIndicador {
  etiqueta: string;
  valor: string;
  icono?: NombreIcono;
  /** Texto de contexto: «vs. mes anterior», «en el periodo». */
  contexto?: string;
  variacion?: {
    texto: string;
    tono: Extract<Tono, 'exito' | 'peligro' | 'neutro'>;
  };
  className?: string;
}

export function Indicador({
  etiqueta,
  valor,
  icono,
  contexto,
  variacion,
  className,
}: PropsIndicador) {
  return (
    <Tarjeta className={cn('p-6', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-titulillo text-terciario font-semibold tracking-[0.08em] uppercase">
          {etiqueta}
        </p>
        {icono && <Icono nombre={icono} tamano="md" className="text-terciario" />}
      </div>

      <p className="text-display-lg text-principal font-display mt-3 tabular-nums">{valor}</p>

      {(variacion ?? contexto) && (
        <div className="mt-2 flex items-center gap-2">
          {variacion && (
            <span
              className={cn(
                'text-cuerpo-sm inline-flex items-center gap-1 font-medium',
                CLASES_TEXTO_TONO[variacion.tono],
              )}
            >
              <Icono
                nombre={variacion.tono === 'peligro' ? 'trending-down' : 'trending-up'}
                tamano="xs"
              />
              {variacion.texto}
            </span>
          )}
          {contexto && <span className="text-cuerpo-sm text-terciario">{contexto}</span>}
        </div>
      )}
    </Tarjeta>
  );
}
