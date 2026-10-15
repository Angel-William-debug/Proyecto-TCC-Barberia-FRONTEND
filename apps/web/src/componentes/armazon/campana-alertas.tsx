import Link from 'next/link';

import { Icono } from '@barber-shop/ui';

/**
 * La bandeja de notificaciones a la vista desde cualquier pantalla (CU-015,
 * CU-022; vista 95).
 *
 * Cuenta las alertas de stock sin resolver y los recordatorios que no
 * salieron para turnos que todavía no pasaron. Hasta el 15/10/2026 contaba
 * solo las alertas y llevaba a Inventario; ahora lleva a Notificaciones, cuya
 * primera tarjeta es esa misma bandeja. Sin menú desplegable propio -no hay
 * ese componente en el sistema de diseño todavía-.
 */
export function CampanaAlertas({ cantidad }: { cantidad: number }) {
  return (
    <Link
      href="/panel/notificaciones"
      aria-label={
        cantidad > 0
          ? `Notificaciones: ${cantidad} ${cantidad === 1 ? 'asunto pide' : 'asuntos piden'} atención`
          : 'Notificaciones: nada pendiente'
      }
      className="text-secundario hover:text-principal hover:bg-elevado focus-visible:ring-marca relative inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      <Icono nombre="bell" tamano="sm" />
      {cantidad > 0 && (
        <span
          aria-hidden="true"
          className="bg-[var(--chip-peligro-fondo)] text-peligro text-etiqueta absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-semibold"
        >
          {cantidad > 9 ? '9+' : cantidad}
        </span>
      )}
    </Link>
  );
}
