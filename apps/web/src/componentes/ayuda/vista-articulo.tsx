import Link from 'next/link';

import type { NombreRol } from '@barber-shop/tipos';
import { Icono } from '@barber-shop/ui';

import { CATEGORIAS, type Articulo } from '@/contenido/ayuda';
import { articuloPorId, bloquesDe, etiquetaRol, puedeAbrir, seccionesPara } from '@/lib/ayuda';

import { CuerpoArticulo } from './cuerpo-articulo';

/**
 * Un artículo del centro de ayuda: título, resumen, para quién es, la
 * captura de la pantalla, el cuerpo y, al pie, los relacionados y los
 * vecinos de la misma sección.
 */
export function VistaArticulo({
  articulo,
  rol,
  rolSesion,
  base,
}: {
  articulo: Articulo;
  /** El manual desde el que se llegó: define «anterior» y «siguiente». */
  rol: NombreRol;
  rolSesion: NombreRol;
  base: string;
}) {
  const sufijoRol = rol === rolSesion ? '' : `?rol=${rol}`;
  const categoria = CATEGORIAS.find((c) => c.id === articulo.categoria);
  const bloques = bloquesDe(articulo, rolSesion);

  const relacionados = (articulo.relacionados ?? [])
    .map((id) => articuloPorId(id))
    .filter((a): a is Articulo => !!a && puedeAbrir(rolSesion, a));

  const hermanos = seccionesPara(rol).find((s) => s.categoria.id === articulo.categoria)?.articulos ?? [];
  const posicion = hermanos.findIndex((a) => a.id === articulo.id);
  const anterior = posicion > 0 ? hermanos[posicion - 1] : undefined;
  const siguiente = posicion >= 0 ? hermanos[posicion + 1] : undefined;

  return (
    <article>
      <nav aria-label="Ubicación" className="text-cuerpo-sm text-terciario mb-4 flex flex-wrap items-center gap-1">
        <Link href={`${base}${sufijoRol}`} className="hover:text-marca inline-flex items-center gap-1">
          <Icono nombre="chevron-left" tamano="sm" />
          Centro de ayuda
        </Link>
        {categoria && <span aria-hidden="true">·</span>}
        {categoria && <span>{categoria.titulo}</span>}
      </nav>

      <header className="mb-6">
        <h1 className="text-titulo-1 text-principal font-semibold">{articulo.titulo}</h1>
        <p className="text-cuerpo-lg text-secundario medida-lectura mt-2">{articulo.resumen}</p>
        <p className="text-cuerpo-sm text-terciario mt-2">
          Para: {articulo.roles.map((r) => etiquetaRol(r)).join(', ')}
        </p>
      </header>

      {articulo.captura && (
        <figure className="mb-8 max-w-4xl">
          {/* Captura del sistema publicado (qa-automatico/capturas.mjs).
              Un <img> y no next/image: son PNG fijos de public/, sin
              variantes que optimizar, y así se ven también sin el servidor
              de imágenes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/ayuda/capturas/${articulo.captura.archivo}`}
            alt={articulo.captura.descripcion}
            loading="lazy"
            className="border-borde-sutil w-full rounded-lg border"
          />
          <figcaption className="text-cuerpo-sm text-terciario mt-2">{articulo.captura.descripcion}</figcaption>
        </figure>
      )}

      <CuerpoArticulo bloques={bloques} base={base} />

      {relacionados.length > 0 && (
        <section aria-labelledby="relacionados" className="border-borde-sutil mt-10 border-t pt-6">
          <h2 id="relacionados" className="text-titulo-3 text-principal mb-3 font-semibold">
            También le puede servir
          </h2>
          <ul className="space-y-1">
            {relacionados.map((a) => (
              <li key={a.id}>
                <Link href={`${base}/${a.id}${sufijoRol}`} className="text-marca hover:underline">
                  {a.titulo}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(anterior || siguiente) && (
        <nav
          aria-label="Artículos de la misma sección"
          className="border-borde-sutil mt-8 flex flex-wrap justify-between gap-4 border-t pt-6"
        >
          {anterior ? (
            <Link href={`${base}/${anterior.id}${sufijoRol}`} className="group max-w-xs">
              <span className="text-cuerpo-sm text-terciario block">Anterior</span>
              <span className="text-secundario group-hover:text-marca">{anterior.titulo}</span>
            </Link>
          ) : (
            <span />
          )}
          {siguiente && (
            <Link href={`${base}/${siguiente.id}${sufijoRol}`} className="group max-w-xs text-right">
              <span className="text-cuerpo-sm text-terciario block">Siguiente</span>
              <span className="text-secundario group-hover:text-marca">{siguiente.titulo}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
