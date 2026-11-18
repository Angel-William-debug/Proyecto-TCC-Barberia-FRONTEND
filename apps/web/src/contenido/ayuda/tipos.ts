import type { NombreRol } from '@barber-shop/tipos';

/**
 * El centro de ayuda (manual de usuario), escrito una sola vez.
 *
 * Cada artículo es una tarea —«Agendar un turno», «Liquidar comisiones»— y
 * dice a qué roles le sirve. De esta misma lista salen:
 *
 * - `/panel/ayuda` y `/mi-cuenta/ayuda`, filtrados por el rol de quien entra;
 * - el PDF de cada rol (`/ayuda/pdf?rol=…`);
 * - el Anexo 7 del TCC (`documentos/fuentes-correcciones/armar_manual.py`,
 *   que lee el JSON que exporta `scripts/exportar-ayuda.ts`).
 *
 * Por eso un tema común —recuperar la contraseña— se escribe una vez y se
 * marca para todos, en vez de copiarse en cuatro manuales que tarde o
 * temprano se contradicen.
 *
 * EL CUERPO ES MARKDOWN RECORTADO
 *
 * Solo lo que el lector del centro de ayuda y el generador del PDF entienden:
 *
 * - párrafos separados por una línea en blanco;
 * - `## Subtítulo`;
 * - `1. paso` (lista numerada) y `- punto` (viñetas), una línea por ítem;
 * - `> Nota` → recuadro de aviso; `> ! Nota` → recuadro de advertencia
 *   (lo que no se puede deshacer);
 * - `**negrita**` dentro de la línea;
 * - `[[id-de-otro-articulo]]` → enlace a ese artículo, con su título.
 *
 * Los nombres de botones y campos van entre comillas latinas, tal como se
 * leen en pantalla: «Nuevo turno».
 */

export type Audiencia = NombreRol;

export interface Categoria {
  id: string;
  titulo: string;
  descripcion: string;
  /** Nombre de un ícono de `@barber-shop/ui`. */
  icono: string;
}

export interface Articulo {
  /** Identificador estable, en minúsculas y con guiones. Es la URL del artículo. */
  id: string;
  titulo: string;
  /** Una oración: lo que se aprende en el artículo. Aparece en la lista y en el buscador. */
  resumen: string;
  /** `id` de una `Categoria`. */
  categoria: string;
  roles: readonly Audiencia[];
  /** Palabras que alguien buscaría y que no están en el título («anular», «borrar»…). */
  palabras?: readonly string[];
  /** Captura de pantalla, en `public/ayuda/capturas/`. */
  captura?: { archivo: string; descripcion: string };
  cuerpo: string;
  /** `id` de artículos que conviene leer después. */
  relacionados?: readonly string[];
}
