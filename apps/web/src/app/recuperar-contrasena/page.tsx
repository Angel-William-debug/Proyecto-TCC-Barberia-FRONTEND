import Link from 'next/link';

import { FormularioRecuperar } from '@/componentes/sesion/formulario-recuperar';
import { MarcoSesion } from '@/componentes/sesion/marco-sesion';

export const metadata = { title: 'Recuperar contraseña' };

export default function PaginaRecuperar() {
  return (
    <MarcoSesion
      titulo="Recuperar contraseña"
      descripcion="Le enviaremos un enlace por correo"
      pie={
        <Link href="/ingresar" className="hover:text-principal underline">
          Volver a iniciar sesión
        </Link>
      }
    >
      <FormularioRecuperar />
    </MarcoSesion>
  );
}
