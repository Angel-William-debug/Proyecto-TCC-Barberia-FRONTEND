'use client';

import { Icono } from '../icono';
import { Boton } from '../boton';
import { useFiltros } from './url';
import { cn } from '../../utilidades';

/**
 * Resumen de lo filtrado (seccion 9.9.2).
 *
 * Dice cuantos resultados quedaron y por que, con un boton para limpiar todo.
 * Sin esto, una tabla vacia por un filtro olvidado parece una tabla sin datos.
 */
export interface PropsFiltrosActivos {
  /** Traduce el nombre del parámetro y su valor a algo legible. */
  etiquetas: Record<string, { titulo: string; valores?: Record<string, string> }>;
  /** Cuántas filas quedaron. Se muestra junto a los chips. */
  total?: number;
  sustantivo?: [singular: string, plural: string];
}

/**
 * Chips de lo que está filtrado, con la cruz para quitar cada uno.
 *
 * No es un adorno: sin este resumen, alguien que dejó un filtro puesto y
 * vuelve media hora después ve una tabla «vacía» y cree que se perdieron los
 * datos. Es el mismo motivo por el que el estado vacío distingue «no hay
 * nada» de «no hay coincidencias».
 */
export function FiltrosActivos({
  etiquetas,
  total,
  sustantivo = ['resultado', 'resultados'],
}: PropsFiltrosActivos) {
  const { params, aplicar, limpiar } = useFiltros();

  const activos: Array<{ clave: string; texto: string }> = [];

  for (const [clave, config] of Object.entries(etiquetas)) {
    const crudo = params.get(clave);
    if (!crudo) continue;

    const partes = crudo.split(',').filter(Boolean);
    const legible = partes.map((p) => config.valores?.[p] ?? p).join(', ');
    activos.push({ clave, texto: `${config.titulo}: ${legible}` });
  }

  if (activos.length === 0) return null;

  return (
    <div className="border-borde-sutil flex flex-wrap items-center gap-2 border-b px-4 py-3">
      {total !== undefined && (
        <span className="text-cuerpo-sm text-secundario mr-1">
          {total} {total === 1 ? sustantivo[0] : sustantivo[1]}
        </span>
      )}

      {activos.map((a) => (
        <button
          key={a.clave}
          type="button"
          onClick={() => aplicar({ [a.clave]: null })}
          className={cn(
            'bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]',
            'text-etiqueta inline-flex h-6 items-center gap-1.5 rounded-sm px-2 font-medium',
            'hover:opacity-80',
          )}
        >
          {a.texto}
          <Icono nombre="x" tamano="xs" etiqueta={`Quitar filtro ${a.texto}`} />
        </button>
      ))}

      <Boton variante="terciario" tamano="sm" onClick={limpiar}>
        Limpiar todo
      </Boton>
    </div>
  );
}
