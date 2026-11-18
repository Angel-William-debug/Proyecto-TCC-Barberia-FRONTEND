/**
 * Lector del markdown recortado de los artículos de ayuda
 * (ver `contenido/ayuda/tipos.ts`).
 *
 * Devuelve bloques en lugar de HTML: la pantalla los dibuja con componentes
 * del sistema de diseño y el PDF (`generarPdfManual`) con `pdf-lib`. Así un
 * mismo artículo se ve igual de ordenado en los dos lados sin un parser de
 * markdown completo, que acá no hace falta.
 */

export interface Segmento {
  texto: string;
  negrita?: boolean;
  /** `id` del artículo enlazado con `[[id]]`. */
  enlace?: string;
}

export type Bloque =
  | { tipo: 'parrafo'; segmentos: Segmento[] }
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'pasos'; items: Segmento[][] }
  | { tipo: 'lista'; items: Segmento[][] }
  | { tipo: 'nota'; advertencia: boolean; segmentos: Segmento[] };

/**
 * Cómo se resuelve un `[[id]]`: el título del artículo y si quien lee puede
 * abrirlo. `undefined` si el artículo no existe.
 */
export type Resolutor = (id: string) => { titulo: string; abrible: boolean } | undefined;

/** `**negrita**` y `[[id]]` dentro de una línea. */
export function segmentar(linea: string, tituloDe: Resolutor): Segmento[] {
  const segmentos: Segmento[] = [];
  const patron = /\*\*(.+?)\*\*|\[\[([a-z0-9-]+)\]\]/g;
  let desde = 0;
  for (const m of linea.matchAll(patron)) {
    if (m.index! > desde) segmentos.push({ texto: linea.slice(desde, m.index) });
    if (m[1] !== undefined) {
      segmentos.push({ texto: m[1], negrita: true });
    } else {
      const id = m[2]!;
      const destino = tituloDe(id);
      // Un artículo que el rol no lee se nombra por su título, sin enlace:
      // mejor nombrar la tarea (que hace otro rol) que mandar a una página
      // que le daría «no encontrado».
      if (!destino) segmentos.push({ texto: id });
      else if (destino.abrible) segmentos.push({ texto: `«${destino.titulo}»`, enlace: id });
      else segmentos.push({ texto: `«${destino.titulo}»` });
    }
    desde = m.index! + m[0].length;
  }
  if (desde < linea.length) segmentos.push({ texto: linea.slice(desde) });
  return segmentos;
}

export function leerCuerpo(cuerpo: string, tituloDe: Resolutor): Bloque[] {
  const bloques: Bloque[] = [];
  const lineas = cuerpo.replace(/\r\n/g, '\n').split('\n');

  let parrafo: string[] = [];
  const cerrarParrafo = () => {
    if (parrafo.length) {
      bloques.push({ tipo: 'parrafo', segmentos: segmentar(parrafo.join(' '), tituloDe) });
      parrafo = [];
    }
  };

  for (const cruda of lineas) {
    const linea = cruda.trim();
    if (!linea) {
      cerrarParrafo();
      continue;
    }

    const ultimo = bloques[bloques.length - 1];

    if (linea.startsWith('## ')) {
      cerrarParrafo();
      bloques.push({ tipo: 'subtitulo', texto: linea.slice(3).trim() });
      continue;
    }

    const paso = /^\d+[.)]\s+(.*)$/.exec(linea);
    if (paso) {
      cerrarParrafo();
      const item = segmentar(paso[1]!, tituloDe);
      if (ultimo?.tipo === 'pasos' && parrafo.length === 0) ultimo.items.push(item);
      else bloques.push({ tipo: 'pasos', items: [item] });
      continue;
    }

    if (linea.startsWith('- ') || linea.startsWith('* ')) {
      cerrarParrafo();
      const item = segmentar(linea.slice(2).trim(), tituloDe);
      if (ultimo?.tipo === 'lista') ultimo.items.push(item);
      else bloques.push({ tipo: 'lista', items: [item] });
      continue;
    }

    if (linea.startsWith('>')) {
      cerrarParrafo();
      let texto = linea.slice(1).trim();
      const advertencia = texto.startsWith('!');
      if (advertencia) texto = texto.slice(1).trim();
      // Varias líneas `>` seguidas son una sola nota.
      if (ultimo?.tipo === 'nota' && !advertencia && texto) {
        ultimo.segmentos.push({ texto: ' ' }, ...segmentar(texto, tituloDe));
      } else {
        bloques.push({ tipo: 'nota', advertencia, segmentos: segmentar(texto, tituloDe) });
      }
      continue;
    }

    parrafo.push(linea);
  }
  cerrarParrafo();
  return bloques;
}
