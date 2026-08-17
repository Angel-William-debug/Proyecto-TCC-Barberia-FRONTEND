/**
 * Los pocos valores de color que hacen falta fuera de CSS.
 *
 * La regla del sistema es que ningun componente escribe un hexadecimal: todo
 * sale de una variable CSS. Pero hay tres lugares donde eso no es posible,
 * porque el consumidor no es el motor de estilos:
 *
 *   1. `themeColor` de Next.js, que pinta la barra del navegador en movil.
 *      Lo lee el sistema operativo desde una etiqueta <meta>, antes de que
 *      exista una hoja de estilos.
 *   2. Las bibliotecas de graficos que reciben el color como cadena en
 *      JavaScript y no resuelven `var()`.
 *   3. La generacion de PDF de los reportes.
 *
 * Estos valores DEBEN coincidir con los de `tokens/colores.css`. La prueba de
 * `pnpm tokens:verificar` los compara para que no se separen con el tiempo.
 */

export const VALORES = {
  carbon950: '#0B0908',
  carbon900: '#14110F',
  carbon800: '#1F1B18',
  carbon700: '#2B2521',

  ambar500: '#C9922B',
  ambar700: '#855B19',

  crema50: '#F7F3EC',
  hueso: '#FAF7F2',
  blanco: '#FFFFFF',
} as const;

/** Color de la barra del navegador. Coincide con `--carbon-900`. */
export const COLOR_TEMA_NAVEGADOR = VALORES.carbon900;

/**
 * Secuencia para graficos (seccion 4.10). Se usa en orden y nunca se
 * reemplaza por los colores semanticos: un sector de torta no significa
 * peligro.
 */
export const COLORES_GRAFICO = [
  '#C9922B',
  '#6C9BD6',
  '#4FB287',
  '#C4756A',
  '#9B8AC4',
  '#7FA8A0',
] as const;
