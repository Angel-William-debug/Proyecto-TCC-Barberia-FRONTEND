import { NextResponse, type NextRequest } from 'next/server';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { refrescarSesion } from '@barber-shop/api/middleware';

/**
 * Renueva la sesion en cada peticion y protege `/panel`.
 *
 * IMPORTANTE: esto NO es el control de acceso del sistema. La autoridad son
 * las 56 politicas RLS de la base, que se aplican aunque alguien llame a la
 * API directamente. El middleware solo evita mostrar pantallas que despues
 * van a fallar por permisos.
 */
export async function middleware(peticion: NextRequest) {
  const { respuesta, autenticado, configurado } = await refrescarSesion(peticion);

  // Sin configuracion se deja pasar: el limite de error de `/panel` explica
  // que falta. Redirigir aqui daria un ciclo infinito hacia `/ingresar`, que
  // tampoco podria funcionar.
  if (!configurado) return respuesta;

  const ruta = peticion.nextUrl.pathname;

  if (ruta.startsWith('/panel') && !autenticado) {
    const destino = peticion.nextUrl.clone();
    destino.pathname = '/ingresar';
    destino.searchParams.set('volver', ruta);
    return NextResponse.redirect(destino);
  }

  // En modo demostracion la sesion se da por valida, pero la pantalla de
  // ingreso sigue siendo una de las 104 vistas del sistema y tiene que poder
  // visitarse. Sin esta salvedad quedaria inaccesible.
  if (ruta === '/ingresar' && autenticado && !MODO_DEMO) {
    const destino = peticion.nextUrl.clone();
    destino.pathname = '/panel/agenda';
    destino.search = '';
    return NextResponse.redirect(destino);
  }

  return respuesta;
}

export const config = {
  matcher: [
    /*
     * Todas las rutas salvo las estaticas. Correr el middleware sobre cada
     * imagen y cada archivo de tipografia agregaria una llamada a Supabase
     * por recurso.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|woff2?)$).*)',
  ],
};
