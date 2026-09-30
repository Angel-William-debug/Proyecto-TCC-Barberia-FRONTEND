'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { KeyboardEvent } from 'react';

import type { NombreIcono } from '@barber-shop/ui';
import { Icono, cn } from '@barber-shop/ui';

/**
 * Pestañas que cambian el modo de una pantalla sin cambiar de pantalla.
 *
 * La vista elegida va en la URL (`?vista=tarjetas`), como el resto del
 * estado de las pantallas: el botón Atrás vuelve a la anterior y un enlace
 * abre en el modo en que se compartió. La primera opción es la
 * predeterminada y no se escribe.
 *
 * Patrón de pestañas de la WAI-ARIA: `tablist` con `tab`, y las flechas
 * izquierda y derecha pasan de una a otra.
 */
export function PestanasVista({
  opciones,
  etiqueta,
}: {
  opciones: Array<{ valor: string; etiqueta: string; icono: NombreIcono }>;
  etiqueta: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  const predeterminada = opciones[0]!.valor;
  const actual = params.get('vista') ?? predeterminada;

  function elegir(valor: string) {
    // Cambiar de vista deja atrás el mes y el día del calendario: al volver,
    // abre otra vez en el próximo turno.
    const siguientes = new URLSearchParams();
    if (valor !== predeterminada) siguientes.set('vista', valor);
    const consulta = siguientes.toString();
    router.push(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
  }

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const siguiente = opciones[(i + (e.key === 'ArrowRight' ? 1 : -1) + opciones.length) % opciones.length]!;
    elegir(siguiente.valor);
    const botones = e.currentTarget.parentElement?.querySelectorAll('button');
    botones?.[opciones.indexOf(siguiente)]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={etiqueta}
      className="border-borde-sutil bg-superficie inline-flex rounded-md border p-1"
    >
      {opciones.map((o, i) => {
        const activa = o.valor === actual;
        return (
          <button
            key={o.valor}
            type="button"
            role="tab"
            aria-selected={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => elegir(o.valor)}
            onKeyDown={(e) => alTeclear(e, i)}
            className={cn(
              'text-cuerpo-sm inline-flex h-9 items-center gap-2 rounded-sm px-3 font-medium transition-colors',
              activa
                ? 'bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]'
                : 'text-secundario hover:text-principal hover:bg-elevado',
            )}
          >
            <Icono nombre={o.icono} tamano="sm" />
            {o.etiqueta}
          </button>
        );
      })}
    </div>
  );
}
