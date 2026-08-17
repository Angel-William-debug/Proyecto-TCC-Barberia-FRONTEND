/**
 * Verifica que la paleta cumpla la WCAG 2.1 nivel AA.
 *
 *     pnpm tokens:verificar
 *
 * No usa valores escritos a mano: lee `src/tokens/colores.css`, resuelve las
 * cadenas de `var()` y calcula el contraste real de cada par declarado en la
 * seccion 4.8 del documento del sistema de diseno.
 *
 * Devuelve codigo 1 si algo falla, de modo que sirva como paso de integracion
 * continua. Un token que rompe el contraste deja de ser una discusion de
 * gusto y pasa a ser una compilacion en rojo.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { COLORES_GRAFICO, VALORES } from '../src/tokens/valores';

const AQUI = dirname(fileURLToPath(import.meta.url));
const RUTA_CSS = resolve(AQUI, '../src/tokens/colores.css');

// ---------------------------------------------------------------------------
// Lectura de tokens
// ---------------------------------------------------------------------------

type Bloque = 'oscuro' | 'claro';

function leerTokens(): Record<Bloque, Map<string, string>> {
  const css = readFileSync(RUTA_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  const oscuro = new Map<string, string>();
  const claro = new Map<string, string>();

  const bloqueRaiz = /:root\s*\{([\s\S]*?)\}/.exec(css);
  const bloqueClaro = /\[data-tema='claro'\]\s*\{([\s\S]*?)\}/.exec(css);

  const cargar = (texto: string | undefined, destino: Map<string, string>) => {
    if (!texto) return;
    for (const linea of texto.split(';')) {
      const m = /^\s*(--[\w-]+)\s*:\s*(.+?)\s*$/.exec(linea);
      if (m?.[1] && m[2]) destino.set(m[1], m[2]);
    }
  };

  cargar(bloqueRaiz?.[1], oscuro);
  // El tema claro hereda del :root y solo redefine el nivel 2.
  cargar(bloqueRaiz?.[1], claro);
  cargar(bloqueClaro?.[1], claro);

  return { oscuro, claro };
}

/** Sigue las cadenas `var(--a)` -> `var(--b)` -> `#hex`. */
function resolver(token: string, tokens: Map<string, string>, profundidad = 0): string | null {
  if (profundidad > 10) return null;
  const bruto = token.startsWith('--') ? tokens.get(token) : token;
  if (!bruto) return null;

  const referencia = /^var\(\s*(--[\w-]+)\s*\)$/.exec(bruto.trim());
  if (referencia?.[1]) return resolver(referencia[1], tokens, profundidad + 1);

  const hex = /^#([0-9a-f]{6})$/i.exec(bruto.trim());
  return hex ? `#${hex[1]!.toLowerCase()}` : null;
}

// ---------------------------------------------------------------------------
// Contraste WCAG 2.1
// ---------------------------------------------------------------------------

function canal(valor: number): number {
  const c = valor / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminancia(hex: string): number {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

function contraste(a: string, b: string): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ---------------------------------------------------------------------------
// Pares evaluados. Reflejan la seccion 4.8 del documento.
// ---------------------------------------------------------------------------

interface Par {
  descripcion: string;
  frente: string;
  fondo: string;
  /** 4.5 texto normal, 3 texto grande y componentes de interfaz. */
  minimo: number;
  /** Texto de control deshabilitado: exento por WCAG 1.4.3. */
  exento?: boolean;
}

const PARES: Record<Bloque, Par[]> = {
  oscuro: [
    { descripcion: 'Texto principal', frente: '--texto-principal', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Texto principal sobre superficie', frente: '--texto-principal', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Texto secundario', frente: '--texto-secundario', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Texto secundario sobre superficie', frente: '--texto-secundario', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Texto terciario', frente: '--texto-terciario', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Texto deshabilitado', frente: '--texto-deshabilitado', fondo: '--fondo-base', minimo: 4.5, exento: true },
    { descripcion: 'Texto sobre relleno de marca', frente: '--texto-sobre-marca', fondo: '--marca', minimo: 4.5 },
    { descripcion: 'Marca como texto', frente: '--marca', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Anillo de foco', frente: '--borde-foco', fondo: '--fondo-base', minimo: 3 },
    { descripcion: 'Borde de control', frente: '--borde-control', fondo: '--fondo-base', minimo: 3 },
    { descripcion: 'Borde de control sobre superficie', frente: '--borde-control', fondo: '--fondo-superficie', minimo: 3 },
    { descripcion: 'Exito', frente: '--exito', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Advertencia', frente: '--advertencia', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Peligro', frente: '--peligro', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Informacion', frente: '--info', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Chip exito', frente: '--exito', fondo: '--chip-exito-fondo', minimo: 4.5 },
    { descripcion: 'Chip advertencia', frente: '--advertencia', fondo: '--chip-advertencia-fondo', minimo: 4.5 },
    { descripcion: 'Chip peligro', frente: '--peligro', fondo: '--chip-peligro-fondo', minimo: 4.5 },
    { descripcion: 'Chip informacion', frente: '--info', fondo: '--chip-info-fondo', minimo: 4.5 },
    { descripcion: 'Chip neutro', frente: '--chip-neutro-texto', fondo: '--chip-neutro-fondo', minimo: 4.5 },
    { descripcion: 'Chip marca', frente: '--chip-marca-texto', fondo: '--chip-marca-fondo', minimo: 4.5 },
  ],
  claro: [
    { descripcion: 'Texto principal', frente: '--texto-principal', fondo: '--fondo-base', minimo: 4.5 },
    { descripcion: 'Texto secundario sobre superficie', frente: '--texto-secundario', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Texto terciario sobre superficie', frente: '--texto-terciario', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Texto sobre relleno de marca', frente: '--texto-sobre-marca', fondo: '--marca', minimo: 4.5 },
    { descripcion: 'Anillo de foco', frente: '--borde-foco', fondo: '--fondo-base', minimo: 3 },
    { descripcion: 'Borde de control', frente: '--borde-control', fondo: '--fondo-base', minimo: 3 },
    { descripcion: 'Exito', frente: '--exito', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Advertencia', frente: '--advertencia', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Peligro', frente: '--peligro', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Informacion', frente: '--info', fondo: '--fondo-superficie', minimo: 4.5 },
    { descripcion: 'Chip exito', frente: '--exito', fondo: '--chip-exito-fondo', minimo: 4.5 },
    { descripcion: 'Chip advertencia', frente: '--advertencia', fondo: '--chip-advertencia-fondo', minimo: 4.5 },
    { descripcion: 'Chip peligro', frente: '--peligro', fondo: '--chip-peligro-fondo', minimo: 4.5 },
    { descripcion: 'Chip informacion', frente: '--info', fondo: '--chip-info-fondo', minimo: 4.5 },
  ],
};

// ---------------------------------------------------------------------------
// Ejecucion
// ---------------------------------------------------------------------------

const VERDE = '[32m';
const ROJO = '[31m';
const GRIS = '[90m';
const FIN = '[0m';

const tokens = leerTokens();
let fallos = 0;
let sinResolver = 0;

for (const bloque of ['oscuro', 'claro'] as const) {
  console.log(`\n  TEMA ${bloque.toUpperCase()}`);
  console.log(`  ${'-'.repeat(72)}`);

  for (const par of PARES[bloque]) {
    const frente = resolver(par.frente, tokens[bloque]);
    const fondo = resolver(par.fondo, tokens[bloque]);

    if (!frente || !fondo) {
      sinResolver += 1;
      console.log(`  ${ROJO}?${FIN}  ${par.descripcion.padEnd(38)} token sin resolver`);
      continue;
    }

    const medido = contraste(frente, fondo);
    const cumple = medido >= par.minimo;
    const marca = par.exento ? `${GRIS}-${FIN}` : cumple ? `${VERDE}OK${FIN}` : `${ROJO}NO${FIN}`;
    const detalle = par.exento
      ? `${GRIS}exento WCAG 1.4.3${FIN}`
      : `min ${par.minimo.toFixed(1)}:1`;

    console.log(
      `  ${marca.padEnd(14)} ${par.descripcion.padEnd(38)} ` +
        `${medido.toFixed(2).padStart(6)}:1  ${detalle}`,
    );

    if (!cumple && !par.exento) fallos += 1;
  }
}

// ---------------------------------------------------------------------------
// Los valores duplicados en TypeScript no pueden separarse del CSS
// ---------------------------------------------------------------------------

console.log('\n  VALORES DUPLICADOS EN tokens/valores.ts');
console.log(`  ${'-'.repeat(72)}`);

const DUPLICADOS: Array<[keyof typeof VALORES, string]> = [
  ['carbon950', '--carbon-950'],
  ['carbon900', '--carbon-900'],
  ['carbon800', '--carbon-800'],
  ['carbon700', '--carbon-700'],
  ['ambar500', '--ambar-500'],
  ['ambar700', '--ambar-700'],
  ['crema50', '--crema-50'],
  ['hueso', '--hueso'],
];

let desincronizados = 0;
for (const [clave, token] of DUPLICADOS) {
  const enCss = resolver(token, tokens.oscuro);
  const enTs = VALORES[clave].toLowerCase();
  const coincide = enCss === enTs;
  if (!coincide) desincronizados += 1;
  console.log(
    `  ${coincide ? `${VERDE}OK${FIN}` : `${ROJO}NO${FIN}`.padEnd(14)}` +
      `${coincide ? '            ' : ''}${clave.padEnd(38)} ${enTs}  vs  ${enCss ?? '?'}  ${token}`,
  );
}

for (let i = 0; i < COLORES_GRAFICO.length; i += 1) {
  const token = `--grafico-${i + 1}`;
  const enCss = resolver(token, tokens.oscuro);
  const enTs = COLORES_GRAFICO[i]!.toLowerCase();
  if (enCss !== enTs) {
    desincronizados += 1;
    console.log(`  ${ROJO}NO${FIN}            ${token.padEnd(38)} ${enTs}  vs  ${enCss ?? '?'}`);
  }
}

if (desincronizados === 0) {
  console.log(`  ${GRIS}  y la secuencia de graficos coinciden con colores.css${FIN}`);
}

console.log(`\n  ${'-'.repeat(74)}`);

if (desincronizados > 0) {
  console.log(
    `  ${ROJO}${desincronizados} valor(es) de valores.ts no coinciden con colores.css.${FIN}`,
  );
  fallos += desincronizados;
}

if (sinResolver > 0) {
  console.log(`  ${ROJO}${sinResolver} token(s) no se pudieron resolver desde colores.css${FIN}`);
}

if (fallos > 0) {
  console.log(`  ${ROJO}${fallos} par(es) por debajo del minimo exigido.${FIN}`);
  console.log(`  Corregir el token o justificar la excepcion en la seccion 4.8.\n`);
  process.exit(1);
}

console.log(`  ${VERDE}Todos los pares cumplen la WCAG 2.1 nivel AA.${FIN}\n`);
