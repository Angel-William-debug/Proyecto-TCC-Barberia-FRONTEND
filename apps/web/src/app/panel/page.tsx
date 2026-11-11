import { redirect } from 'next/navigation';

import { usuarioActual } from '@barber-shop/api';

import { rolPuedeEntrar } from '@/lib/navegacion';

/**
 * El panel no tiene pantalla propia: manda a la de inicio de cada rol.
 *
 * El barbero entra a «Mi día» (14/10/2026), que junta lo suyo; el resto, a la
 * agenda del día. El ingreso, la recuperación de contraseña y el middleware
 * mandan acá, y no directo a la agenda, para que esta decisión viva en un solo
 * lugar.
 *
 * `?volver=` (la pantalla donde estaba cuando venció la sesión) se respeta
 * solo si el rol que acaba de ingresar puede entrar ahí: si salió el
 * administrador desde el Tablero y entra un barbero, el barbero va a su Mi
 * día y no a «No tiene acceso» (QA F2-15, 11/11/2026).
 */
export default async function PaginaPanel({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sesion = await usuarioActual();
  const volver = (await searchParams).volver;
  if (
    sesion &&
    typeof volver === 'string' &&
    /^\/panel\/[a-z]/.test(volver) &&
    rolPuedeEntrar(sesion.rol, volver)
  ) {
    redirect(volver);
  }
  // El administrador empieza en su Tablero (vista 77, desde el 15/10/2026).
  redirect(
    sesion?.rol === 'profesional'
      ? '/panel/mi-dia'
      : sesion?.rol === 'administrador'
        ? '/panel/tablero'
        : '/panel/agenda',
  );
}
