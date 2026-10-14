import Link from 'next/link';

import type { CitaCompleta } from '@barber-shop/tipos';
import {
  PRESENTACION_CITA,
  PuntoEstado,
  ZONA_HORARIA,
  cn,
  hora,
  mayusculaInicial,
  plural,
} from '@barber-shop/ui';

/**
 * Las vistas Semana y Mes de la agenda del panel (vistas 38 y 39 del anexo,
 * 15/10/2026). La agenda era solo diaria: para ver cómo venía la semana había
 * que pasar día por día.
 *
 * Las dos son de lectura rápida: cada turno con su hora, su cliente y el punto
 * de color de su estado (§10.1). Tocar un día -o un turno- lleva a la vista
 * Día de esa fecha, donde están el detalle y las acciones. Con un barbero
 * elegido en el filtro, se ven solo sus turnos.
 */

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA });

/** aaaa-MM-dd de un instante, en la zona de la barbería. */
function diaLocal(iso: string): string {
  return fmtDia.format(new Date(iso));
}

/** Suma días a un aaaa-MM-dd. */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  const r = new Date(Date.UTC(a, m - 1, d + dias));
  return r.toISOString().slice(0, 10);
}

/** El lunes de la semana de un aaaa-MM-dd. */
export function lunesDe(fecha: string): string {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  const dow = (new Date(Date.UTC(a, m - 1, d)).getUTCDay() + 6) % 7;
  return sumarDias(fecha, -dow);
}

/** Primer y último día que muestra la grilla del mes (semanas completas). */
export function limitesMes(fecha: string): { desde: string; hasta: string; mes: string } {
  const mes = fecha.slice(0, 7);
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const primero = `${mes}-01`;
  const ultimo = `${mes}-${String(new Date(Date.UTC(a, m, 0)).getUTCDate()).padStart(2, '0')}`;
  return { desde: lunesDe(primero), hasta: sumarDias(lunesDe(ultimo), 6), mes };
}

function agrupar(citas: CitaCompleta[]): Map<string, CitaCompleta[]> {
  const porDia = new Map<string, CitaCompleta[]>();
  for (const c of [...citas].sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))) {
    const d = diaLocal(c.fecha_hora);
    porDia.set(d, [...(porDia.get(d) ?? []), c]);
  }
  return porDia;
}

function enlaceDia(fecha: string, barbero?: string) {
  const p = new URLSearchParams({ fecha });
  if (barbero) p.set('barbero', barbero);
  return `/panel/agenda?${p.toString()}`;
}

export function CalendarioSemana({
  desde,
  citas,
  hoy,
  barbero,
}: {
  desde: string;
  citas: CitaCompleta[];
  hoy: string;
  barbero?: string;
}) {
  const porDia = agrupar(citas);
  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(desde, i));

  return (
    <div className="grid gap-2 overflow-x-auto md:grid-cols-7">
      {dias.map((d, i) => {
        const lista = porDia.get(d) ?? [];
        return (
          <section
            key={d}
            aria-label={`${DIAS[i]} ${Number(d.slice(8))}, ${plural(lista.length, 'turno', 'turnos')}`}
            className={cn(
              'border-borde-sutil bg-fondo flex min-h-40 flex-col rounded-md border p-2',
              d === hoy && 'border-marca',
            )}
          >
            <Link
              href={enlaceDia(d, barbero)}
              className="text-cuerpo-sm text-secundario hover:text-principal mb-2 flex items-baseline justify-between"
            >
              <span className="font-semibold uppercase">{DIAS[i]}</span>
              <span className={cn('tabular-nums', d === hoy && 'text-marca font-semibold')}>{Number(d.slice(8))}</span>
            </Link>
            {lista.length === 0 ? (
              <span className="text-titulillo text-terciario">Sin turnos</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {lista.map((c) => (
                  <li key={c.id_cita}>
                    <Link
                      href={enlaceDia(d, barbero)}
                      className="hover:bg-elevado flex items-start gap-1.5 rounded-sm px-1 py-0.5"
                      title={`${hora(c.fecha_hora)} a ${hora(c.fechaHoraFin)} · ${c.cliente.nombre} · ${PRESENTACION_CITA[c.estado].etiqueta}`}
                    >
                      <span className="mt-1.5">
                        <PuntoEstado
                          tono={PRESENTACION_CITA[c.estado].tono}
                          etiqueta={PRESENTACION_CITA[c.estado].etiqueta}
                          sinEtiqueta
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="text-titulillo text-principal block tabular-nums">
                          {hora(c.fecha_hora)} a {hora(c.fechaHoraFin)}
                        </span>
                        <span
                          className={cn(
                            'text-titulillo block truncate',
                            c.estado === 'cancelado' ? 'text-terciario line-through' : 'text-secundario',
                          )}
                        >
                          {c.cliente.nombre}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function CalendarioMes({
  fecha,
  citas,
  hoy,
  barbero,
}: {
  fecha: string;
  citas: CitaCompleta[];
  hoy: string;
  barbero?: string;
}) {
  const { desde, hasta, mes } = limitesMes(fecha);
  const porDia = agrupar(citas);
  const celdas: string[] = [];
  for (let d = desde; d <= hasta; d = sumarDias(d, 1)) celdas.push(d);

  return (
    <div>
      <p className="text-titulo-3 text-principal mb-3 font-semibold">
        {mayusculaInicial(
          new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
            new Date(`${mes}-15T12:00:00Z`),
          ),
        )}
      </p>
      <div className="grid grid-cols-7 gap-1" aria-hidden="true">
        {DIAS.map((d) => (
          <span key={d} className="text-titulillo text-terciario py-1 text-center uppercase">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {celdas.map((d) => {
          const lista = porDia.get(d) ?? [];
          const delMes = d.startsWith(mes);
          const activos = lista.filter((c) => c.estado !== 'cancelado').length;
          return (
            <Link
              key={d}
              href={enlaceDia(d, barbero)}
              aria-label={`${Number(d.slice(8))}, ${plural(lista.length, 'turno', 'turnos')}`}
              className={cn(
                'border-borde-sutil hover:border-marca flex min-h-20 flex-col gap-1 rounded-md border p-1.5',
                delMes ? 'bg-fondo' : 'bg-superficie opacity-60',
                d === hoy && 'border-marca',
              )}
            >
              <span
                className={cn(
                  'text-cuerpo-sm tabular-nums',
                  d === hoy ? 'text-marca font-semibold' : lista.length ? 'text-principal font-semibold' : 'text-terciario',
                )}
              >
                {Number(d.slice(8))}
              </span>
              {lista.length > 0 && (
                <>
                  <span className="flex flex-wrap gap-1">
                    {lista.slice(0, 6).map((c) => (
                      <PuntoEstado
                        key={c.id_cita}
                        tono={PRESENTACION_CITA[c.estado].tono}
                        etiqueta={PRESENTACION_CITA[c.estado].etiqueta}
                        sinEtiqueta
                      />
                    ))}
                  </span>
                  <span className="text-titulillo text-secundario hidden sm:block">
                    {activos > 0
                      ? plural(activos, 'turno', 'turnos')
                      : plural(lista.length, 'cancelado', 'cancelados')}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
