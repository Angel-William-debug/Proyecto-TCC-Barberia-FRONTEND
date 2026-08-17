/**
 * Lectura y validacion de las variables de entorno.
 *
 * Se valida al arrancar y no en el momento de usarlas. Un `undefined` que se
 * descubre recien cuando alguien intenta cobrar es mucho peor que un error al
 * levantar el servidor.
 */

function requerida(nombre: string, valor: string | undefined): string {
  if (!valor || valor.trim() === '') {
    throw new Error(
      `Falta la variable de entorno ${nombre}.\n` +
        `Copie .env.example a apps/web/.env.local y complétela. ` +
        `Los valores están en el panel de Supabase, en Project Settings > API.`,
    );
  }
  return valor.trim();
}

/**
 * Configuracion publica: viaja al navegador.
 *
 * Que la clave anonima sea publica no es un descuido del diseno, es como
 * funciona Supabase: la proteccion real la dan las 56 politicas RLS de la
 * base. Sin una sesion valida, esta clave no lee nada.
 */
export function entornoPublico() {
  return {
    urlSupabase: requerida('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
    claveAnonima: requerida(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    zonaHoraria: process.env.NEXT_PUBLIC_ZONA_HORARIA ?? 'America/Asuncion',
  };
}

/**
 * Configuracion privada: NUNCA debe llegar al navegador.
 *
 * `SUPABASE_SERVICE_ROLE_KEY` omite todas las politicas RLS. Por eso no lleva
 * el prefijo NEXT_PUBLIC_: Next.js solo expone al cliente las variables con
 * ese prefijo, de modo que el propio framework impide filtrarla por descuido.
 */
export function entornoPrivado() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'entornoPrivado() se invoco desde el navegador. ' +
        'La clave de servicio omite RLS y solo puede usarse en el servidor.',
    );
  }

  return {
    claveServicio: requerida(
      'SUPABASE_SERVICE_ROLE_KEY',
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    ),
    claveResend: process.env.RESEND_API_KEY ?? null,
    urlServicioMl: process.env.URL_SERVICIO_ML ?? null,
  };
}
