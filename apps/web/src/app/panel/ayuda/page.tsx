import { exigirSesion } from '@barber-shop/api';

import { CentroAyuda } from '@/componentes/ayuda/centro-ayuda';
import { rolDelManual } from '@/lib/ayuda';

export const metadata = { title: 'Centro de ayuda' };

/**
 * Centro de ayuda del personal: el manual de usuario de su rol, con
 * buscador y descarga en PDF. El administrador puede abrir el de los demás.
 */
export default async function PaginaAyuda({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [usuario, params] = await Promise.all([exigirSesion(), searchParams]);
  const rol = rolDelManual(usuario.rol, params.rol);

  return (
    <CentroAyuda
      rol={rol}
      rolSesion={usuario.rol}
      base="/panel/ayuda"
      titulo={<h1 className="text-titulo-1 text-principal font-semibold">Centro de ayuda</h1>}
    />
  );
}
