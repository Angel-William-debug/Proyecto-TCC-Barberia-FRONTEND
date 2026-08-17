import { createClient } from '@supabase/supabase-js';

import { entornoPublico } from '../entorno';
import { entornoPrivado } from '../entorno';

/**
 * Cliente con la clave de servicio. OMITE TODAS LAS POLITICAS RLS.
 *
 * Usarlo equivale a operar como superusuario de la base. Solo se justifica en
 * tres lugares, todos ellos en el servidor y sin intervencion del usuario:
 *
 *   1. El alta de un usuario, que debe escribir en `auth.users` y en
 *      `public.usuarios` de forma coordinada (CU-001).
 *   2. La Edge Function de recordatorios, que corre sin sesion (RN-050).
 *   3. La escritura de `recomendaciones_ml` desde el microservicio de ML
 *      (CU-013).
 *
 * Para cualquier otra cosa se usa `clienteServidor()`. Si una consulta falla
 * por permisos, la respuesta correcta casi siempre es revisar la politica RLS,
 * no escalar a este cliente.
 */
export function clienteAdmin() {
  const { urlSupabase } = entornoPublico();
  const { claveServicio } = entornoPrivado();

  return createClient(urlSupabase, claveServicio, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
