/**
 * Generacion de PDF con `pdf-lib`, dibujando texto a mano.
 *
 * Sin un motor HTML-a-PDF (Puppeteer, etc): eso significaria cargar un
 * Chromium completo en el servidor para imprimir una tabla y un
 * comprobante. `pdf-lib` es liviano y alcanza para lo que estas dos
 * pantallas necesitan.
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';

const ANCHO_PAGINA = 612; // carta, en puntos
const ALTO_PAGINA = 792;
const MARGEN = 40;
const ALTO_FILA = 18;

export interface ColumnaReporte {
  clave: string;
  titulo: string;
  /** Ancho relativo: dos columnas con 2 y 1 quedan en proporcion 2 a 1. */
  ancho?: number;
  numerico?: boolean;
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

  let pagina: PDFPage;
  let y = 0;

  const nuevaPagina = () => {
    pagina = doc.addPage([ANCHO_PAGINA, ALTO_PAGINA]);
    y = ALTO_PAGINA - MARGEN;

    pagina.drawText(titulo, { x: MARGEN, y, size: 16, font: fuenteNegrita });
    y -= 18;
    pagina.drawText(subtitulo, { x: MARGEN, y, size: 9, font: fuente, color: rgb(0.4, 0.4, 0.4) });
    y -= 22;

    let x = MARGEN;
    columnas.forEach((c, i) => {
      pagina.drawText(c.titulo, { x, y, size: 9, font: fuenteNegrita });
      x += anchosColumnas[i]!;
    });
    y -= 6;
    pagina.drawLine({
      start: { x: MARGEN, y },
      end: { x: ANCHO_PAGINA - MARGEN, y },
      thickness: 0.75,
      color: rgb(0.75, 0.68, 0.5),
    });
    y -= 14;
  };

  nuevaPagina();

  for (const fila of filas) {
    if (y < MARGEN + ALTO_FILA) nuevaPagina();

    let x = MARGEN;
    columnas.forEach((c, i) => {
      const valor = fila[c.clave] ?? '';
      const ancho = anchosColumnas[i]!;
      const maxCaracteres = Math.max(4, Math.floor(ancho / 4.6));
      const texto = valor.length > maxCaracteres ? valor.slice(0, maxCaracteres - 1) + '…' : valor;
      pagina.drawText(texto, { x, y, size: 9, font: fuente });
      x += ancho;
    });
    y -= ALTO_FILA;
  }

  if (filas.length === 0) {
    pagina!.drawText('Sin datos para el periodo y los filtros elegidos.', {
      x: MARGEN,
      y,
      size: 10,
      font: fuente,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

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
      color: opciones.color ?? rgb(0.1, 0.1, 0.1),
    });
  };

  let y = ALTO_PAGINA - MARGEN;

  escribir(datos.nombreBarberia, MARGEN, y, { size: 18, negrita: true });
  if (datos.rucBarberia) {
    escribir(`RUC: ${datos.rucBarberia}`, MARGEN, y - 18, { size: 9, color: rgb(0.4, 0.4, 0.4) });
  }

  escribir('COMPROBANTE DE VENTA', ANCHO_PAGINA - MARGEN - 200, y, { size: 12, negrita: true });
  escribir(`N.o ${datos.numero}`, ANCHO_PAGINA - MARGEN - 200, y - 16, { size: 10 });
  escribir(`Emision: ${datos.fechaEmision}`, ANCHO_PAGINA - MARGEN - 200, y - 30, {
    size: 9,
    color: rgb(0.4, 0.4, 0.4),
  });
  escribir('Documento interno, sin validez fiscal.', ANCHO_PAGINA - MARGEN - 200, y - 44, {
    size: 8,
    color: rgb(0.55, 0.55, 0.55),
  });

  y -= 70;
  pagina.drawLine({
    start: { x: MARGEN, y },
    end: { x: ANCHO_PAGINA - MARGEN, y },
    thickness: 0.75,
    color: rgb(0.75, 0.68, 0.5),
  });
  y -= 20;

  escribir('Cliente', MARGEN, y, { size: 8, color: rgb(0.5, 0.5, 0.5) });
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
    escribir(c.titulo, x, y, { size: 9, negrita: true });
    x += anchosColumnas[i]!;
  });
  y -= 6;
  pagina.drawLine({
    start: { x: MARGEN, y },
    end: { x: ANCHO_PAGINA - MARGEN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 16;

  for (const linea of datos.lineas) {
    x = MARGEN;
    const valores = [linea.descripcion, String(linea.cantidad), linea.precioUnitario, linea.subtotal];
    valores.forEach((valor, i) => {
      escribir(valor, x, y, { size: 9.5 });
      x += anchosColumnas[i]!;
    });
    y -= ALTO_FILA;
  }

  y -= 8;
  pagina.drawLine({
    start: { x: MARGEN, y },
    end: { x: ANCHO_PAGINA - MARGEN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 22;

  escribir('Subtotal', ANCHO_PAGINA - MARGEN - 160, y, { size: 10 });
  escribir(datos.subtotal, ANCHO_PAGINA - MARGEN - 70, y, { size: 10 });
  y -= 18;
  escribir('Total', ANCHO_PAGINA - MARGEN - 160, y, { size: 13, negrita: true });
  escribir(datos.total, ANCHO_PAGINA - MARGEN - 70, y, { size: 13, negrita: true });

  if (datos.observaciones) {
    y -= 40;
    escribir('Observaciones', MARGEN, y, { size: 8, color: rgb(0.5, 0.5, 0.5) });
    escribir(datos.observaciones, MARGEN, y - 14, { size: 9.5 });
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}
