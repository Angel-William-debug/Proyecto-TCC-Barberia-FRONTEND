import Link from 'next/link';

import { Boton, Icono } from '@barber-shop/ui';

import { FormularioIngreso } from '@/componentes/sesion/formulario-ingreso';
import { MarcoSesion } from '@/componentes/sesion/marco-sesion';

export const metadata = { title: 'Ingresar' };

/**
 * CU-001 — Inicio de sesión.
 *
 * La credencial vive en `auth.users` de Supabase Auth (RN-001); el sistema
 * nunca guarda ni compara contraseñas por su cuenta. La columna
 * `usuarios.password_hash` se eliminó por eso mismo.
 *
 * Si llega con `?volver=` es porque el middleware lo mandó acá desde una
 * pantalla privada: la sesión venció (o nunca la hubo). Se avisa (vista 93) y,
 * al ingresar, vuelve a esa pantalla.
 */
export default async function PaginaIngresar({
  searchParams,
}: {
  searchParams: Promise<{ volver?: string }>;
}) {
  const { volver } = await searchParams;
  return (
    <MarcoSesion
      descripcion="Ingrese con su cuenta del sistema"
      pie={
        <Link href="/" className="hover:text-principal underline">
          Volver a la página principal
        </Link>
      }
    >
      {volver && (
        <div
          role="status"
          className="border-borde-sutil text-cuerpo-sm text-secundario bg-elevado mb-5 flex items-start gap-2 rounded-md border p-3"
        >
          <Icono nombre="clock" tamano="sm" className="text-marca mt-0.5" />
          <span>Su sesión terminó. Ingrese de nuevo y lo llevamos a la pantalla donde estaba.</span>
        </div>
      )}
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
