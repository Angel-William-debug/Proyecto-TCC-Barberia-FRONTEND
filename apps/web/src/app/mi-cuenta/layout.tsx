import { redirect } from 'next/navigation';

import { MODO_DEMO, sesionPortal } from '@barber-shop/api';
import { usaElPortal } from '@barber-shop/tipos';

import { AvisoDemo } from '@/componentes/armazon/aviso-demo';
import { BotonSalir } from '@/componentes/armazon/boton-salir';
import { SelectorTema } from '@/componentes/armazon/selector-tema';
import { MarcoPortal } from '@/componentes/portal/marco-portal';

/**
 * Armazon del portal del cliente.
 *
 * Ninguna vista de aca se puede prerenderizar: todas dependen de la sesion.
 */
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Mi cuenta',
};

export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const usuario = await sesionPortal();

  if (!usuario) redirect('/ingresar');

  // Aca se hace la separacion que el middleware no hace, por lo explicado en
  // `middleware.ts`. Una recepcionista que escriba `/mi-cuenta` no encontraria
  // nada util: no tiene ficha de cliente, asi que todas las consultas le
  // devolverian vacio. Se la manda a su propia zona en vez de mostrarle un
  // portal en blanco.
  if (!usaElPortal(usuario.rol)) redirect('/panel/agenda');

  return (
    <MarcoPortal
      nombre={usuario.nombre}
      aviso={MODO_DEMO ? <AvisoDemo /> : undefined}
      acciones={
        <>
          <SelectorTema />
          <BotonSalir />
        </>
      }
    >
      {children}
    </MarcoPortal>
  );
}
