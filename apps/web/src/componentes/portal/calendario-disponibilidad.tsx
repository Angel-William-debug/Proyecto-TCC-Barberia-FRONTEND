'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef } from 'react';

import type { BloqueOcupado, VistaPublicoBarbero, VistaPublicoHorario } from '@barber-shop/tipos';
import {
  Boton,
  BotonIcono,
  PRESENTACION_NIVEL,
  PuntoEstado,
  cn,
  fechaLarga,
  horarioDe,
  mayusculaInicial,
  nivelDelDia,
  primerInicioReservable,
  textoMinuto,
  minutoDeHora,
  tramosDelBarbero,
  type NivelDia,
  type Tramo,
} from '@barber-shop/ui';

/**
 * El calendario de disponibilidad de los barberos (pedido de la directora,
 * 7/10/2026): el cliente elige uno o mas barberos y ve, dia por dia, cuando
 * estan libres y cuando ocupados, antes de reservar.
 *
 * TRES PASOS, DE LO GENERAL A LO PARTICULAR
 *
 *   1. Los barberos: chips arriba, «Todos» o los que elija.
 *   2. El mes: cada dia con su nivel -Libre, Pocos lugares, Completo,
 *      Cerrado-, sumando el tiempo libre de los barberos elegidos.
 *   3. El dia: un pop-up con una linea de tiempo por barbero y sus tramos.
 *      Un tramo libre lleva a Reservar con el dia, el barbero y la hora ya
 *      puestos: solo falta elegir el servicio.
 *
 * Nunca dice de quien es un turno: la base solo devuelve barbero, inicio y
 * fin (`fn_ocupacion_barberos`). La cuenta de los tramos esta en
 * `disponibilidad.ts` de `packages/ui`, que la app copia tal cual.
 *
 * Todo el estado vive en la URL (`?vista=calendario&barberos=1,3&mes=…&dia=…`),
 * como en «Mis turnos»: Atras vuelve al paso anterior y el enlace se comparte.
 * El servidor lee `mes` y `barberos` para pedir solo esa ocupacion.
 */

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const NIVELES_LEYENDA: NivelDia[] = ['libre', 'pocos', 'completo', 'cerrado'];

function moverMes(mes: string, delta: number): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const d = new Date(Date.UTC(a, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function tituloMes(mes: string): string {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  return mayusculaInicial(
    new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
      new Date(Date.UTC(a, m - 1, 1)),
    ),
  );
}

function celdasDelMes(mes: string): Array<string | null> {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const primero = new Date(Date.UTC(a, m - 1, 1));
  const dias = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const hueco = (primero.getUTCDay() + 6) % 7;
  const celdas: Array<string | null> = Array.from({ length: hueco }, () => null);
  for (let d = 1; d <= dias; d++) celdas.push(`${mes}-${String(d).padStart(2, '0')}`);
  while (celdas.length % 7 !== 0) celdas.push(null);
  return celdas;
}

/** Clases del fondo de un tramo y de la celda de un nivel. */
const FONDO_NIVEL: Record<NivelDia, string> = {
  libre: 'bg-[var(--chip-exito-fondo)] border-transparent',
  pocos: 'bg-[var(--chip-advertencia-fondo)] border-transparent',
  completo: 'bg-[var(--chip-peligro-fondo)] border-transparent',
  cerrado: 'bg-fondo border-borde-sutil',
  pasado: 'bg-fondo border-borde-sutil',
};

export function CalendarioDisponibilidad({
  barberos,
  horarios,
  ocupacion,
  hoy,
  ahora,
}: {
  barberos: VistaPublicoBarbero[];
  horarios: VistaPublicoHorario[];
  /** Los bloques ocupados del mes visible, de los barberos elegidos. */
  ocupacion: BloqueOcupado[];
  /** aaaa-MM-dd de hoy en la zona de la barberia. */
  hoy: string;
  /** El instante de la consulta, del servidor: el mismo en servidor y navegador. */
  ahora: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const momento = new Date(ahora);

  const mesUrl = params.get('mes');
  const mes = mesUrl && /^\d{4}-\d{2}$/.test(mesUrl) ? mesUrl : hoy.slice(0, 7);
  const dia = params.get('dia');

  const idsUrl = (params.get('barberos') ?? '')
    .split(',')
    .map(Number)
    .filter((n) => barberos.some((b) => b.id_profesional === n));
  // Ninguno elegido es «Todos»: es lo que quiere ver quien no tiene preferencia.
  const elegidos = idsUrl.length ? barberos.filter((b) => idsUrl.includes(b.id_profesional)) : barberos;

  function ir(cambios: Record<string, string | null>) {
    const siguientes = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v) siguientes.set(k, v);
      else siguientes.delete(k);
    }
    router.push(`${ruta}?${siguientes.toString()}`, { scroll: false });
  }

  function alternarBarbero(id: number | null) {
    if (id == null) return ir({ barberos: null, dia: null });
    const siguiente = idsUrl.includes(id) ? idsUrl.filter((n) => n !== id) : [...idsUrl, id];
    ir({ barberos: siguiente.join(','), dia: null });
  }

  const porBarbero = (id: number) => ocupacion.filter((b) => b.id_profesional === id);
  const tramosDe = (fecha: string, id: number) =>
    tramosDelBarbero(fecha, horarioDe(fecha, horarios), porBarbero(id), momento);
  const nivelDe = (fecha: string) =>
    nivelDelDia(
      fecha,
      horarioDe(fecha, horarios),
      elegidos.map((b) => tramosDe(fecha, b.id_profesional)),
      momento,
    );

  return (
    <div className="flex flex-col gap-4">
      {/* ------------------------------------------------- 1. barberos */}
      <div>
        <p id="etiqueta-barberos" className="text-etiqueta text-secundario mb-2 font-medium">
          Barberos
        </p>
        <div role="group" aria-labelledby="etiqueta-barberos" className="flex flex-wrap gap-2">
          <ChipBarbero activo={idsUrl.length === 0} onClick={() => alternarBarbero(null)}>
            Todos
          </ChipBarbero>
          {barberos.map((b) => (
            <ChipBarbero
              key={b.id_profesional}
              activo={idsUrl.includes(b.id_profesional)}
              onClick={() => alternarBarbero(b.id_profesional)}
            >
              {b.nombre}
            </ChipBarbero>
          ))}
        </div>
      </div>

      {/* ------------------------------------------------------ 2. mes */}
      <section
        aria-label={`Disponibilidad de ${tituloMes(mes)}`}
        className="border-borde-sutil bg-superficie rounded-lg border p-3 sm:p-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <BotonIcono
              icono="chevron-left"
              etiqueta="Mes anterior"
              variante="terciario"
              // No hay disponibilidad que mirar en el pasado.
              disabled={mes <= hoy.slice(0, 7)}
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
          <Boton variante="secundario" tamano="sm" onClick={() => ir({ mes: null, dia: null })}>
            Hoy
          </Boton>
        </div>

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

            const nivel = nivelDe(clave);
            const p = PRESENTACION_NIVEL[nivel];
            const numero = Number(clave.slice(8));
            const tocable = nivel !== 'cerrado' && nivel !== 'pasado';

            const contenido = (
              <>
                <span
                  className={cn(
                    'text-cuerpo-sm inline-flex h-6 w-6 items-center justify-center self-center rounded-full tabular-nums sm:self-start',
                    clave === hoy
                      ? 'bg-marca font-semibold text-[var(--texto-sobre-marca)]'
                      : tocable
                        ? 'text-principal font-semibold'
                        : 'text-terciario',
                  )}
                >
                  {numero}
                </span>
                {nivel !== 'pasado' && (
                  <>
                    <span className="flex justify-center sm:hidden">
                      <PuntoEstado tono={p.tono} etiqueta={p.etiqueta} sinEtiqueta />
                    </span>
                    <span className="text-titulillo text-secundario hidden sm:block">{p.etiqueta}</span>
                  </>
                )}
              </>
            );

            if (!tocable) {
              return (
                <span
                  key={clave}
                  aria-label={`${fechaLarga(`${clave}T12:00:00`)}, ${p.etiqueta.toLowerCase()}`}
                  className={cn(
                    'flex min-h-14 flex-col gap-1 rounded-md border p-1 opacity-70 sm:min-h-20 sm:p-1.5',
                    FONDO_NIVEL[nivel],
                  )}
                >
                  {contenido}
                </span>
              );
            }

            return (
              <button
                key={clave}
                type="button"
                onClick={() => ir({ mes, dia: clave })}
                aria-haspopup="dialog"
                aria-current={clave === hoy ? 'date' : undefined}
                aria-label={`${fechaLarga(`${clave}T12:00:00`)}, ${p.etiqueta.toLowerCase()}`}
                className={cn(
                  'flex min-h-14 cursor-pointer flex-col items-stretch gap-1 rounded-md border p-1 text-left transition-colors sm:min-h-20 sm:p-1.5',
                  FONDO_NIVEL[nivel],
                  clave === dia ? 'border-marca' : 'hover:border-marca',
                )}
              >
                {contenido}
              </button>
            );
          })}
        </div>

        <ul className="border-borde-sutil mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3" aria-label="Niveles">
          {NIVELES_LEYENDA.map((n) => (
            <li key={n}>
              <PuntoEstado tono={PRESENTACION_NIVEL[n].tono} etiqueta={PRESENTACION_NIVEL[n].etiqueta} />
            </li>
          ))}
        </ul>
      </section>

      <p className="text-cuerpo-sm text-terciario">
        Toque un día para ver los horarios libres de {elegidos.length === 1 ? elegidos[0]!.nombre : 'cada barbero'}.
        Nunca se muestra de quién es un turno.
      </p>

      {/* ------------------------------------------------------ 3. dia */}
      {dia && (
        <DialogoDia
          key={dia}
          dia={dia}
          horario={horarioDe(dia, horarios)}
          barberos={elegidos.map((b) => ({ barbero: b, tramos: tramosDe(dia, b.id_profesional) }))}
          onCerrar={() => ir({ dia: null })}
        />
      )}
    </div>
  );
}

function ChipBarbero({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={cn(
        'text-cuerpo-sm inline-flex h-9 cursor-pointer items-center rounded-full border px-4 font-medium transition-colors',
        activo
          ? 'border-marca bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]'
          : 'border-borde-control text-secundario hover:text-principal hover:border-marca',
      )}
    >
      {children}
    </button>
  );
}

/**
 * El pop-up de un dia: por cada barbero, una barra con el dia entero y la
 * lista de sus tramos. El mismo `<dialog>` nativo que el de «Mis turnos».
 */
function DialogoDia({
  dia,
  horario,
  barberos,
  onCerrar,
}: {
  dia: string;
  horario: VistaPublicoHorario | null;
  barberos: Array<{ barbero: VistaPublicoBarbero; tramos: Tramo[] | null }>;
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const apertura = horario ? minutoDeHora(horario.hora_apertura) : 0;
  const cierre = horario ? minutoDeHora(horario.hora_cierre) : 0;
  const largo = Math.max(1, cierre - apertura);

  return (
    <dialog
      ref={ref}
      aria-labelledby={idTitulo}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
      className={cn(
        'bg-superficie text-principal border-borde-sutil m-auto w-[calc(100%-2rem)] max-w-lg rounded-lg border p-0',
        'shadow-3 backdrop:bg-black/60',
      )}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="border-borde-sutil flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-titulo-3 text-principal font-semibold">
              {mayusculaInicial(fechaLarga(`${dia}T12:00:00`))}
            </h2>
            <p className="text-cuerpo-sm text-terciario">
              {horario
                ? `Se atiende de ${textoMinuto(apertura)} a ${textoMinuto(cierre)}`
                : 'Ese día no se atiende'}
            </p>
          </div>
          <BotonIcono icono="x" etiqueta="Cerrar" variante="terciario" onClick={() => ref.current?.close()} />
        </div>

        <ul className="flex flex-col gap-5 overflow-y-auto p-4 sm:p-5">
          {barberos.map(({ barbero, tramos }) => (
            <li key={barbero.id_profesional}>
              <h3 className="text-cuerpo text-principal font-semibold">{barbero.nombre}</h3>

              {!tramos || tramos.length === 0 ? (
                <p className="text-cuerpo-sm text-terciario mt-1">No quedan horarios ese día.</p>
              ) : (
                <>
                  {/* La barra: el dia entero, de la apertura al cierre. Lo que
                      ya paso hoy queda sin pintar. Es un resumen visual; la
                      lista de abajo dice lo mismo en texto. */}
                  <div aria-hidden="true" className="bg-fondo relative mt-2 h-3 overflow-hidden rounded-full">
                    {tramos.map((t) => (
                      <span
                        key={t.desde}
                        className={cn(
                          'absolute inset-y-0',
                          t.libre ? 'bg-exito' : t.recreo ? 'bg-elevado' : 'bg-[var(--borde-control)]',
                        )}
                        style={{
                          left: `${((t.desde - apertura) / largo) * 100}%`,
                          width: `${((t.hasta - t.desde) / largo) * 100}%`,
                        }}
                      />
                    ))}
                  </div>

                  <ul className="mt-2 flex flex-col gap-1">
                    {tramos.map((t) => {
                      const texto = `${textoMinuto(t.desde)} a ${textoMinuto(t.hasta)}`;
                      // Las horas reservables van de hora en hora desde la
                      // apertura: un tramo libre desde las 10:25 se reserva
                      // desde las 11:00, o el formulario no la encontraria.
                      // Un tramo libre siempre tiene una (`tramosDelBarbero`).
                      const reservable = primerInicioReservable(t, apertura) ?? t.desde;
                      return (
                        <li key={t.desde}>
                          {t.libre ? (
                            <Link
                              href={`/mi-cuenta/reservar?fecha=${dia}&barbero=${barbero.id_profesional}&hora=${textoMinuto(reservable)}`}
                              className="hover:bg-elevado flex items-center justify-between gap-3 rounded-md px-2 py-1.5"
                            >
                              <span className="flex items-center gap-2">
                                <PuntoEstado tono="exito" etiqueta="Libre" sinEtiqueta />
                                <span className="text-cuerpo-sm text-principal tabular-nums">{texto}</span>
                                <span className="text-cuerpo-sm text-exito">Libre</span>
                              </span>
                              <span className="text-cuerpo-sm text-marca font-medium">Reservar</span>
                            </Link>
                          ) : (
                            <span className="flex items-center gap-2 px-2 py-1.5">
                              <PuntoEstado
                                tono="neutro"
                                etiqueta={t.recreo ? 'Almuerzo' : 'Ocupado'}
                                sinEtiqueta
                              />
                              <span className="text-cuerpo-sm text-terciario tabular-nums">{texto}</span>
                              <span className="text-cuerpo-sm text-terciario">
                                {t.recreo ? 'Almuerzo, no se atiende' : 'Ocupado'}
                              </span>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </dialog>
  );
}
