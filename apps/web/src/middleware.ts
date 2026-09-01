import { NextResponse, type NextRequest } from 'next/server';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { refrescarSesion } from '@barber-shop/api/middleware';

/**
 * Renueva la sesion en cada peticion y protege las dos zonas privadas:
 * `/panel`, que usa la barberia, y `/mi-cuenta`, que usa el cliente.
 *
 * IMPORTANTE: esto NO es el control de acceso del sistema. La autoridad son
 * las politicas RLS de la base, que se aplican aunque alguien llame a la API
 * directamente. El middleware solo evita mostrar pantallas que despues van a
 * fallar por permisos.
 *
 * POR QUE NO SEPARA POR ROL ACA
 *
 * Mandar a cada quien a su zona -el cliente al portal, el mostrador al panel-
 * exigiria conocer el rol, y el rol vive en `public.usuarios`: una consulta a
 * Supabase por cada peticion, incluida cada navegacion interna. El middleware
 * corre en el limite, antes de toda cache, y ese costo se paga entero.
 *
 * La separacion se hace en los dos `layout.tsx`, que ya resuelven la sesion
 * una vez por vista y tienen el rol a mano. Un cliente que escriba `/panel`
 * llega, el layout lo reconoce y lo manda al portal. Cuesta una redireccion
 * de mas en un caso que casi no ocurre, y ahorra una consulta en todos los
 * demas.
 */
export async function middleware(peticion: NextRequest) {
  const { respuesta, autenticado, configurado } = await refrescarSesion(peticion);

  // Sin configuracion se deja pasar: el limite de error de `/panel` explica
  // que falta. Redirigir aqui daria un ciclo infinito hacia `/ingresar`, que
  // tampoco podria funcionar.
  if (!configurado) return respuesta;

  const ruta = peticion.nextUrl.pathname;

  const esZonaPrivada = ruta.startsWith('/panel') || ruta.startsWith('/mi-cuenta');

  if (esZonaPrivada && !autenticado) {
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
