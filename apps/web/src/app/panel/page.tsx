import { redirect } from 'next/navigation';

import { usuarioActual } from '@barber-shop/api';

/**
 * El panel no tiene pantalla propia: manda a la de inicio de cada rol.
 *
 * El barbero entra a «Mi día» (14/10/2026), que junta lo suyo; el resto, a la
 * agenda del día. El ingreso, la recuperación de contraseña y el middleware
 * mandan acá, y no directo a la agenda, para que esta decisión viva en un solo
 * lugar.
 */
export default async function PaginaPanel() {
  const sesion = await usuarioActual();
  // El administrador empieza en su Tablero (vista 77, desde el 15/10/2026).
  redirect(
    sesion?.rol === 'profesional'
      ? '/panel/mi-dia'
      : sesion?.rol === 'administrador'
        ? '/panel/tablero'
        : '/panel/agenda',
  );
}
