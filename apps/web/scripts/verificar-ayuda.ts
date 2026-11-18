/**
 * Revisa el contenido del centro de ayuda: ids repetidos, categorías que no
 * existen y enlaces [[id]] rotos. Uso, desde apps/web:
 *
 *   pnpm ayuda:verificar
 *
 * Con --exportar <archivo.json> además escribe el contenido completo, que
 * lee el generador del Anexo 7 del TCC (repo de documentación).
 */
import { writeFileSync } from 'node:fs';

import { ARTICULOS, CATEGORIAS, problemasDelContenido } from '../src/contenido/ayuda';

const problemas = problemasDelContenido();
for (const p of problemas) console.error(`  ✗ ${p}`);

const roles = ['administrador', 'recepcionista', 'profesional', 'cliente'] as const;
console.log(`${ARTICULOS.length} artículos en ${CATEGORIAS.length} categorías.`);
for (const r of roles) console.log(`  ${r}: ${ARTICULOS.filter((a) => a.roles.includes(r)).length}`);

const i = process.argv.indexOf('--exportar');
if (i > 0 && process.argv[i + 1]) {
  writeFileSync(process.argv[i + 1]!, JSON.stringify({ categorias: CATEGORIAS, articulos: ARTICULOS }, null, 2));
  console.log(`Exportado a ${process.argv[i + 1]}`);
}

process.exit(problemas.length > 0 ? 1 : 0);
