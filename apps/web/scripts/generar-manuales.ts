/**
 * Genera los cuatro manuales en PDF (uno por rol) con el mismo código que la
 * ruta `/panel/ayuda/pdf`, sin levantar el servidor. Uso, desde apps/web:
 *
 *   npx tsx scripts/generar-manuales.ts <carpeta-de-salida>
 *
 * Sirve para revisar el resultado y para adjuntar los PDF al TCC.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { generarPdfManual } from '../../api/src/compartido/exportacion/manual';
import { etiquetaRol } from '../src/lib/ayuda';
import { armarDatosManual } from '../src/lib/ayuda/manual';

const salida = process.argv[2] ?? 'manuales';
mkdirSync(salida, { recursive: true });

const leer = async (ruta: string) => {
  try {
    return new Uint8Array(readFileSync(join('public', 'ayuda', ruta)));
  } catch {
    return undefined;
  }
};

for (const rol of ['administrador', 'recepcionista', 'profesional', 'cliente'] as const) {
  const pdf = await generarPdfManual(await armarDatosManual(rol, leer));
  const archivo = join(salida, `manual-barber-shop-${etiquetaRol(rol).toLowerCase()}.pdf`);
  writeFileSync(archivo, pdf);
  console.log(`${archivo}  ${(pdf.length / 1024).toFixed(0)} KB`);
}
