import { createClient } from '@supabase/supabase-js';

import { entornoPublico } from '../entorno';
import { entornoPrivado } from '../entorno';

/**
 * Cliente con la clave de servicio. OMITE TODAS LAS POLITICAS RLS.
 *
 * Usarlo equivale a operar como superusuario de la base. Solo se justifica en
 * dos lugares, ambos en el servidor y sin intervencion del usuario:
 *
 *   1. El alta de un usuario, que debe escribir en `auth.users` y en
 *      `public.usuarios` de forma coordinada (CU-019, no CU-001: ese es el
 *      inicio de sesion).
 *   2. La Edge Function de recordatorios, que corre sin sesion (RN-050).
 *
 * Las recomendaciones (CU-013) NO usan este cliente: el motor corre embebido
 * en `apps/api` con `clienteServidor()`, no en un microservicio aparte -ver
 * `modulos/recomendaciones.ts`-, asi que respeta RLS como cualquier otra
 * escritura.
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
