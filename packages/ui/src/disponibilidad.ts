/**
 * La cuenta del calendario de disponibilidad: que tramos de un dia tiene libre
 * cada barbero, y como de lleno esta el dia (pedido de la directora,
 * 7/10/2026).
 *
 * Sin interfaz y sin mas dependencia que dos tipos, a proposito: la app movil
 * la copia tal cual (`src/lib/disponibilidad.ts` del repo APK, con el origen
 * anotado y los tipos escritos alla), igual que copia los formatos. Si cambia
 * aca, se cambia alla.
 *
 * TODO EN MINUTOS DEL DIA, EN LA ZONA DE LA BARBERIA
 *
 * El horario de atencion viene como `09:00:00` y los turnos como instantes
 * ISO. En vez de convertir el horario en instantes -que obliga a resolver la
 * diferencia horaria del dia-, se pasan los turnos a «minuto del dia local»
 * con `Intl` y se cuenta todo ahi: 09:00 es 540, 19:00 es 1140. Un turno a
 * las 23:30 no puede caer en otro dia porque el telefono este en otra zona.
 *
 * Los bloques ocupados vienen de `fn_ocupacion_barberos`, que usa la misma
 * definicion de «ocupado» que la base al validar un turno nuevo.
 */

import type { BloqueOcupado, VistaPublicoHorario as HorarioDia } from '@barber-shop/tipos';

const ZONA = 'America/Asuncion';

/** Un tramo del dia de un barbero, en minutos desde la medianoche local. */
export interface Tramo {
  desde: number;
  hasta: number;
  libre: boolean;
  /** El recreo de almuerzo: ni libre ni ocupado por un turno. */
  recreo?: boolean;
}

/**
 * El recreo de almuerzo, fijo de 12:00 a 14:00: ningun turno empieza ahi.
 * Es el mismo que tiene adentro `fn_turnos_disponibles` (migracion
 * 20261007150000 del DBA), que a pedido expreso no es editable desde el
 * panel. Si cambia alla, se cambia aca.
 */
export const RECREO = { desde: 12 * 60, hasta: 14 * 60 } as const;

/** Como de lleno esta un dia, para pintar la celda del mes. */
export type NivelDia = 'libre' | 'pocos' | 'completo' | 'cerrado' | 'pasado';

/** Un tramo libre mas corto que esto no entra ni el servicio mas breve. */
export const TRAMO_MINIMO_MIN = 15;

/**
 * Cada cuanto empieza un turno reservable: cada hora en punto desde la
 * apertura. Tiene que ser el mismo `p_paso_min` que `turnosDisponibles`
 * le pide a la base (`PASO_MINUTOS_RESERVA` en `apps/api`, 7/10/2026): si
 * difirieran, el calendario ofreceria una hora que el formulario no tiene.
 */
export const PASO_RESERVA_MIN = 60;

/**
 * La primera hora reservable dentro de un tramo, o `null` si no entra
 * ninguna: un tramo libre de 10:25 a 11:00 no tiene una hora en punto donde
 * empezar, porque la de las 11:00 ya es el final.
 */
export function primerInicioReservable(tramo: Tramo, apertura: number): number | null {
  const inicio = apertura + Math.ceil((tramo.desde - apertura) / PASO_RESERVA_MIN) * PASO_RESERVA_MIN;
  return inicio + TRAMO_MINIMO_MIN <= tramo.hasta ? inicio : null;
}

const formatoDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA });
const formatoHora = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** aaaa-MM-dd de un instante, en la zona de la barberia. */
export function diaDeInstante(valor: string | Date): string {
  return formatoDia.format(typeof valor === 'string' ? new Date(valor) : valor);
}

/** Minuto del dia local (0-1439) de un instante. */
export function minutoDeInstante(valor: string | Date): number {
  const [h, m] = formatoHora
    .format(typeof valor === 'string' ? new Date(valor) : valor)
    .split(':')
    .map(Number) as [number, number];
  return h * 60 + m;
}

/** `09:00:00` -> 540. */
export function minutoDeHora(horaLocal: string): number {
  const [h, m] = horaLocal.split(':').map(Number) as [number, number];
  return h * 60 + m;
}

/** 540 -> `09:00`. */
export function textoMinuto(minuto: number): string {
  return `${String(Math.floor(minuto / 60)).padStart(2, '0')}:${String(minuto % 60).padStart(2, '0')}`;
}

/** Dia de la semana (0 = domingo) de un aaaa-MM-dd. */
export function indiceDiaSemana(fecha: string): number {
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/** El horario de ese dia, o `null` si la barberia no atiende. */
export function horarioDe(fecha: string, horarios: HorarioDia[]): HorarioDia | null {
  const h = horarios.find((x) => x.dia_semana === indiceDiaSemana(fecha));
  return h && h.activo ? h : null;
}

/**
 * Los tramos de un dia para UN barbero: libres y ocupados, uno detras del
 * otro, desde la apertura hasta el cierre.
 *
 * Devuelve `null` si ese dia no se atiende. Hoy empieza en el proximo cuarto
 * de hora: lo que ya paso no es «libre», es imposible. Un dia pasado devuelve
 * una lista vacia.
 */
export function tramosDelBarbero(
  fecha: string,
  horario: HorarioDia | null,
  bloques: BloqueOcupado[],
  ahora: Date = new Date(),
): Tramo[] | null {
  if (!horario) return null;

  const apertura = minutoDeHora(horario.hora_apertura);
  const cierre = minutoDeHora(horario.hora_cierre);
  const hoy = diaDeInstante(ahora);

  if (fecha < hoy) return [];
  const desde =
    fecha === hoy
      ? Math.max(apertura, Math.ceil(minutoDeInstante(ahora) / TRAMO_MINIMO_MIN) * TRAMO_MINIMO_MIN)
      : apertura;
  if (desde >= cierre) return [];

  // Los ocupados del dia, recortados al horario y fusionados si se tocan.
  const ocupados = bloques
    .filter((b) => b.fecha === fecha)
    .map((b) => ({
      desde: Math.max(desde, minutoDeInstante(b.inicio)),
      // Un turno que termina pasada la medianoche cuenta hasta el cierre.
      hasta: Math.min(cierre, diaDeInstante(b.fin) > fecha ? cierre : minutoDeInstante(b.fin)),
    }))
    .filter((b) => b.hasta > b.desde)
    .sort((a, b) => a.desde - b.desde)
    .reduce<Array<{ desde: number; hasta: number }>>((acc, b) => {
      const ultimo = acc[acc.length - 1];
      if (ultimo && b.desde <= ultimo.hasta) ultimo.hasta = Math.max(ultimo.hasta, b.hasta);
      else acc.push({ ...b });
      return acc;
    }, []);

  const tramos: Tramo[] = [];
  let cursor = desde;
  for (const o of ocupados) {
    if (o.desde > cursor) tramos.push({ desde: cursor, hasta: o.desde, libre: true });
    tramos.push({ desde: o.desde, hasta: o.hasta, libre: false });
    cursor = o.hasta;
  }
  if (cursor < cierre) tramos.push({ desde: cursor, hasta: cierre, libre: true });

  // El recreo parte en dos lo que estaba libre a esa hora. Un turno que ya
  // estaba agendado cruzando el recreo sigue siendo un turno: no se toca.
  const conRecreo = tramos.flatMap<Tramo>((t) => {
    if (!t.libre || t.hasta <= RECREO.desde || t.desde >= RECREO.hasta) return [t];
    const partes: Tramo[] = [];
    if (t.desde < RECREO.desde) partes.push({ desde: t.desde, hasta: RECREO.desde, libre: true });
    partes.push({
      desde: Math.max(t.desde, RECREO.desde),
      hasta: Math.min(t.hasta, RECREO.hasta),
      libre: false,
      recreo: true,
    });
    if (t.hasta > RECREO.hasta) partes.push({ desde: RECREO.hasta, hasta: t.hasta, libre: true });
    return partes;
  });

  // Un hueco libre donde no empieza ninguna hora reservable -diez minutos
  // entre dos turnos, o de 10:25 a 11:00- no se puede reservar: mostrarlo
  // como libre seria prometer algo que el formulario despues no ofrece.
  return conRecreo.map((t) =>
    t.libre && primerInicioReservable(t, apertura) == null ? { ...t, libre: false } : t,
  );
}

/** Minutos libres de una lista de tramos. */
export function minutosLibres(tramos: Tramo[]): number {
  return tramos.reduce((n, t) => n + (t.libre ? t.hasta - t.desde : 0), 0);
}

/**
 * Como de lleno esta un dia para los barberos elegidos.
 *
 * `pocos` es cuando queda libre menos de un tercio del tiempo de atencion
 * (sumado entre todos los barberos elegidos): todavia se puede, pero conviene
 * apurarse o mirar otro dia.
 */
export function nivelDelDia(
  fecha: string,
  horario: HorarioDia | null,
  tramosPorBarbero: Array<Tramo[] | null>,
  ahora: Date = new Date(),
): NivelDia {
  if (fecha < diaDeInstante(ahora)) return 'pasado';
  if (!horario) return 'cerrado';

  // El recreo no es tiempo de atencion: no cuenta ni como libre ni en el total.
  const total = tramosPorBarbero.reduce(
    (n, t) => n + (t ?? []).reduce((m, x) => m + (x.recreo ? 0 : x.hasta - x.desde), 0),
    0,
  );
  if (total === 0) return 'pasado';

  const libres = tramosPorBarbero.reduce((n, t) => n + minutosLibres(t ?? []), 0);
  if (libres === 0) return 'completo';
  return libres / total < 1 / 3 ? 'pocos' : 'libre';
}

/** Lo que dice cada nivel, en el calendario y en su leyenda. */
export const PRESENTACION_NIVEL: Record<NivelDia, { etiqueta: string; tono: 'exito' | 'advertencia' | 'peligro' | 'neutro' }> = {
  libre: { etiqueta: 'Libre', tono: 'exito' },
  pocos: { etiqueta: 'Pocos lugares', tono: 'advertencia' },
  completo: { etiqueta: 'Completo', tono: 'peligro' },
  cerrado: { etiqueta: 'Cerrado', tono: 'neutro' },
  pasado: { etiqueta: 'Pasado', tono: 'neutro' },
};
