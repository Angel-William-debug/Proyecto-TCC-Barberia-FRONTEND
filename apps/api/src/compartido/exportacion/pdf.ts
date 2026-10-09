/**
 * Generacion de PDF con `pdf-lib`, dibujando texto a mano.
 *
 * Sin un motor HTML-a-PDF (Puppeteer, etc): eso significaria cargar un
 * Chromium completo en el servidor para imprimir una tabla y un
 * comprobante. `pdf-lib` es liviano y alcanza para lo que estas dos
 * pantallas necesitan.
 *
 * Los colores de acá son los mismos tokens de marca que usa la interfaz
 * (`packages/ui/src/tokens/colores.css`, tema claro: un PDF es papel, nunca
 * oscuro), pasados a RGB porque pdf-lib no entiende CSS.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const ANCHO_PAGINA = 612; // carta, en puntos
const ALTO_PAGINA = 792;
const MARGEN = 40;
const ALTO_FILA = 20;
const ALTO_BANDA = 52;
const RESERVA_PIE = 60;

const COLOR_MARCA = rgb(0.522, 0.357, 0.098); // --ambar-700
const COLOR_MARCA_TEXTO = rgb(1, 1, 1); // --texto-sobre-marca (tema claro)
const COLOR_MARCA_SUBTITULO = rgb(0.973, 0.918, 0.835); // --ambar-100, sobre la banda
const COLOR_ENCABEZADO_FONDO = rgb(0.984, 0.957, 0.894); // --ambar-50
const COLOR_BORDE_MARCA = rgb(0.886, 0.729, 0.4); // --ambar-300
const COLOR_TEXTO_PRINCIPAL = rgb(0.078, 0.067, 0.059); // --carbon-900
const COLOR_TEXTO_SECUNDARIO = rgb(0.361, 0.329, 0.294); // --texto-secundario (tema claro)
const COLOR_ZEBRA = rgb(0.98, 0.969, 0.949); // --hueso
const COLOR_BORDE_SUTIL = rgb(0.906, 0.882, 0.843); // --borde-sutil (tema claro)

export interface ColumnaReporte {
  clave: string;
  titulo: string;
  /** Ancho relativo: dos columnas con 2 y 1 quedan en proporcion 2 a 1. */
  ancho?: number;
  /** Alinea el encabezado y el valor a la derecha, como corresponde a un numero o un monto. */
  numerico?: boolean;
}

/** Recorta con puntos suspensivos midiendo el texto de verdad, no por cantidad de caracteres. */
function truncar(fuente: PDFFont, texto: string, size: number, anchoMax: number): string {
  if (fuente.widthOfTextAtSize(texto, size) <= anchoMax) return texto;
  let recortado = texto;
  while (recortado.length > 1 && fuente.widthOfTextAtSize(`${recortado}…`, size) > anchoMax) {
    recortado = recortado.slice(0, -1);
  }
  return `${recortado}…`;
}

/** Tabla generica con encabezado repetido en cada pagina, para los reportes (CU-014). */
export async function generarPdfTabla(
  titulo: string,
  subtitulo: string,
  columnas: ColumnaReporte[],
  filas: Array<Record<string, string>>,
): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const fuente = await doc.embedFont(StandardFonts.Helvetica);
  const fuenteNegrita = await doc.embedFont(StandardFonts.HelveticaBold);

  const anchoTotal = ANCHO_PAGINA - MARGEN * 2;
  const anchosRelativos = columnas.map((c) => c.ancho ?? 1);
  const sumaAnchos = anchosRelativos.reduce((s, a) => s + a, 0);
  const anchosColumnas = anchosRelativos.map((a) => (a / sumaAnchos) * anchoTotal);

  // Asignada siempre en `nuevaPagina()`, llamada antes de cualquier uso:
  // la asercion evita que el analisis de flujo se pierda dentro del `for`.
  let pagina!: PDFPage;
  let y = 0;
  let numeroFila = 0;

  const nuevaPagina = () => {
    pagina = doc.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
    y = ALTO_PAGINA;

    // Banda de marca a sangre, con el titulo y el subtitulo encima.
    pagina.drawRectangle({ x: 0, y: y - ALTO_BANDA, width: ANCHO_PAGINA, height: ALTO_BANDA, color: COLOR_MARCA });
    pagina.drawText(truncar(fuenteNegrita, titulo, 15, anchoTotal), {
      x: MARGEN,
      y: y - 24,
      size: 15,
      font: fuenteNegrita,
      color: COLOR_MARCA_TEXTO,
    });
    pagina.drawText(truncar(fuente, subtitulo, 9, anchoTotal), {
      x: MARGEN,
      y: y - 40,
      size: 9,
      font: fuente,
      color: COLOR_MARCA_SUBTITULO,
    });
    y -= ALTO_BANDA + 16;

    // Encabezado de columnas, con fondo suave para que no se confunda con los datos.
    pagina.drawRectangle({
      x: MARGEN - 4,
      y: y - 5,
      width: anchoTotal + 8,
      height: 20,
      color: COLOR_ENCABEZADO_FONDO,
    });
    let x = MARGEN;
    columnas.forEach((c, i) => {
      const ancho = anchosColumnas[i]!;
      const texto = truncar(fuenteNegrita, c.titulo, 9, ancho - 6);
      const tx = c.numerico ? x + ancho - fuenteNegrita.widthOfTextAtSize(texto, 9) - 6 : x;
      pagina.drawText(texto, { x: tx, y, size: 9, font: fuenteNegrita, color: COLOR_TEXTO_PRINCIPAL });
      x += ancho;
    });
    y -= 8;
    pagina.drawLine({
      start: { x: MARGEN, y },
      end: { x: ANCHO_PAGINA - MARGEN, y },
      thickness: 1,
      color: COLOR_BORDE_MARCA,
    });
    y -= 16;
  };

  nuevaPagina();

  for (const fila of filas) {
    if (y < RESERVA_PIE + ALTO_FILA) nuevaPagina();

    // Zebra: una fila de cada dos lleva un fondo apenas mas claro que el blanco,
    // para que una fila larga no se pierda contra la de arriba o la de abajo.
    if (numeroFila % 2 === 0) {
      pagina.drawRectangle({
        x: MARGEN - 4,
        y: y - 5,
        width: anchoTotal + 8,
        height: ALTO_FILA,
        color: COLOR_ZEBRA,
      });
    }

    let x = MARGEN;
    columnas.forEach((c, i) => {
      const valor = fila[c.clave] ?? '';
      const ancho = anchosColumnas[i]!;
      const texto = truncar(fuente, valor, 9, ancho - 6);
      const tx = c.numerico ? x + ancho - fuente.widthOfTextAtSize(texto, 9) - 6 : x;
      pagina.drawText(texto, { x: tx, y, size: 9, font: fuente, color: COLOR_TEXTO_PRINCIPAL });
      x += ancho;
    });
    y -= ALTO_FILA;
    numeroFila += 1;
  }

  if (filas.length === 0) {
    pagina.drawText('Sin datos para el periodo y los filtros elegidos.', {
      x: MARGEN,
      y,
      size: 10,
      font: fuente,
      color: COLOR_TEXTO_SECUNDARIO,
    });
  }

  // Pie de pagina: recien aca se sabe cuantas hubo en total.
  const paginas = doc.getPages();
  paginas.forEach((p, i) => {
    p.drawLine({
      start: { x: MARGEN, y: 36 },
      end: { x: ANCHO_PAGINA - MARGEN, y: 36 },
      thickness: 0.5,
      color: COLOR_BORDE_SUTIL,
    });
    p.drawText('Barber Shop', { x: MARGEN, y: 22, size: 8, font: fuente, color: COLOR_TEXTO_SECUNDARIO });
    const textoPagina = `Página ${i + 1} de ${paginas.length}`;
    const anchoTextoPagina = fuente.widthOfTextAtSize(textoPagina, 8);
    p.drawText(textoPagina, {
      x: ANCHO_PAGINA - MARGEN - anchoTextoPagina,
      y: 22,
      size: 8,
      font: fuente,
      color: COLOR_TEXTO_SECUNDARIO,
    });
  });

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export interface DatosFacturaPdf {
  numero: string;
  fechaEmision: string;
  nombreBarberia: string;
  rucBarberia: string | null;
  nombreCliente: string;
  observaciones: string | null;
  lineas: Array<{ descripcion: string; cantidad: number; precioUnitario: string; subtotal: string }>;
  subtotal: string;
  total: string;
}

/** Comprobante de venta (CU-025, anexo). Sin validez fiscal: es un documento interno. */
export async function generarPdfFactura(datos: DatosFacturaPdf): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const fuente = await doc.embedFont(StandardFonts.Helvetica);
  const fuenteNegrita = await doc.embedFont(StandardFonts.HelveticaBold);
  const pagina = doc.addPage([ANCHO_PAGINA, ALTO_PAGINA]);

  // Filete de marca a sangre en el borde superior, el mismo lenguaje visual
  // que la banda de los reportes tipo tabla.
  pagina.drawRectangle({ x: 0, y: ALTO_PAGINA - 8, width: ANCHO_PAGINA, height: 8, color: COLOR_MARCA });

  const escribir = (
    texto: string,
    x: number,
    y: number,
    opciones: { size?: number; negrita?: boolean; color?: ReturnType<typeof rgb> } = {},
  ) => {
    pagina.drawText(texto, {
      x,
      y,
      size: opciones.size ?? 10,
      font: (opciones.negrita ? fuenteNegrita : fuente) as PDFFont,
      color: opciones.color ?? COLOR_TEXTO_PRINCIPAL,
    });
  };

  /** Igual que `escribir`, pero `x` es el borde derecho del texto: para numeros y montos. */
  const escribirDerecha = (
    texto: string,
    xDerecho: number,
    y: number,
    opciones: { size?: number; negrita?: boolean; color?: ReturnType<typeof rgb> } = {},
  ) => {
    const size = opciones.size ?? 10;
    const f = (opciones.negrita ? fuenteNegrita : fuente) as PDFFont;
    escribir(texto, xDerecho - f.widthOfTextAtSize(texto, size), y, opciones);
  };

  let y = ALTO_PAGINA - MARGEN;

  escribir(datos.nombreBarberia, MARGEN, y, { size: 18, negrita: true });
  if (datos.rucBarberia) {
    escribir(`RUC: ${datos.rucBarberia}`, MARGEN, y - 18, { size: 9, color: COLOR_TEXTO_SECUNDARIO });
  }

  escribir('COMPROBANTE DE VENTA', ANCHO_PAGINA - MARGEN - 200, y, { size: 12, negrita: true });
  escribir(`N.o ${datos.numero}`, ANCHO_PAGINA - MARGEN - 200, y - 16, { size: 10 });
  escribir(`Emision: ${datos.fechaEmision}`, ANCHO_PAGINA - MARGEN - 200, y - 30, {
    size: 9,
    color: COLOR_TEXTO_SECUNDARIO,
  });
  escribir('Documento interno, sin validez fiscal.', ANCHO_PAGINA - MARGEN - 200, y - 44, {
    size: 8,
    color: COLOR_TEXTO_SECUNDARIO,
  });

  y -= 70;
  pagina.drawLine({
    start: { x: MARGEN, y },
    end: { x: ANCHO_PAGINA - MARGEN, y },
    thickness: 0.75,
    color: COLOR_BORDE_MARCA,
  });
  y -= 20;

  escribir('Cliente', MARGEN, y, { size: 8, color: COLOR_TEXTO_SECUNDARIO });
  escribir(datos.nombreCliente, MARGEN, y - 14, { size: 12, negrita: true });
  y -= 40;

  const columnas = [
    { titulo: 'Descripcion', ancho: 3 },
    { titulo: 'Cant.', ancho: 1 },
    { titulo: 'Precio unit.', ancho: 1.3 },
    { titulo: 'Subtotal', ancho: 1.3 },
  ];
  const anchoTotal = ANCHO_PAGINA - MARGEN * 2;
  const sumaAnchos = columnas.reduce((s, c) => s + c.ancho, 0);
  const anchosColumnas = columnas.map((c) => (c.ancho / sumaAnchos) * anchoTotal);

  let x = MARGEN;
  columnas.forEach((c, i) => {
    const ancho = anchosColumnas[i]!;
    if (i === 0) escribir(c.titulo, x, y, { size: 9, negrita: true });
    else escribirDerecha(c.titulo, x + ancho - 4, y, { size: 9, negrita: true });
    x += ancho;
  });
  y -= 6;
  pagina.drawLine({
    start: { x: MARGEN, y },
    end: { x: ANCHO_PAGINA - MARGEN, y },
    thickness: 0.5,
    color: COLOR_BORDE_SUTIL,
  });
  y -= 16;

  datos.lineas.forEach((linea, i) => {
    if (i % 2 === 0) {
      pagina.drawRectangle({
        x: MARGEN - 4,
        y: y - 5,
        width: anchoTotal + 8,
        height: ALTO_FILA,
        color: COLOR_ZEBRA,
      });
    }

    x = MARGEN;
    const valores = [linea.descripcion, String(linea.cantidad), linea.precioUnitario, linea.subtotal];
    valores.forEach((valor, j) => {
      const ancho = anchosColumnas[j]!;
      if (j === 0) escribir(valor, x, y, { size: 9.5 });
      else escribirDerecha(valor, x + ancho - 4, y, { size: 9.5 });
      x += ancho;
    });
    y -= ALTO_FILA;
  });

  y -= 6;
  pagina.drawLine({
    start: { x: MARGEN, y },
    end: { x: ANCHO_PAGINA - MARGEN, y },
    thickness: 0.5,
    color: COLOR_BORDE_SUTIL,
  });
  y -= 22;

  escribir('Subtotal', ANCHO_PAGINA - MARGEN - 160, y, { size: 10 });
  escribirDerecha(datos.subtotal, ANCHO_PAGINA - MARGEN, y, { size: 10 });
  y -= 18;
  escribir('Total', ANCHO_PAGINA - MARGEN - 160, y, { size: 13, negrita: true });
  escribirDerecha(datos.total, ANCHO_PAGINA - MARGEN, y, { size: 13, negrita: true, color: COLOR_MARCA });

  if (datos.observaciones) {
    y -= 40;
    escribir('Observaciones', MARGEN, y, { size: 8, color: COLOR_TEXTO_SECUNDARIO });
    escribir(datos.observaciones, MARGEN, y - 14, { size: 9.5 });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
