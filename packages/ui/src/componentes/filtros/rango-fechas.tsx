'use client';

import { useId } from 'react';

import { useFiltros } from './url';
import { cn } from '../../utilidades';

/**
 * Rango de fechas con atajos (seccion 9.9.1).
 *
 * Los atajos -Hoy, 7 dias, 30 dias, 90 dias- existen porque son el 90 % de los
 * usos y escribir dos fechas a mano para ver «lo de esta semana» es trabajo
 * que la pantalla puede ahorrar.
 */

/** Atajos del rango de fechas. Cubren el 90 % de las consultas reales. */
const ATAJOS: Array<{ clave: string; etiqueta: string; dias: number }> = [
  { clave: 'hoy', etiqueta: 'Hoy', dias: 0 },
  { clave: '7', etiqueta: 'Últimos 7 días', dias: 6 },
  { clave: '30', etiqueta: 'Últimos 30 días', dias: 29 },
  { clave: '90', etiqueta: 'Últimos 90 días', dias: 89 },
];

function aIso(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

export interface PropsRangoFechas {
  etiqueta?: string;
  nombreDesde?: string;
  nombreHasta?: string;
}

/**
 * Rango de fechas con atajos.
 *
 * Los campos son `<input type="date">` nativos: el selector del sistema ya
 * está traducido, respeta el formato local y funciona con teclado. Uno propio
 * costaría cientos de líneas para quedar peor.
 */
export function RangoFechas({
  etiqueta = 'Período',
  nombreDesde = 'desde',
  nombreHasta = 'hasta',
}: PropsRangoFechas) {
  const { params, aplicar } = useFiltros();
  const idDesde = useId();
  const idHasta = useId();

  const desde = params.get(nombreDesde) ?? '';
  const hasta = params.get(nombreHasta) ?? '';

  function aplicarAtajo(dias: number) {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - dias);
    aplicar({ [nombreDesde]: aIso(inicio), [nombreHasta]: aIso(fin) });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario font-medium">{etiqueta}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={idDesde}
          type="date"
          value={desde}
          max={hasta || undefined}
          aria-label={`${etiqueta}: desde`}
          onChange={(e) => aplicar({ [nombreDesde]: e.target.value || null })}
          className="bg-fondo border-borde-control text-principal text-cuerpo h-10 rounded-md border px-3"
        />
        <span className="text-terciario text-cuerpo-sm">a</span>
        <input
          id={idHasta}
          type="date"
          value={hasta}
          min={desde || undefined}
          aria-label={`${etiqueta}: hasta`}
          onChange={(e) => aplicar({ [nombreHasta]: e.target.value || null })}
          className="bg-fondo border-borde-control text-principal text-cuerpo h-10 rounded-md border px-3"
        />

        <div className="flex flex-wrap gap-1">
          {ATAJOS.map((a) => (
            <button
              key={a.clave}
              type="button"
              onClick={() => aplicarAtajo(a.dias)}
              className={cn(
                'text-cuerpo-sm text-secundario hover:bg-elevado hover:text-principal',
                'h-8 rounded-md px-2.5 whitespace-nowrap',
              )}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
