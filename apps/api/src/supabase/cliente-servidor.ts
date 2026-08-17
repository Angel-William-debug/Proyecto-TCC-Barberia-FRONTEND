import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { entornoPublico } from '../entorno';

/**
 * Cliente de Supabase para componentes de servidor, acciones y manejadores de
 * ruta.
 *
 * Actua en nombre del usuario que hizo la peticion: usa la clave anonima y la
 * sesion guardada en las cookies, de modo que las 56 politicas RLS de la base
 * se aplican con normalidad. Es el cliente que se debe usar salvo excepcion
 * justificada.
 *
 * En Next.js 15 `cookies()` es asincrono, por eso la funcion lo es tambien.
 */
/** Forma con la que `@supabase/ssr` entrega las cookies por escribir. */
type CookiePorEscribir = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function clienteServidor() {
  // `cookies()` va primero a proposito: es una API dinamica y su sola
  // invocacion le indica a Next.js que la ruta no se puede prerenderizar. Si
  // antes se leyera el entorno y faltara una variable, la excepcion se
  // lanzaria durante la compilacion en lugar de en tiempo de ejecucion.
  const almacen = await cookies();
  const { urlSupabase, claveAnonima } = entornoPublico();

  return createServerClient(urlSupabase, claveAnonima, {
    cookies: {
      getAll() {
        return almacen.getAll();
      },
      setAll(porEscribir: CookiePorEscribir[]) {
        try {
          for (const { name, value, options } of porEscribir) {
            almacen.set(name, value, options as never);
          }
        } catch {
          // Un componente de servidor no puede escribir cookies. Es esperable:
          // el middleware ya refresco la sesion antes de llegar hasta aqui.
        }
      },
    },
  });
}
