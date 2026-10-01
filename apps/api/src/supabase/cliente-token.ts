import { createClient } from '@supabase/supabase-js';

import { entornoPublico } from '../entorno';

/**
 * Cliente de Supabase con la sesion de un usuario que llega como token, no
 * como cookie.
 *
 * Es el que usa la app movil del cliente: no comparte cookies con la web,
 * manda su token de acceso en `Authorization: Bearer ...` y la ruta del
 * servidor lo reenvia a Supabase. Con la clave anonima y ese token, la base
 * aplica las MISMAS politicas RLS que a la sesion web del mismo cliente: el
 * token no da ningun permiso que la persona no tenga ya.
 *
 * Supabase valida el token en cada consulta; si esta vencido o es falso, la
 * primera llamada falla. Por eso no hace falta verificarlo aparte aca.
 */
export function clienteConToken(token: string) {
  const { urlSupabase, claveAnonima } = entornoPublico();

  return createClient(urlSupabase, claveAnonima, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
