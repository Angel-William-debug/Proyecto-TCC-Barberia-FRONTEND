/**
 * El manual de usuario en PDF (centro de ayuda, 18/11/2026).
 *
 * Recibe el contenido ya armado -secciones, artículos y sus bloques- y lo
 * dibuja con `pdf-lib`, igual que los reportes y los comprobantes: sin un
 * Chromium en el servidor. No sabe nada de roles ni de dónde sale el texto;
 * eso lo resuelve `apps/web/src/lib/ayuda`, que es quien filtra por rol.
 *
 * Estructura: portada, índice con número de página, y una sección por
 * categoría. Cada artículo lleva su título, su resumen, la captura de la
 * pantalla si tiene, y el cuerpo (párrafos, subtítulos, pasos numerados,
 * viñetas y recuadros de nota o advertencia).
 *
 * Helvetica es WinAnsi: tildes, eñes, «», ¿ y la raya entran; una flecha o un
 * emoji no, y `pdf-lib` lanzaría. `apto()` reemplaza lo que no se puede
 * codificar antes de medir o dibujar.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';

export interface SegmentoManual {
  texto: string;
  negrita?: boolean;
  /** El segmento es una referencia a otro artículo: se destaca con el color de marca. */
  enlace?: boolean;
}

export type BloqueManual =
  | { tipo: 'parrafo'; segmentos: SegmentoManual[] }
  | { tipo: 'subtitulo'; texto: string }
  | { tipo: 'pasos'; items: SegmentoManual[][] }
  | { tipo: 'lista'; items: SegmentoManual[][] }
  | { tipo: 'nota'; advertencia: boolean; segmentos: SegmentoManual[] };

export interface ArticuloManual {
  titulo: string;
  resumen: string;
  bloques: BloqueManual[];
  /** PNG de la captura de pantalla, si el artículo tiene. */
  imagen?: Uint8Array;
  descripcionImagen?: string;
}

export interface SeccionManual {
  titulo: string;
  descripcion: string;
  articulos: ArticuloManual[];
}

export interface DatosManual {
  /** «Manual de usuario» */
  titulo: string;
  /** «Recepcionista», «Todos los roles»… */
  subtitulo: string;
  /** Texto de la portada, debajo del título. */
  presentacion: string;
  /**
   * El logo de la barbería (PNG): `portada`, el ícono con su fondo carbón,
   * que se lee sobre la banda ámbar; `pie`, el isotipo dorado sin fondo,
   * chico, en el pie de cada página. Sin ellos el manual sale igual.
   */
  logo?: { portada?: Uint8Array; pie?: Uint8Array };
  /** Fecha de generación, ya formateada. */
  fecha: string;
  secciones: SeccionManual[];
}

// A4, en puntos. El manual se imprime en Paraguay, donde el papel es A4.
const ANCHO = 595;
const ALTO = 842;
const MARGEN = 56;
const ANCHO_UTIL = ANCHO - MARGEN * 2;
const PIE = 48;

const COLOR_MARCA = rgb(0.522, 0.357, 0.098); // --ambar-700
const COLOR_SOBRE_MARCA = rgb(1, 1, 1);
const COLOR_MARCA_SUAVE = rgb(0.973, 0.918, 0.835); // --ambar-100
const COLOR_NOTA_FONDO = rgb(0.984, 0.957, 0.894); // --ambar-50
const COLOR_AVISO_FONDO = rgb(0.992, 0.925, 0.918);
const COLOR_AVISO_BORDE = rgb(0.72, 0.2, 0.17);
const COLOR_TEXTO = rgb(0.078, 0.067, 0.059); // --carbon-900
const COLOR_SECUNDARIO = rgb(0.361, 0.329, 0.294);
const COLOR_BORDE = rgb(0.906, 0.882, 0.843);

const CUERPO = 10.5;
const INTERLINEA = 15;

const REEMPLAZOS: Record<string, string> = {
  '→': '->',
  '←': '<-',
  '≥': '>=',
  '≤': '<=',
  '✓': '',
  '✔': '',
  '×': 'x',
  ' ': ' ',
  ' ': ' ',
};

interface Fuentes {
  normal: PDFFont;
  negrita: PDFFont;
  cursiva: PDFFont;
}

export async function generarPdfManual(datos: DatosManual): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${datos.titulo} · ${datos.subtitulo}`);
  doc.setAuthor('Barber Shop');
  doc.setLanguage('es-PY');

  const f: Fuentes = {
    normal: await doc.embedFont(StandardFonts.Helvetica),
    negrita: await doc.embedFont(StandardFonts.HelveticaBold),
    cursiva: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  // Caracteres que Helvetica no codifica: se descubren una vez y se cachean.
  const codificables = new Map<string, boolean>();
  const apto = (texto: string): string =>
    [...texto]
      .map((c) => {
        if (c in REEMPLAZOS) return REEMPLAZOS[c]!;
        let ok = codificables.get(c);
        if (ok === undefined) {
          try {
            f.normal.encodeText(c);
            ok = true;
          } catch {
            ok = false;
          }
          codificables.set(c, ok);
        }
        return ok ? c : '';
      })
      .join('');

  const logoPortada = datos.logo?.portada ? await doc.embedPng(datos.logo.portada).catch(() => undefined) : undefined;
  const logoPie = datos.logo?.pie ? await doc.embedPng(datos.logo.pie).catch(() => undefined) : undefined;

  // --- Portada ----------------------------------------------------------
  const portada = doc.addPage([ANCHO, ALTO]);
  portada.drawRectangle({ x: 0, y: ALTO - 300, width: ANCHO, height: 300, color: COLOR_MARCA });
  portada.drawText('BARBER SHOP', { x: MARGEN, y: ALTO - 90, size: 12, font: f.negrita, color: COLOR_MARCA_SUAVE });
  if (logoPortada) {
    // Arriba a la derecha de la banda, del alto del título y el subtítulo.
    const lado = 120;
    portada.drawImage(logoPortada, { x: ANCHO - MARGEN - lado, y: ALTO - 230, width: lado, height: lado });
  }
  portada.drawText(apto(datos.titulo), { x: MARGEN, y: ALTO - 170, size: 34, font: f.negrita, color: COLOR_SOBRE_MARCA });
  portada.drawText(apto(datos.subtitulo), { x: MARGEN, y: ALTO - 210, size: 18, font: f.normal, color: COLOR_SOBRE_MARCA });
  portada.drawText(apto(`Generado el ${datos.fecha}`), { x: MARGEN, y: ALTO - 270, size: 10, font: f.normal, color: COLOR_MARCA_SUAVE });
  {
    let y = ALTO - 360;
    for (const linea of envolver([{ texto: apto(datos.presentacion) }], f, 12, ANCHO_UTIL)) {
      dibujarLinea(portada, linea, MARGEN, y, 12, f);
      y -= 18;
    }
  }

  // --- Cuerpo -----------------------------------------------------------
  // El índice se inserta después, cuando ya se sabe en qué página quedó cada
  // artículo. Aquí se anota la página (contando desde la primera del cuerpo).
  const cuerpo: PDFPage[] = [];
  const entradasIndice: Array<{ texto: string; nivel: 0 | 1; pagina: number }> = [];
  // Las capturas se incrustan antes de maquetar (es asíncrono) y una sola vez
  // cada una, aunque dos artículos usen la misma pantalla.
  const imagenes = new Map<Uint8Array, PDFImage>();
  for (const s of datos.secciones) {
    for (const a of s.articulos) {
      if (a.imagen && !imagenes.has(a.imagen)) {
        try {
          imagenes.set(a.imagen, await doc.embedPng(a.imagen));
        } catch {
          // Una captura dañada no impide el manual: el artículo sale sin ella.
        }
      }
    }
  }

  let pagina!: PDFPage;
  let y = 0;
  const nuevaPagina = () => {
    pagina = doc.addPage([ANCHO, ALTO]);
    cuerpo.push(pagina);
    y = ALTO - MARGEN;
  };
  /** Garantiza `alto` puntos libres antes del pie; si no, salta de página. */
  const reservar = (alto: number) => {
    if (y - alto < PIE + 16) nuevaPagina();
  };

  const parrafo = (segmentos: SegmentoManual[], sangria = 0, size = CUERPO, color = COLOR_TEXTO) => {
    const lineas = envolver(
      segmentos.map((s) => ({ ...s, texto: apto(s.texto) })),
      f,
      size,
      ANCHO_UTIL - sangria,
    );
    for (const linea of lineas) {
      reservar(INTERLINEA);
      dibujarLinea(pagina, linea, MARGEN + sangria, y - size, size, f, color);
      y -= INTERLINEA;
    }
  };

  for (const seccion of datos.secciones) {
    nuevaPagina();
    entradasIndice.push({ texto: seccion.titulo, nivel: 0, pagina: cuerpo.length });

    // Encabezado de sección: banda de marca angosta.
    pagina.drawRectangle({ x: 0, y: y - 46, width: ANCHO, height: 62, color: COLOR_MARCA });
    pagina.drawText(apto(seccion.titulo), { x: MARGEN, y: y - 18, size: 20, font: f.negrita, color: COLOR_SOBRE_MARCA });
    pagina.drawText(apto(seccion.descripcion), { x: MARGEN, y: y - 36, size: 10, font: f.normal, color: COLOR_MARCA_SUAVE });
    y -= 80;

    seccion.articulos.forEach((articulo, indice) => {
      // Un artículo no empieza en el último cuarto de la página: el título
      // quedaría solo, separado de su contenido.
      if (indice > 0) {
        reservar(ALTO * 0.25);
        y -= 10;
        pagina.drawLine({ start: { x: MARGEN, y }, end: { x: ANCHO - MARGEN, y }, thickness: 0.6, color: COLOR_BORDE });
        y -= 22;
      }
      entradasIndice.push({ texto: articulo.titulo, nivel: 1, pagina: cuerpo.length });

      for (const linea of envolver([{ texto: apto(articulo.titulo), negrita: true }], f, 15, ANCHO_UTIL)) {
        reservar(22);
        dibujarLinea(pagina, linea, MARGEN, y - 15, 15, f, COLOR_TEXTO);
        y -= 21;
      }
      y -= 2;
      for (const linea of envolver([{ texto: apto(articulo.resumen) }], { ...f, normal: f.cursiva }, CUERPO, ANCHO_UTIL)) {
        reservar(INTERLINEA);
        dibujarLinea(pagina, linea, MARGEN, y - CUERPO, CUERPO, { ...f, normal: f.cursiva }, COLOR_SECUNDARIO);
        y -= INTERLINEA;
      }
      y -= 8;

      const imagen = articulo.imagen ? imagenes.get(articulo.imagen) : undefined;
      if (imagen) {
        // A lo ancho de la caja, sin pasar de un tercio de la página de alto.
        const escala = Math.min(ANCHO_UTIL / imagen.width, (ALTO * 0.36) / imagen.height);
        const w = imagen.width * escala;
        const h = imagen.height * escala;
        reservar(h + 30);
        pagina.drawRectangle({
          x: MARGEN + (ANCHO_UTIL - w) / 2 - 1,
          y: y - h - 1,
          width: w + 2,
          height: h + 2,
          borderColor: COLOR_BORDE,
          borderWidth: 1,
        });
        pagina.drawImage(imagen, { x: MARGEN + (ANCHO_UTIL - w) / 2, y: y - h, width: w, height: h });
        y -= h + 14;
        if (articulo.descripcionImagen) {
          const texto = recortar(apto(articulo.descripcionImagen), f.cursiva, 8.5, ANCHO_UTIL);
          pagina.drawText(texto, {
            x: MARGEN + (ANCHO_UTIL - f.cursiva.widthOfTextAtSize(texto, 8.5)) / 2,
            y,
            size: 8.5,
            font: f.cursiva,
            color: COLOR_SECUNDARIO,
          });
          y -= 18;
        }
      }

      for (const bloque of articulo.bloques) {
        switch (bloque.tipo) {
          case 'subtitulo':
            reservar(INTERLINEA * 3);
            y -= 6;
            pagina.drawText(apto(bloque.texto), { x: MARGEN, y: y - 12, size: 12, font: f.negrita, color: COLOR_MARCA });
            y -= 20;
            break;
          case 'parrafo':
            parrafo(bloque.segmentos);
            y -= 6;
            break;
          case 'pasos':
          case 'lista':
            bloque.items.forEach((item, i) => {
              const marca = bloque.tipo === 'pasos' ? `${i + 1}.` : '•';
              reservar(INTERLINEA);
              const anclaY = y;
              const anclaPagina = pagina;
              parrafo(item, 18);
              anclaPagina.drawText(marca, {
                x: MARGEN + 2,
                y: anclaY - CUERPO,
                size: CUERPO,
                font: bloque.tipo === 'pasos' ? f.negrita : f.normal,
                color: COLOR_MARCA,
              });
              y -= 3;
            });
            y -= 4;
            break;
          case 'nota': {
            const prefijo: SegmentoManual = {
              texto: bloque.advertencia ? 'Atención: ' : 'Nota: ',
              negrita: true,
            };
            const lineas = envolver(
              [prefijo, ...bloque.segmentos].map((s) => ({ ...s, texto: apto(s.texto) })),
              f,
              CUERPO,
              ANCHO_UTIL - 24,
            );
            const alto = lineas.length * INTERLINEA + 14;
            // Una nota corta no se parte entre páginas; una larga sí, línea a línea.
            if (alto < ALTO / 3) reservar(alto);
            y -= 4;
            let inicio = y;
            let paginaNota = pagina;
            const cerrarRecuadro = (hasta: number) => {
              paginaNota.drawRectangle({
                x: MARGEN,
                y: hasta,
                width: ANCHO_UTIL,
                height: inicio - hasta,
                color: bloque.advertencia ? COLOR_AVISO_FONDO : COLOR_NOTA_FONDO,
              });
              paginaNota.drawRectangle({
                x: MARGEN,
                y: hasta,
                width: 3,
                height: inicio - hasta,
                color: bloque.advertencia ? COLOR_AVISO_BORDE : COLOR_MARCA,
              });
            };
            // Primero se dibujan los fondos y después el texto encima: se
            // guardan las líneas con su posición y se pintan al final.
            const pendientes: Array<{ p: PDFPage; linea: Linea; y: number }> = [];
            y -= 7;
            for (const linea of lineas) {
              if (y - INTERLINEA < PIE + 16) {
                cerrarRecuadro(y);
                nuevaPagina();
                paginaNota = pagina;
                inicio = y;
                y -= 7;
              }
              pendientes.push({ p: pagina, linea, y: y - CUERPO });
              y -= INTERLINEA;
            }
            y -= 7;
            cerrarRecuadro(y);
            for (const { p, linea, y: ly } of pendientes) dibujarLinea(p, linea, MARGEN + 14, ly, CUERPO, f);
            y -= 10;
            break;
          }
        }
      }
    });
  }

  // --- Índice -----------------------------------------------------------
  // Margen de sobra: cada título de sección suma 4 puntos a su línea y la
  // primera hoja lleva además el encabezado «Índice».
  const LINEAS_POR_PAGINA_INDICE = Math.floor((ALTO - MARGEN - PIE - 120) / 17);
  const paginasIndice = Math.max(1, Math.ceil(entradasIndice.length / LINEAS_POR_PAGINA_INDICE));
  // Portada + índice antes del cuerpo.
  const desplazamiento = 1 + paginasIndice;

  for (let p = 0; p < paginasIndice; p++) {
    const hoja = doc.insertPage(1 + p, [ANCHO, ALTO]);
    let yi = ALTO - MARGEN;
    if (p === 0) {
      hoja.drawText('Índice', { x: MARGEN, y: yi - 22, size: 22, font: f.negrita, color: COLOR_TEXTO });
      yi -= 50;
    }
    const tramo = entradasIndice.slice(p * LINEAS_POR_PAGINA_INDICE, (p + 1) * LINEAS_POR_PAGINA_INDICE);
    for (const e of tramo) {
      const fuente = e.nivel === 0 ? f.negrita : f.normal;
      const size = e.nivel === 0 ? 11 : 10;
      const x = MARGEN + (e.nivel === 0 ? 0 : 14);
      const numero = String(e.pagina + desplazamiento);
      const anchoNumero = fuente.widthOfTextAtSize(numero, size);
      const texto = recortar(apto(e.texto), fuente, size, ANCHO_UTIL - (x - MARGEN) - anchoNumero - 24);
      if (e.nivel === 0) yi -= 4;
      hoja.drawText(texto, { x, y: yi - size, size, font: fuente, color: e.nivel === 0 ? COLOR_MARCA : COLOR_TEXTO });
      // Puntos guía entre el título y el número de página.
      const desdeX = x + fuente.widthOfTextAtSize(texto, size) + 6;
      const hastaX = ANCHO - MARGEN - anchoNumero - 6;
      if (hastaX > desdeX) {
        const puntos = '.'.repeat(Math.floor((hastaX - desdeX) / f.normal.widthOfTextAtSize('.', 9)));
        hoja.drawText(puntos, { x: desdeX, y: yi - size, size: 9, font: f.normal, color: COLOR_BORDE });
      }
      hoja.drawText(numero, { x: ANCHO - MARGEN - anchoNumero, y: yi - size, size, font: fuente, color: COLOR_SECUNDARIO });
      yi -= 16;
    }
  }

  // --- Pie con número de página (todas menos la portada) ---------------
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    if (i === 0) return;
    p.drawLine({ start: { x: MARGEN, y: PIE }, end: { x: ANCHO - MARGEN, y: PIE }, thickness: 0.5, color: COLOR_BORDE });
    const izquierda = apto(`${datos.titulo} · ${datos.subtitulo}`);
    let xTexto = MARGEN;
    if (logoPie) {
      const alto = 14;
      const ancho = (logoPie.width / logoPie.height) * alto;
      p.drawImage(logoPie, { x: MARGEN, y: PIE - 18, width: ancho, height: alto });
      xTexto += ancho + 6;
    }
    p.drawText(izquierda, { x: xTexto, y: PIE - 14, size: 8, font: f.normal, color: COLOR_SECUNDARIO });
    const numero = `Página ${i + 1} de ${paginas.length}`;
    p.drawText(apto(numero), {
      x: ANCHO - MARGEN - f.normal.widthOfTextAtSize(apto(numero), 8),
      y: PIE - 14,
      size: 8,
      font: f.normal,
      color: COLOR_SECUNDARIO,
    });
  });

  return Buffer.from(await doc.save());
}

// ---------------------------------------------------------------------------
// Texto con negritas, envuelto a un ancho
// ---------------------------------------------------------------------------

interface Trozo {
  texto: string;
  fuente: PDFFont;
  color?: ReturnType<typeof rgb>;
}
type Linea = Trozo[];

function fuenteDe(s: SegmentoManual, f: Fuentes): PDFFont {
  return s.negrita || s.enlace ? f.negrita : f.normal;
}

/**
 * Parte los segmentos en líneas que entran en `ancho`, palabra por palabra,
 * respetando la fuente de cada una: una negrita en mitad de un párrafo mide
 * más que el mismo texto en normal.
 */
function envolver(segmentos: SegmentoManual[], f: Fuentes, size: number, ancho: number): Linea[] {
  const palabras: Trozo[] = [];
  for (const s of segmentos) {
    const fuente = fuenteDe(s, f);
    const color = s.enlace ? COLOR_MARCA : undefined;
    // Se conservan los espacios pegados a la palabra que les sigue, para que
    // «**Nuevo turno**, luego» no pierda la coma ni sume espacios.
    for (const parte of s.texto.split(/(?=\s)/)) {
      if (parte) palabras.push({ texto: parte, fuente, color });
    }
  }

  const lineas: Linea[] = [];
  let actual: Linea = [];
  let usado = 0;
  for (const p of palabras) {
    const texto = actual.length === 0 ? p.texto.trimStart() : p.texto;
    if (!texto) continue;
    const w = p.fuente.widthOfTextAtSize(texto, size);
    if (usado + w > ancho && actual.length > 0) {
      lineas.push(actual);
      const limpio = p.texto.trimStart();
      actual = [{ ...p, texto: limpio }];
      usado = p.fuente.widthOfTextAtSize(limpio, size);
    } else {
      actual.push({ ...p, texto });
      usado += w;
    }
  }
  if (actual.length > 0) lineas.push(actual);
  return lineas;
}

function dibujarLinea(
  pagina: PDFPage,
  linea: Linea,
  x: number,
  y: number,
  size: number,
  _f: Fuentes,
  color = COLOR_TEXTO,
) {
  let cx = x;
  for (const t of linea) {
    pagina.drawText(t.texto, { x: cx, y, size, font: t.fuente, color: t.color ?? color });
    cx += t.fuente.widthOfTextAtSize(t.texto, size);
  }
}

function recortar(texto: string, fuente: PDFFont, size: number, ancho: number): string {
  if (fuente.widthOfTextAtSize(texto, size) <= ancho) return texto;
  let r = texto;
  while (r.length > 1 && fuente.widthOfTextAtSize(`${r}...`, size) > ancho) r = r.slice(0, -1);
  return `${r}...`;
}
