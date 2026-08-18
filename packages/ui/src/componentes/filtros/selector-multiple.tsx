'use client';

import { useEffect, useRef } from 'react';

import { Icono } from '../icono';
import { useFiltros } from './url';
import type { Opcion } from './selector-filtro';
import { cn } from '../../utilidades';

/**
 * Selector de varios valores a la vez. Los escribe separados por coma.
 *
 * Es el unico control de filtro que no es nativo, porque no existe un
 * equivalente del navegador que se pueda usar con el pulgar.
 */
export interface PropsSelectorMultiple {
  nombre: string;
  etiqueta: string;
  opciones: Opcion[];
}

/**
 * Selección múltiple. Los valores viajan en un solo parámetro separados por
 * coma: `?estado=pendiente,confirmado`.
 *
 * Se apoya en `<details>` y `<summary>` nativos para abrir y cerrar. Eso
 * resuelve gratis el foco, la tecla Escape y el anuncio del estado
 * abierto/cerrado a los lectores de pantalla, que es justamente lo que suele
 * quedar mal en los desplegables hechos a mano.
 */
export function SelectorMultiple({ nombre, etiqueta, opciones }: PropsSelectorMultiple) {
  const { params, aplicar } = useFiltros();
  const contenedor = useRef<HTMLDetailsElement>(null);

  const crudo = params.get(nombre) ?? '';
  const elegidos = crudo ? crudo.split(',').filter(Boolean) : [];

  // Cierra al hacer clic fuera. `<details>` no lo hace por su cuenta.
  useEffect(() => {
    function alClicar(evento: MouseEvent) {
      const nodo = contenedor.current;
      if (nodo?.open && !nodo.contains(evento.target as Node)) nodo.open = false;
    }
    document.addEventListener('mousedown', alClicar);
    return () => document.removeEventListener('mousedown', alClicar);
  }, []);

  function alternar(valor: string) {
    const siguiente = elegidos.includes(valor)
      ? elegidos.filter((v) => v !== valor)
      : [...elegidos, valor];
    aplicar({ [nombre]: siguiente.length ? siguiente.join(',') : null });
  }

  const resumen =
    elegidos.length === 0
      ? 'Todos'
      : elegidos.length === 1
        ? (opciones.find((o) => o.valor === elegidos[0])?.etiqueta ?? '1 elegido')
        : `${elegidos.length} elegidos`;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario font-medium">{etiqueta}</span>
      <details ref={contenedor} className="relative">
        <summary
          className={cn(
            'bg-fondo border-borde-control text-principal text-cuerpo',
            'flex h-10 min-w-[10rem] cursor-pointer list-none items-center justify-between gap-2',
            'rounded-md border px-3 select-none',
            '[&::-webkit-details-marker]:hidden',
            elegidos.length > 0 && 'border-borde-foco',
          )}
        >
          <span className={elegidos.length === 0 ? 'text-terciario' : undefined}>{resumen}</span>
          <Icono nombre="chevron-down" tamano="sm" className="text-terciario" />
        </summary>

        <div
          className={cn(
            'bg-elevado border-borde-sutil absolute z-20 mt-1 min-w-full',
            'max-h-72 overflow-y-auto rounded-md border p-1 shadow-2',
          )}
        >
          {opciones.map((o) => {
            const marcado = elegidos.includes(o.valor);
            return (
              <label
                key={o.valor}
                className={cn(
                  'text-cuerpo text-principal flex cursor-pointer items-center gap-2.5',
                  'hover:bg-superficie rounded-sm px-2 py-2 whitespace-nowrap',
                )}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(o.valor)}
                  className="accent-[var(--marca)] h-4 w-4"
                />
                {o.etiqueta}
              </label>
            );
          })}
        </div>
      </details>
    </div>
  );
}
