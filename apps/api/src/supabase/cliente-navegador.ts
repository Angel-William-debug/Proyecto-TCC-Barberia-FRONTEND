'use client';

import { createBrowserClient } from '@supabase/ssr';

import { entornoPublico } from '../entorno';

/**
 * Cliente de Supabase para componentes que corren en el navegador.
 *
 * Se reutiliza una sola instancia: crear varias abre suscripciones duplicadas
 * de autenticacion y el estado de sesion se desincroniza entre ellas.
 */
let instancia: ReturnType<typeof createBrowserClient> | null = null;

export function clienteNavegador() {
  if (instancia) return instancia;

  const { urlSupabase, claveAnonima } = entornoPublico();
  instancia = createBrowserClient(urlSupabase, claveAnonima);
  return instancia;
}
