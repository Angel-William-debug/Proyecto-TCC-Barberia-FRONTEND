'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { Campo, EstadoVacio, Icono } from '@barber-shop/ui';

export interface EntradaBuscador {
  id: string;
  titulo: string;
  resumen: string;
  categoria: string;
  palabras: readonly string[];
}

/** Sin tildes y en minúsculas: «configuracion» encuentra «Configuración». */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * La caja de búsqueda del centro de ayuda.
 *
 * Filtra en el navegador: el rol ve como mucho unos setenta artículos, y
 * buscar mientras se escribe responde mejor que ir al servidor por cada
 * letra. Mientras la caja está vacía se muestran las secciones (`children`).
 */
export function BuscadorAyuda({
  entradas,
  base,
  ejemplo,
  children,
}: {
  entradas: EntradaBuscador[];
  base: string;
  /** Texto de ejemplo de la caja, con tareas de ese rol. */
  ejemplo: string;
  children: ReactNode;
}) {
  const [consulta, setConsulta] = useState('');

  const resultados = useMemo(() => {
    const terminos = normalizar(consulta).split(/\s+/).filter(Boolean);
    if (terminos.length === 0) return null;
    return entradas
      .map((e) => {
        const titulo = normalizar(e.titulo);
        const resto = normalizar([e.resumen, e.categoria, ...e.palabras].join(' '));
        if (!terminos.every((t) => titulo.includes(t) || resto.includes(t))) return null;
        // Primero lo que coincide en el título: es lo que la persona tiene en mente.
        const puntos = terminos.filter((t) => titulo.includes(t)).length;
        return { e, puntos };
      })
      .filter((r): r is { e: EntradaBuscador; puntos: number } => r !== null)
      .sort((a, b) => b.puntos - a.puntos)
      .map((r) => r.e);
  }, [consulta, entradas]);

  return (
    <>
      <div className="max-w-xl">
        <Campo
          etiqueta="¿Qué necesita hacer?"
          type="search"
          value={consulta}
          onChange={(ev) => setConsulta(ev.target.value)}
          placeholder={ejemplo}
          autoComplete="off"
        />
      </div>

      <div className="mt-6" aria-live="polite">
        {resultados === null ? (
          children
        ) : resultados.length === 0 ? (
          <EstadoVacio
            icono="search"
            titulo="No encontramos un artículo con esas palabras"
            descripcion="Pruebe con otra palabra, o recorra las secciones borrando la búsqueda."
          />
        ) : (
          <>
            <p className="text-cuerpo-sm text-terciario mb-3">
              {resultados.length === 1 ? '1 artículo' : `${resultados.length} artículos`}
            </p>
            <ul className="border-borde-sutil bg-superficie divide-borde-sutil divide-y rounded-lg border">
              {resultados.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`${base}/${r.id}`}
                    className="hover:bg-elevado flex items-start justify-between gap-4 p-4 transition-colors"
                  >
                    <span>
                      <span className="text-principal block font-medium">{r.titulo}</span>
                      <span className="text-cuerpo-sm text-terciario block">{r.resumen}</span>
                    </span>
                    <Icono nombre="chevron-right" tamano="sm" className="text-terciario mt-1 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
