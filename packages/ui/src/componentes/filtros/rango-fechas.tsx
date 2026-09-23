'use client';

import { useId, useState } from 'react';

import { useFiltros } from './url';
import { cn } from '../../utilidades';

/**
 * Fecha de una tabla (seccion 9.9.1): un selector de periodo con atajos, y
 * dos campos de fecha solo cuando se elige «Personalizado».
 *
 * Antes eran siempre dos campos de fecha mas cuatro botones de atajo, que
 * solos ocupaban medio renglon de la barra. Los atajos siguen siendo el 90 %
 * de los usos -«lo de esta semana»-, asi que siguen estando, pero dentro de un
 * `select` nativo: en el telefono abre la rueda del sistema.
 *
 * Lo que se escribe en la URL no cambio: `desde` y `hasta` en aaaa-MM-dd. El
 * periodo elegido se DEDUCE de esas dos fechas -si van de hace 29 dias a hoy,
 * es «Ultimos 30 dias»-, asi que un enlace compartido o el boton Atras
 * muestran el selector correcto sin guardar nada mas.
 */

/** Periodos predefinidos. `dias` es cuantos dias antes de hoy empieza. */
const PERIODOS: Array<{ clave: string; etiqueta: string; dias: number }> = [
  { clave: 'hoy', etiqueta: 'Hoy', dias: 0 },
  { clave: '7', etiqueta: 'Últimos 7 días', dias: 6 },
  { clave: '30', etiqueta: 'Últimos 30 días', dias: 29 },
  { clave: '90', etiqueta: 'Últimos 90 días', dias: 89 },
];

const PERSONALIZADO = 'personalizado';

/** aaaa-MM-dd en la zona de la barberia. */
function aIso(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

function rangoDe(dias: number): { desde: string; hasta: string } {
  const fin = new Date();
  const inicio = new Date();
  inicio.setDate(fin.getDate() - dias);
  return { desde: aIso(inicio), hasta: aIso(fin) };
}

export interface PropsRangoFechas {
  etiqueta?: string;
  nombreDesde?: string;
  nombreHasta?: string;
}

const CONTROL = 'bg-fondo border-borde-control text-principal text-cuerpo h-10 rounded-md border px-3';

export function RangoFechas({
  etiqueta = 'Período',
  nombreDesde = 'desde',
  nombreHasta = 'hasta',
}: PropsRangoFechas) {
  const { params, aplicar } = useFiltros();
  const idPeriodo = useId();

  const desde = params.get(nombreDesde) ?? '';
  const hasta = params.get(nombreHasta) ?? '';

  // «Personalizado» elegido a mano. La URL no lo puede decir -dos fechas que
  // coinciden con un atajo se leen como el atajo-, asi que vive aca.
  const [personalizando, setPersonalizando] = useState(false);

  const deducido = !desde && !hasta
    ? ''
    : (PERIODOS.find((p) => {
        const r = rangoDe(p.dias);
        return r.desde === desde && r.hasta === hasta;
      })?.clave ?? PERSONALIZADO);

  // La eleccion explicita manda sobre lo deducido: con «Últimos 30 días»
  // puesto, elegir «Personalizado» tiene que mostrar las fechas aunque la URL
  // todavia diga lo mismo.
  const periodo = personalizando ? PERSONALIZADO : deducido;

  function elegir(clave: string) {
    if (clave === PERSONALIZADO) {
      // Se conservan las fechas que hubiera: pasar de «Últimos 30 días» a
      // personalizado es casi siempre para retocar uno de los dos extremos.
      setPersonalizando(true);
      return;
    }
    setPersonalizando(false);
    const p = PERIODOS.find((x) => x.clave === clave);
    if (!p) {
      aplicar({ [nombreDesde]: null, [nombreHasta]: null });
      return;
    }
    const r = rangoDe(p.dias);
    aplicar({ [nombreDesde]: r.desde, [nombreHasta]: r.hasta });
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={idPeriodo} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select
          id={idPeriodo}
          value={periodo}
          onChange={(e) => elegir(e.target.value)}
          className={cn(CONTROL, 'min-w-[11rem]')}
        >
          <option value="">Cualquier fecha</option>
          {PERIODOS.map((p) => (
            <option key={p.clave} value={p.clave}>
              {p.etiqueta}
            </option>
          ))}
          <option value={PERSONALIZADO}>Personalizado…</option>
        </select>

        {periodo === PERSONALIZADO && (
          <>
            <input
              type="date"
              value={desde}
              max={hasta || undefined}
              aria-label={`${etiqueta}: desde`}
              onChange={(e) => aplicar({ [nombreDesde]: e.target.value || null })}
              className={CONTROL}
            />
            <span className="text-terciario text-cuerpo-sm">a</span>
            <input
              type="date"
              value={hasta}
              min={desde || undefined}
              aria-label={`${etiqueta}: hasta`}
              onChange={(e) => aplicar({ [nombreHasta]: e.target.value || null })}
              className={CONTROL}
            />
          </>
        )}
      </div>
    </div>
  );
}
