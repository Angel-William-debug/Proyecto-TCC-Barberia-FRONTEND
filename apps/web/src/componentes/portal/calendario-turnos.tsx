'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { ESTADOS_CITA, type TurnoDelCliente } from '@barber-shop/tipos';
import {
  Boton,
  BotonIcono,
  PRESENTACION_CITA,
  PuntoEstado,
  ZONA_HORARIA,
  cn,
  fechaLarga,
  hora,
  mayusculaInicial,
  plural,
} from '@barber-shop/ui';

import { TarjetaTurno } from './tarjeta-turno';

/**
 * Los turnos del cliente en un calendario del mes.
 *
 * Pedido de la directora: ademas de la lista de tarjetas, un modo grilla
 * donde se vean los turnos en el calendario, con su estado. Aca aparecen
 * TODOS -los que vienen, los completados, los cancelados, a los que no
 * asistio-, cada uno con el color de su estado, el mismo de los chips del
 * resto del sistema (seccion 10.1).
 *
 * Tocar un dia muestra debajo sus turnos con la misma `TarjetaTurno` de la
 * lista: el detalle desplegable y el boton de cancelar salen gratis, y no
 * hay dos formas de mostrar un turno.
 *
 * EL MES Y EL DIA VIVEN EN LA URL (`?mes=2026-11&dia=2026-11-26`), como los
 * filtros de las tablas: el boton Atras vuelve al mes anterior y el enlace se
 * comparte. Sin `mes`, abre en el del proximo turno, que es lo que el cliente
 * viene a mirar; si no tiene ninguno, en el mes actual.
 *
 * Las fechas se agrupan por dia en la zona de la barberia, no en la del
 * navegador: un turno a las 23:30 no puede caer en el dia siguiente porque
 * el telefono este en otra zona.
 */

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

/** aaaa-MM-dd de un instante, en la zona de la barberia. */
function diaLocal(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date(iso));
}

/** Suma meses a un aaaa-MM. */
function moverMes(mes: string, delta: number): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function tituloMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const texto = new Intl.DateTimeFormat('es-PY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(a, m - 1, 1)));
  return mayusculaInicial(texto);
}

/** Las celdas del mes: `null` para los huecos antes del dia 1 y despues del ultimo. */
function celdasDelMes(mes: string): Array<string | null> {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const primero = new Date(Date.UTC(a, m - 1, 1));
  const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  // La semana empieza el lunes, como se lee un calendario en Paraguay.
  const hueco = (primero.getUTCDay() + 6) % 7;

  const celdas: Array<string | null> = Array.from({ length: hueco }, () => null);
  for (let d = 1; d <= dias; d++) celdas.push(`${mes}-${String(d).padStart(2, '0')}`);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

export function CalendarioTurnos({
  turnos,
  proximo,
  hoy,
}: {
  /** Todos los turnos del cliente, de cualquier estado. */
  turnos: TurnoDelCliente[];
  /** El proximo turno vigente, si hay: decide el mes en que se abre. */
  proximo: TurnoDelCliente | null;
  /** aaaa-MM-dd de hoy en la zona de la barberia, calculado en el servidor. */
  hoy: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  const diaProximo = proximo ? diaLocal(proximo.fechaHora) : null;
  const mesUrl = params.get('mes');
  const mes = mesUrl && /^\d{4}-\d{2}$/.test(mesUrl) ? mesUrl : (diaProximo ?? hoy).slice(0, 7);
  // Sin dia elegido, el del proximo turno si cae en el mes que se muestra:
  // asi el cliente ve su turno sin tocar nada.
  const diaUrl = params.get('dia');
  const dia = diaUrl ?? (!mesUrl && diaProximo?.startsWith(mes) ? diaProximo : null);

  function ir(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) siguientes.set(k, v);
      else siguientes.delete(k);
    }
    router.push(`${ruta}?${siguientes.toString()}`, { scroll: false });
  }

  // Turnos agrupados por dia local, ordenados por hora.
  const porDia = new Map<string, TurnoDelCliente[]>();
  for (const t of [...turnos].sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))) {
    const clave = diaLocal(t.fechaHora);
    porDia.set(clave, [...(porDia.get(clave) ?? []), t]);
  }

  const delDia = dia ? (porDia.get(dia) ?? []) : [];
  const enElMes = [...porDia.entries()].filter(([d]) => d.startsWith(mes)).reduce((n, [, l]) => n + l.length, 0);

  return (
    <div className="flex flex-col gap-6">
      <section
        aria-label={`Calendario de ${tituloMes(mes)}`}
        className="border-borde-sutil bg-superficie rounded-lg border p-3 sm:p-4"
      >
        {/* ------------------------------------------------ navegacion */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <BotonIcono
              icono="chevron-left"
              etiqueta="Mes anterior"
              variante="terciario"
              onClick={() => ir({ mes: moverMes(mes, -1), dia: null })}
            />
            <h2 className="text-titulo-3 text-principal min-w-[10rem] text-center font-semibold">
              {tituloMes(mes)}
            </h2>
            <BotonIcono
              icono="chevron-right"
              etiqueta="Mes siguiente"
              variante="terciario"
              onClick={() => ir({ mes: moverMes(mes, 1), dia: null })}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-cuerpo-sm text-terciario hidden sm:inline">
              {enElMes ? plural(enElMes, 'turno este mes', 'turnos este mes') : 'Sin turnos este mes'}
            </span>
            <Boton
              variante="secundario"
              tamano="sm"
              onClick={() => ir({ mes: hoy.slice(0, 7), dia: hoy })}
            >
              Hoy
            </Boton>
          </div>
        </div>

        {/* ------------------------------------------------ la grilla */}
        <div className="mt-3 grid grid-cols-7 gap-1" aria-hidden="true">
          {DIAS_SEMANA.map((d) => (
            <span key={d} className="text-titulillo text-terciario py-1 text-center uppercase">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {celdasDelMes(mes).map((clave, i) => {
            if (!clave) return <span key={`hueco-${i}`} aria-hidden="true" />;

            const lista = porDia.get(clave) ?? [];
            const elegido = clave === dia;
            const esHoy = clave === hoy;
            const numero = Number(clave.slice(8));

            const descripcion = lista.length
              ? `${plural(lista.length, 'turno', 'turnos')}: ` +
                lista.map((t) => `${hora(t.fechaHora)} ${PRESENTACION_CITA[t.estado].etiqueta}`).join(', ')
              : 'sin turnos';

            return (
              <button
                key={clave}
                type="button"
                onClick={() => ir({ mes, dia: clave })}
                aria-pressed={elegido}
                aria-current={esHoy ? 'date' : undefined}
                aria-label={`${fechaLarga(`${clave}T12:00:00`)}, ${descripcion}`}
                className={cn(
                  'flex min-h-14 flex-col items-stretch gap-1 rounded-md border p-1 text-left transition-colors sm:min-h-20 sm:p-1.5',
                  elegido
                    ? 'border-marca bg-[var(--chip-marca-fondo)]'
                    : lista.length
                      ? 'border-borde-sutil bg-fondo hover:border-borde-control'
                      : 'hover:bg-elevado border-transparent',
                )}
              >
                <span
                  className={cn(
                    'text-cuerpo-sm inline-flex h-6 w-6 items-center justify-center self-center rounded-full tabular-nums sm:self-start',
                    esHoy ? 'bg-marca text-[var(--texto-sobre-marca)] font-semibold' : 'text-secundario',
                    lista.length && !esHoy && 'text-principal font-semibold',
                  )}
                >
                  {numero}
                </span>

                {/* Telefono: solo puntos. Desde sm: hora y punto de cada turno. */}
                {lista.length > 0 && (
                  <>
                    <span className="flex flex-wrap justify-center gap-1 sm:hidden">
                      {lista.slice(0, 3).map((t) => (
                        <PuntoEstado
                          key={t.idCita}
                          tono={PRESENTACION_CITA[t.estado].tono}
                          etiqueta={PRESENTACION_CITA[t.estado].etiqueta}
                          sinEtiqueta
                        />
                      ))}
                    </span>
                    <span className="hidden flex-col gap-0.5 sm:flex">
                      {lista.slice(0, 2).map((t) => (
                        <span key={t.idCita} className="flex items-center gap-1">
                          <PuntoEstado
                            tono={PRESENTACION_CITA[t.estado].tono}
                            etiqueta={PRESENTACION_CITA[t.estado].etiqueta}
                            sinEtiqueta
                          />
                          <span
                            className={cn(
                              'text-titulillo tabular-nums',
                              t.estado === 'cancelado' ? 'text-terciario line-through' : 'text-principal',
                            )}
                          >
                            {hora(t.fechaHora)}
                          </span>
                        </span>
                      ))}
                      {lista.length > 2 && (
                        <span className="text-titulillo text-terciario">+{lista.length - 2} más</span>
                      )}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* ------------------------------------------------ leyenda */}
        <ul className="border-borde-sutil mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3" aria-label="Estados">
          {ESTADOS_CITA.map((e) => (
            <li key={e}>
              <PuntoEstado tono={PRESENTACION_CITA[e].tono} etiqueta={PRESENTACION_CITA[e].etiqueta} />
            </li>
          ))}
        </ul>
      </section>

      {/* -------------------------------------------------- el dia elegido */}
      <section aria-live="polite">
        {!dia ? (
          <p className="text-cuerpo-sm text-terciario">Toque un día para ver sus turnos.</p>
        ) : (
          <>
            <h2 className="text-titulo-3 text-principal font-semibold">
              {mayusculaInicial(fechaLarga(`${dia}T12:00:00`))}
            </h2>
            {delDia.length === 0 ? (
              <p className="text-cuerpo-sm text-terciario mt-2">No tiene turnos este día.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-4">
                {delDia.map((t) => (
                  <li key={t.idCita}>
                    <TarjetaTurno turno={t} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>
    </div>
  );
}
