'use client';

import type { ReactNode } from 'react';

import { Icono } from '../icono';
import { cn } from '../../utilidades';

/**
 * Agrupacion y armazon del formulario (secciones 9.11.1 y 9.11.4).
 *
 * `GrupoCampos` es un `fieldset` de verdad, no un div con un titulo: asi el
 * lector de pantalla anuncia a que grupo pertenece cada campo.
 */
// ---------------------------------------------------------------------------

/**
 * Grupo de campos con titulo. Un formulario de mas de seis campos sin grupos
 * se lee como una lista sin jerarquia.
 *
 * Es un `fieldset` de verdad, no un div con un titulo: el lector de pantalla
 * anuncia la leyenda al entrar en cada campo del grupo.
 */
export function GrupoCampos({
  titulo,
  descripcion,
  children,
}: {
  titulo?: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      {titulo && (
        <legend className="text-titulillo text-terciario mb-3 font-semibold tracking-[0.08em] uppercase">
          {titulo}
        </legend>
      )}
      {descripcion && <p className="text-cuerpo-sm text-terciario -mt-1 mb-3">{descripcion}</p>}
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

/**
 * Dos campos en una fila. Solo para pares cortos y relacionados -precio y
 * duracion, stock minimo y maximo-. En movil se apilan siempre.
 */
export function FilaCampos({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/** Separacion estandar entre grupos dentro del panel. */
export function CuerpoFormulario({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

/**
 * Aviso al pie del encabezado del formulario, para el error que no pertenece a
 * ningun campo: la conexion que falla, la regla de negocio que rechaza la base.
 *
 * Va arriba de todo y con `role="alert"`, de modo que el lector de pantalla lo
 * anuncie sin que el foco se mueva (criterio 4.1.3 de la WCAG).
 */
export function AvisoFormulario({ mensaje, tono = 'peligro' }: { mensaje: string; tono?: 'peligro' | 'info' }) {
  const estilos =
    tono === 'peligro'
      ? 'border-peligro text-peligro bg-[var(--chip-peligro-fondo)]'
      : 'border-info text-info bg-[var(--chip-info-fondo)]';

  return (
    <div role="alert" className={cn('text-cuerpo-sm flex items-start gap-2 rounded-md border p-3', estilos)}>
      <Icono nombre={tono === 'peligro' ? 'circle-alert' : 'bell'} tamano="sm" className="mt-0.5" />
      <span>{mensaje}</span>
    </div>
  );
}
