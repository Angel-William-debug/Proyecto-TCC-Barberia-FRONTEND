import Link from 'next/link';

import { Icono } from '@barber-shop/ui';

/**
 * CU-022 — alertas de stock sin resolver, visibles desde cualquier pantalla.
 *
 * `alertas_stock` la llenan solas los disparadores de la base; antes de esto
 * la tabla existía pero nadie la leía. Sin menú desplegable propio -no hay
 * ese componente en el sistema de diseño todavía-, así que enlaza directo a
 * Inventario, donde vive la lista completa.
 */
export function CampanaAlertas({ cantidad }: { cantidad: number }) {
  return (
    <Link
      href="/panel/inventario"
      aria-label={
        cantidad > 0
          ? `${cantidad} ${cantidad === 1 ? 'alerta' : 'alertas'} de stock sin resolver`
          : 'Sin alertas de stock pendientes'
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
