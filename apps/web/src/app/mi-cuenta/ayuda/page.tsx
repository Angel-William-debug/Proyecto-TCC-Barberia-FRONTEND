import { exigirSesion } from '@barber-shop/api';

import { CentroAyuda } from '@/componentes/ayuda/centro-ayuda';

export const metadata = { title: 'Ayuda' };

/** Centro de ayuda del cliente: cómo reservar, cancelar, calificar y usar la app. */
export default async function AyudaCliente() {
  const usuario = await exigirSesion();
  return (
    <div className="mt-2">
      <CentroAyuda
        rol="cliente"
        rolSesion={usuario.rol}
        base="/mi-cuenta/ayuda"
        titulo={<h1 className="font-display text-principal text-display-sm font-semibold">Ayuda</h1>}
      />
    </div>
  );
}
