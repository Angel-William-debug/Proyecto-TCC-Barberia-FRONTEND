import Link from 'next/link';

import { Boton } from '@barber-shop/ui';

import { FormularioIngreso } from '@/componentes/sesion/formulario-ingreso';
import { MarcoSesion } from '@/componentes/sesion/marco-sesion';

export const metadata = { title: 'Ingresar' };

/**
 * CU-001 — Inicio de sesión.
 *
 * La credencial vive en `auth.users` de Supabase Auth (RN-001); el sistema
 * nunca guarda ni compara contraseñas por su cuenta. La columna
 * `usuarios.password_hash` se eliminó por eso mismo.
 */
export default function PaginaIngresar() {
  return (
    <MarcoSesion
      descripcion="Ingrese con su cuenta del sistema"
      pie={
        <Link href="/" className="hover:text-principal underline">
          Volver a la página principal
        </Link>
      }
    >
      <FormularioIngreso />

      <div className="border-borde-sutil mt-6 border-t pt-5 text-center">
        <p className="text-cuerpo-sm text-terciario">¿Todavía no tiene una cuenta?</p>
        <Link href="/crear-cuenta" className="mt-3 block">
          <Boton variante="secundario" ancho="completo" icono="user-round">
            Crear cuenta
          </Boton>
        </Link>
      </div>
    </MarcoSesion>
  );
}
