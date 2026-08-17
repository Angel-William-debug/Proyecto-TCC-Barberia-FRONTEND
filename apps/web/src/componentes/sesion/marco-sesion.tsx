import Link from 'next/link';
import type { ReactNode } from 'react';

import { Isotipo } from '@/componentes/marca/logo';
import { SelectorTema } from '@/componentes/sistema/selector-tema';

/**
 * Armazón común de las pantallas de sesión: ingreso, alta de cuenta y
 * recuperación de contraseña.
 *
 * Existe para que las tres se vean idénticas. Tres pantallas de acceso con
 * márgenes distintos es lo primero que delata un sistema armado a pedazos.
 */
export function MarcoSesion({
  titulo,
  descripcion,
  children,
  pie,
}: {
  titulo?: string;
  descripcion: string;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <div className="bg-fondo relative flex min-h-dvh items-center justify-center px-6 py-12">
      {/* El conmutador de tema también acá: quien entra directo a /ingresar
          —el caso habitual del personal— tiene que poder cambiarlo sin pasar
          por la portada. */}
      <div className="absolute top-4 right-4">
        <SelectorTema />
      </div>

      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Link href="/" aria-label="Barber Shop, ir al inicio">
            <Isotipo className="h-14 w-14" />
          </Link>
          <p className="font-display text-principal mt-5 text-3xl font-semibold tracking-wide">
            BARBER<span className="text-marca">SHOP</span>
          </p>
          {titulo && (
            <h1 className="text-titulo-2 text-principal mt-4 font-semibold">{titulo}</h1>
          )}
          <p className="text-cuerpo text-terciario mt-2">{descripcion}</p>
        </div>

        <div className="border-borde-sutil bg-superficie mt-8 rounded-lg border p-6">
          {children}
        </div>

        {pie && <div className="text-cuerpo-sm text-terciario mt-6 text-center">{pie}</div>}
      </div>
    </div>
  );
}
