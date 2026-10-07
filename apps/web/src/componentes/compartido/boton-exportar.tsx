'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { MODO_DEMO, type TipoReporte } from '@barber-shop/api';
import { Icono, cn } from '@barber-shop/ui';

import { fecha, texto, type Parametros } from '@/lib/filtros';

/**
 * Un solo botón "Exportar", con un menú desplegable para Excel, PDF y —si el
 * panel lo tiene— los PDFs individuales en lote. Antes eran dos o tres
 * botones sueltos uno al lado del otro; con más de dos opciones (varios
 * paneles ya suman la tercera) eso se veía como una fila de botones sin
 * relación entre sí, en vez de una sola acción con variantes.
 *
 * Mismo patrón de `<details>` + cierre al clickear afuera que ya usa
 * `SelectorServicios` en el formulario de reserva del portal — no se suma
 * una librería de menús nueva para esto.
 *
 * No hay lógica de exportación acá: apunta a la misma ruta genérica que ya
 * usa la pantalla de Reportes (`/panel/reportes/exportar`), y a la ruta de
 * PDFs individuales que cada panel ya tenía resuelta por su cuenta.
 */
export function BotonExportar({
  tipo,
  searchParams,
  individual,
}: {
  tipo: TipoReporte;
  searchParams?: Parametros;
  /** Si el panel genera PDFs en lote (opción A), la ruta que los arma. */
  individual?: { href: string; etiqueta?: string };
}) {
  const contenedor = useRef<HTMLDetailsElement>(null);

  // Cierra al hacer clic fuera. `<details>` no lo hace por su cuenta.
  useEffect(() => {
    function alClicar(evento: MouseEvent) {
      const nodo = contenedor.current;
      if (nodo?.open && !nodo.contains(evento.target as Node)) nodo.open = false;
    }
    document.addEventListener('mousedown', alClicar);
    return () => document.removeEventListener('mousedown', alClicar);
  }, []);

  if (MODO_DEMO) {
    return (
      <p className="text-cuerpo-sm text-terciario">
        La exportación no está disponible en modo demostración.
      </p>
    );
  }

  const query = new URLSearchParams();
  query.set('tipo', tipo);
  const desde = searchParams && fecha(searchParams, 'desde');
  const hasta = searchParams && fecha(searchParams, 'hasta');
  const busqueda = searchParams && texto(searchParams, 'q');
  if (desde) query.set('desde', desde);
  if (hasta) query.set('hasta', hasta);
  if (busqueda) query.set('q', busqueda);

  function cerrar() {
    if (contenedor.current) contenedor.current.open = false;
  }

  return (
    <details ref={contenedor} className="relative inline-block">
      <summary
        className={cn(
          'border-borde-control text-principal text-cuerpo-sm font-medium',
          'inline-flex h-9 cursor-pointer list-none items-center gap-1.5',
          'rounded-md border px-3 select-none',
          'hover:bg-elevado',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <Icono nombre="download" tamano="sm" />
        Exportar
        <Icono nombre="chevron-down" tamano="xs" className="text-terciario" />
      </summary>

      <div
        role="menu"
        className={cn(
          'bg-elevado border-borde-sutil absolute right-0 z-20 mt-1 w-60',
          'rounded-md border p-1 shadow-2',
        )}
      >
        <ItemMenu
          href={`/panel/reportes/exportar?${query.toString()}&formato=excel`}
          icono="file-spreadsheet"
          etiqueta="Descargar Excel"
          onClick={cerrar}
        />
        <ItemMenu
          href={`/panel/reportes/exportar?${query.toString()}&formato=pdf`}
          icono="file-text"
          etiqueta="Descargar PDF"
          onClick={cerrar}
        />
        {individual && (
          <>
            <div className="bg-borde-sutil my-1 h-px" />
            <ItemMenu
              href={individual.href}
              icono="file-archive"
              etiqueta={individual.etiqueta ?? 'PDFs individuales (.zip)'}
              onClick={cerrar}
            />
          </>
        )}
      </div>
    </details>
  );
}

function ItemMenu({
  href,
  icono,
  etiqueta,
  onClick,
}: {
  href: string;
  icono: 'file-spreadsheet' | 'file-text' | 'file-archive';
  etiqueta: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        'text-cuerpo-sm text-principal flex items-center gap-2.5',
        'rounded-sm px-2.5 py-2 hover:bg-superficie',
      )}
    >
      <Icono nombre={icono} tamano="sm" className="text-terciario shrink-0" />
      {etiqueta}
    </Link>
  );
}
