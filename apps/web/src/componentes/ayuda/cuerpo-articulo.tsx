import Link from 'next/link';

import { Icono } from '@barber-shop/ui';

import type { Bloque, Segmento } from '@/lib/ayuda/markdown';

/** Una línea con sus negritas y sus enlaces a otros artículos. */
function Linea({ segmentos, base }: { segmentos: Segmento[]; base: string }) {
  return (
    <>
      {segmentos.map((s, i) =>
        s.enlace ? (
          <Link
            key={i}
            href={`${base}/${s.enlace}`}
            className="text-marca font-medium underline decoration-1 underline-offset-2 hover:no-underline"
          >
            {s.texto}
          </Link>
        ) : s.negrita ? (
          <strong key={i} className="text-principal font-semibold">
            {s.texto}
          </strong>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}

/**
 * El cuerpo de un artículo de ayuda, dibujado con las clases del sistema de
 * diseño. Los mismos bloques alimentan el PDF; ver `lib/ayuda/markdown.ts`.
 */
export function CuerpoArticulo({ bloques, base }: { bloques: Bloque[]; base: string }) {
  return (
    <div className="text-cuerpo text-secundario medida-lectura space-y-4 leading-relaxed">
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case 'subtitulo':
            return (
              <h2 key={i} className="text-titulo-3 text-principal pt-4 font-semibold">
                {b.texto}
              </h2>
            );
          case 'parrafo':
            return (
              <p key={i}>
                <Linea segmentos={b.segmentos} base={base} />
              </p>
            );
          case 'pasos':
            return (
              <ol key={i} className="space-y-2">
                {b.items.map((item, j) => (
                  <li key={j} className="flex gap-3">
                    <span
                      className="bg-elevado text-marca text-etiqueta flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-semibold"
                      aria-hidden="true"
                    >
                      {j + 1}
                    </span>
                    <span className="pt-0.5">
                      <span className="solo-lectores">Paso {j + 1}: </span>
                      <Linea segmentos={item} base={base} />
                    </span>
                  </li>
                ))}
              </ol>
            );
          case 'lista':
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-6 marker:text-[var(--marca)]">
                {b.items.map((item, j) => (
                  <li key={j}>
                    <Linea segmentos={item} base={base} />
                  </li>
                ))}
              </ul>
            );
          case 'nota':
            return (
              <div
                key={i}
                role="note"
                className={
                  b.advertencia
                    ? 'border-peligro bg-elevado flex gap-3 rounded-md border-l-4 p-4'
                    : 'border-marca bg-elevado flex gap-3 rounded-md border-l-4 p-4'
                }
              >
                <Icono
                  nombre={b.advertencia ? 'triangle-alert' : 'circle-alert'}
                  tamano="sm"
                  className={b.advertencia ? 'text-peligro mt-0.5 shrink-0' : 'text-marca mt-0.5 shrink-0'}
                />
                <p>
                  <span className="solo-lectores">{b.advertencia ? 'Atención: ' : 'Nota: '}</span>
                  <Linea segmentos={b.segmentos} base={base} />
                </p>
              </div>
            );
        }
      })}
    </div>
  );
}
