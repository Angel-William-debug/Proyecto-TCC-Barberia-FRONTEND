import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { MODO_DEMO } from '../demo/modo';

/**
 * Refresco de la sesion desde el middleware de Next.js.
 *
 * Vive en este paquete y no en `apps/web` por la misma regla que el resto:
 * `@barber-shop/api` es el unico modulo que conoce Supabase. El middleware de
 * la aplicacion decide que hacer con el resultado; aqui solo se renueva el
 * token y se informa si hay usuario.
 *
 * Por que hace falta: los componentes de servidor no pueden escribir cookies.
 * Si el token de acceso vence mientras el usuario navega, nadie lo renovaria
 * y la sesion se caeria sola a mitad de una jornada. El middleware si puede
 * escribirlas.
 */

type CookiePorEscribir = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export interface ResultadoSesion {
  /** Respuesta con las cookies ya actualizadas. Debe devolverse tal cual. */
  respuesta: NextResponse;
  /** `true` si hay un usuario autenticado. */
  autenticado: boolean;
  /** `false` cuando faltan las variables de entorno de Supabase. */
  configurado: boolean;
}

export async function refrescarSesion(peticion: NextRequest): Promise<ResultadoSesion> {
  let respuesta = NextResponse.next({ request: peticion });

  // En modo demostracion no hay sesion que refrescar ni ruta que proteger.
  if (MODO_DEMO) {
    return { respuesta, autenticado: true, configurado: true };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !clave) {
    return { respuesta, autenticado: false, configurado: false };
  }

  const supabase = createServerClient(url, clave, {
    cookies: {
      getAll() {
        return peticion.cookies.getAll();
      },
      setAll(porEscribir: CookiePorEscribir[]) {
        for (const { name, value } of porEscribir) {
          peticion.cookies.set(name, value);
        }
        respuesta = NextResponse.next({ request: peticion });
        for (const { name, value, options } of porEscribir) {
          respuesta.cookies.set(name, value, options as never);
        }
      },
    },
  });

  // No quitar: esta llamada es la que dispara el refresco del token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { respuesta, autenticado: user !== null, configurado: true };
}
