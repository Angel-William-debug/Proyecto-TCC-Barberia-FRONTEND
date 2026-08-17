import Link from 'next/link';

import { FormularioCrearCuenta } from '@/componentes/sesion/formulario-crear-cuenta';
import { MarcoSesion } from '@/componentes/sesion/marco-sesion';

export const metadata = { title: 'Crear cuenta' };

export default function PaginaCrearCuenta() {
  return (
    <MarcoSesion
      titulo="Crear cuenta"
      descripcion="Complete sus datos para solicitar acceso"
      pie={
        <>
          ¿Ya tiene una cuenta?{' '}
          <Link href="/ingresar" className="hover:text-principal underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <FormularioCrearCuenta />
    </MarcoSesion>
  );
}
