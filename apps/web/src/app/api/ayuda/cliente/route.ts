import { NextResponse } from 'next/server';

import { CATEGORIAS, articulosPara } from '@/contenido/ayuda';
import { leerCuerpo } from '@/lib/ayuda/markdown';

/**
 * El manual del cliente, para la app móvil (centro de ayuda, 18/11/2026).
 *
 * La app no copia los artículos: los pide acá cada vez que se abre la ayuda.
 * Así, corregir un artículo en `contenido/ayuda` llega a la app con el
 * próximo despliegue de la web, sin generar un APK nuevo.
 *
 * Es pública a propósito: la app la muestra también antes de ingresar (para
 * quien no puede entrar o no confirmó su correo), y el manual del cliente no
 * tiene nada que no se vea en la web. Solo se entregan los artículos del
 * rol cliente; los del personal no salen por acá.
 *
 * Los cuerpos van ya leídos en bloques (`lib/ayuda/markdown.ts`), para que la
 * app no tenga que interpretar markdown: solo dibujar.
 */
export function GET(peticion: Request) {
  const origen = new URL(peticion.url).origin;
  const propios = articulosPara('cliente');
  const ids = new Map(propios.map((a) => [a.id, a.titulo]));
  // Los enlaces [[id]] solo llevan a artículos del cliente; los demás (por
  // ejemplo, uno del personal) quedan nombrados, sin enlace.
  const resolver = (id: string) => {
    const titulo = ids.get(id);
    return titulo ? { titulo, abrible: true } : undefined;
  };

  const categorias = CATEGORIAS.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    descripcion: c.descripcion,
    articulos: propios
      .filter((a) => a.categoria === c.id)
      .map((a) => ({
        id: a.id,
        titulo: a.titulo,
        resumen: a.resumen,
        palabras: a.palabras ?? [],
        captura: a.captura
          ? { url: `${origen}/ayuda/capturas/${a.captura.archivo}`, descripcion: a.captura.descripcion }
          : null,
        bloques: leerCuerpo(a.cuerpo, resolver),
        relacionados: (a.relacionados ?? []).filter((id) => ids.has(id)),
      })),
  })).filter((c) => c.articulos.length > 0);

  return NextResponse.json(
    { ok: true, categorias },
    // Cambia solo con un despliegue: una hora en la CDN alcanza.
    { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } },
  );
}
