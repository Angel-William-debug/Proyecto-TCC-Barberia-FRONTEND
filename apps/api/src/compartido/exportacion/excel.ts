/**
 * Tabla generica a `.xlsx`, para los reportes (CU-014) y para cualquier otro
 * listado que necesite exportarse. Vive en `compartido` porque no es de un
 * modulo en particular: `reportes.ts` es su unico cliente hoy, pero la firma
 * no depende de el.
 *
 * Los colores son los mismos tokens de marca que el PDF de al lado
 * (`pdf.ts`) usa, para que abrir el Excel y el PDF del mismo reporte no se
 * sientan como dos sistemas distintos.
 */

import ExcelJS from 'exceljs';

export interface ColumnaReporte {
  clave: string;
  titulo: string;
  ancho?: number;
  formato?: 'texto' | 'numero' | 'moneda' | 'fecha';
}

const FORMATOS: Record<string, string> = {
  moneda: '#,##0',
  numero: '#,##0.00',
  fecha: 'dd/mm/yyyy',
};

const RELLENO_TITULO: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBF4E4' } }; // --ambar-50
const RELLENO_ENCABEZADO: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF855B19' } }; // --ambar-700
const RELLENO_ZEBRA: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAF7F2' } }; // --hueso
const COLOR_TITULO = { argb: 'FF855B19' }; // --ambar-700
const COLOR_BORDE = { argb: 'FFE7E1D7' }; // --borde-sutil, tema claro

export async function generarExcel(
  tituloHoja: string,
  columnas: ColumnaReporte[],
  filas: Array<Record<string, unknown>>,
): Promise<Buffer> {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'Barber Shop';
  libro.created = new Date();

  // Excel limita el nombre de una hoja a 31 caracteres y rechaza algunos
  // simbolos; se recorta aca para no depender de que cada llamador lo sepa.
  const nombreHoja = tituloHoja.replace(/[/\\?*[\]:]/g, '').slice(0, 31);
  const hoja = libro.addWorksheet(nombreHoja, { properties: { tabColor: { argb: 'FF855B19' } } });

  // Las columnas solo definen clave y ancho: el encabezado visible no es la
  // fila 1 de ExcelJS (eso lo pisaría la fila 1 real, el titulo), se escribe
  // a mano en la fila 2.
  hoja.columns = columnas.map((c) => ({ key: c.clave, width: c.ancho ?? 22 }));

  const filaTitulo = hoja.addRow({});
  filaTitulo.getCell(1).value = tituloHoja;
  filaTitulo.height = 24;
  hoja.mergeCells(1, 1, 1, columnas.length);
  const celdaTitulo = filaTitulo.getCell(1);
  celdaTitulo.font = { bold: true, size: 13, color: COLOR_TITULO };
  celdaTitulo.fill = RELLENO_TITULO;
  celdaTitulo.alignment = { vertical: 'middle' };

  const filaEncabezado = hoja.addRow(Object.fromEntries(columnas.map((c) => [c.clave, c.titulo])));
  filaEncabezado.height = 20;
  filaEncabezado.eachCell((celda, numeroColumna) => {
    celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    celda.fill = RELLENO_ENCABEZADO;
    celda.alignment = {
      vertical: 'middle',
      horizontal: columnas[numeroColumna - 1]?.formato === 'moneda' || columnas[numeroColumna - 1]?.formato === 'numero'
        ? 'right'
        : 'left',
    };
  });

  filas.forEach((fila, i) => {
    const esParidadClara = i % 2 === 0;
    const filaExcel = hoja.addRow(fila);
    filaExcel.eachCell({ includeEmpty: true }, (celda, numeroColumna) => {
      const columna = columnas[numeroColumna - 1];
      if (esParidadClara) celda.fill = RELLENO_ZEBRA;
      celda.border = { bottom: { style: 'thin', color: COLOR_BORDE } };
      if (columna?.formato === 'moneda' || columna?.formato === 'numero') {
        celda.alignment = { horizontal: 'right' };
      }
    });
  });

  for (const columna of columnas) {
    const formato = columna.formato ? FORMATOS[columna.formato] : undefined;
    if (formato) hoja.getColumn(columna.clave).numFmt = formato;
  }

  // Filtro y fila congelada por debajo del titulo, para una tabla larga.
  hoja.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: columnas.length } };
  hoja.views = [{ state: 'frozen', ySplit: 2 }];

  const arrayBuffer = await libro.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
