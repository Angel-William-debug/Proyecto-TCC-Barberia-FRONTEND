'use client';

import { useId } from 'react';

import { useFiltros } from './url';
import { cn } from '../../utilidades';

/** Selector de un solo valor. Elemento `select` nativo (seccion 9.9.1). */
export interface Opcion {
  valor: string;
  etiqueta: string;
}

export interface PropsSelectorFiltro {
  nombre: string;
  etiqueta: string;
  opciones: Opcion[];
  /** Texto de la opción que no filtra nada. */
  textoTodos?: string;
}

/**
 * Desplegable de opción única.
 *
 * Usa un `<select>` nativo a propósito. Un desplegable propio se ve más
 * moderno y funciona peor: el nativo ya trae navegación por teclado, búsqueda
 * escribiendo la inicial, y en el teléfono abre la rueda del sistema, que es
 * mucho más cómoda que una lista flotante.
 */
export function SelectorFiltro({
  nombre,
  etiqueta,
  opciones,
  textoTodos = 'Todos',
}: PropsSelectorFiltro) {
  const { params, aplicar } = useFiltros();
  const id = useId();
  const valor = params.get(nombre) ?? '';

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => aplicar({ [nombre]: e.target.value || null })}
        className={cn(
          'bg-fondo border-borde-control text-principal',
          'text-cuerpo h-10 min-w-[10rem] rounded-md border px-3',
        )}
      >
        <option value="">{textoTodos}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}
