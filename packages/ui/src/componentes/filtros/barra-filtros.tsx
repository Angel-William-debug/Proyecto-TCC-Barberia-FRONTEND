'use client';

import type { ReactNode } from 'react';

/** Contenedor de los controles de filtro de una tabla (seccion 9.9). */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return (
    <div className="border-borde-sutil flex flex-wrap items-end gap-3 border-b p-4">
      {children}
    </div>
  );
}
