import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@barber-shop/ui';

import { Isotipo } from '@/componentes/marca/logo';
import { SelectorTema } from '@/componentes/armazon/selector-tema';

/**
 * Armazón común de las pantallas de sesión: ingreso, alta de cuenta y
 * recuperación de contraseña.
 *
 * Existe para que las tres se vean idénticas. Tres pantallas de acceso con
 * márgenes distintos es lo primero que delata un sistema armado a pedazos.
 *
 * FOTOS A LOS COSTADOS
 *
 * Pedido de la directora: la pantalla de alta del cliente era un formulario
 * solo en el centro de un fondo vacío, correcta pero sin nada que dijera
 * «barbería». En pantallas anchas lleva ahora una foto del oficio a cada lado
 * -las dos de la portada, sección 8.5-, fundidas hacia el centro con un
 * degradado del color de fondo para que acompañen al formulario sin
 * competirle. Va en el marco y no en una sola pantalla: si Crear cuenta tiene
 * fotos e Ingresar no, parece un error.
 *
 * En el teléfono no se muestran. Ahí agregarían desplazamiento antes del
 * formulario, que es lo único que se viene a hacer.
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
    <div className="bg-fondo relative grid min-h-dvh lg:grid-cols-[1fr_minmax(0,30rem)_1fr]">
      {/* El conmutador de tema también acá: quien entra directo a /ingresar
          —el caso habitual del personal— tiene que poder cambiarlo sin pasar
          por la portada. */}
      <div className="absolute top-4 right-4 z-10">
        <SelectorTema />
      </div>

      <FotoLateral src="/imagenes/barba.webp" lado="izquierdo" />

      <div className="flex items-center justify-center px-6 py-12">
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

      <FotoLateral src="/imagenes/corte.webp" lado="derecho" />
    </div>
  );
}

/**
 * Una foto de costado. Decorativa: `alt` vacío, porque el lector de pantalla
 * no gana nada con que le describan una foto que no aporta información.
 *
 * Sin `priority`: en el teléfono la foto está oculta, y precargarla gastaría
 * 80 KB en algo que no se ve.
 */
function FotoLateral({ src, lado }: { src: string; lado: 'izquierdo' | 'derecho' }) {
  return (
    <div className="relative hidden overflow-hidden lg:block" aria-hidden="true">
      <Image src={src} alt="" fill sizes="(min-width: 1024px) 35vw, 0px" className="object-cover" />
      {/* Funde la foto hacia el formulario con el color de fondo del tema, así
          que sirve igual en oscuro y en claro. */}
      <div
        className={cn(
          'from-fondo/20 via-fondo/55 to-fondo absolute inset-0',
          lado === 'izquierdo' ? 'bg-linear-to-r' : 'bg-linear-to-l',
        )}
      />
    </div>
  );
}
