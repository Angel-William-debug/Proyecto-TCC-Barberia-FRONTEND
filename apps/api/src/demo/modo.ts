/**
 * Modo demostración.
 *
 * Este módulo se expone como `@barber-shop/api/demo` y no solo desde la raíz
 * del paquete, porque también lo necesitan componentes de cliente. Importar
 * `@barber-shop/api` desde el navegador arrastraría `cliente-servidor.ts`,
 * que usa `next/headers`, y la compilación falla. La subruta mantiene el
 * indicador accesible desde ambos lados sin cruzar esa frontera.
 *
 * Con `NEXT_PUBLIC_MODO_DEMO=true`, la capa de datos deja de consultar
 * Supabase y devuelve un conjunto ficticio. Sirve para dos cosas:
 *
 *   1. Recorrer el panel completo sin credenciales ni usuarios creados.
 *   2. Tomar capturas para el TCC sin exponer datos reales de clientes,
 *      cosa que además evita el problema de la Ley 6534/2020.
 *
 * Está deliberadamente concentrado en este módulo y en `datos.ts`: cada
 * función de repositorio hace una sola comprobación al principio y sigue
 * igual que antes. Así el modo se puede borrar el día que sobre, sin
 * desarmar nada.
 *
 * La interfaz muestra un aviso permanente cuando está activo. Un panel que
 * miente sobre el origen de sus datos es peor que un panel vacío.
 */
export const MODO_DEMO = process.env.NEXT_PUBLIC_MODO_DEMO === 'true';
