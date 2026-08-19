/**
 * Tabla generica a `.xlsx`, para los reportes (CU-014) y para cualquier otro
 * listado que necesite exportarse. Vive en `compartido` porque no es de un
 * modulo en particular: `reportes.ts` es su unico cliente hoy, pero la firma
 * no depende de el.
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
  const hoja = libro.addWorksheet(tituloHoja.replace(/[/\\?*[\]:]/g, '').slice(0, 31));

  hoja.columns = columnas.map((c) => ({ header: c.titulo, key: c.clave, width: c.ancho ?? 22 }));
  hoja.getRow(1).font = { bold: true };
  hoja.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEFE7D8' },
  };

  for (const fila of filas) hoja.addRow(fila);

  for (const columna of columnas) {
    const formato = columna.formato ? FORMATOS[columna.formato] : undefined;
    if (formato) hoja.getColumn(columna.clave).numFmt = formato;
  }

  const arrayBuffer = await libro.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
