import Link from 'next/link';

import { Boton, EstadoVacio } from '@barber-shop/ui';

export const metadata = { title: 'Página no encontrada' };

export default function NoEncontrada() {
  return (
    <div className="bg-fondo flex min-h-screen items-center justify-center px-6">
      <EstadoVacio
        icono="search"
        titulo="No encontramos esta página"
        descripcion="Es posible que el enlace esté desactualizado o que la dirección tenga un error."
        accion={
          <Link href="/">
            <Boton variante="primario">Volver al inicio</Boton>
          </Link>
        }
      />
    </div>
  );
}
