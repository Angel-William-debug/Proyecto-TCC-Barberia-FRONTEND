/**
 * Ranking de barberos.
 *
 * POR VOLUMEN Y FACTURACION, NO POR VALORACION
 *
 * La Direccion lo pidio "segun las valoraciones o volumen de atencion". Se
 * implementa la segunda mitad, y no por comodidad: **no existe una tabla de
 * valoraciones**. Ninguna pantalla del sistema le pide al cliente que puntue
 * su atencion, asi que no hay un solo dato de satisfaccion en la base.
 * Inventar un puntaje a partir de la facturacion seria presentar como opinion
 * del cliente algo que el cliente nunca dijo.
 *
 * Si mas adelante se quiere el ranking por valoracion hace falta una tabla
 * nueva -`valoraciones`, atada a `historial_servicio`- y una pantalla en el
 * portal del cliente para cargarla. Queda anotado, no hecho.
 *
 * No agrega vistas SQL: cruza tres de las que ya existian sin usarse
 * (`v_profesionales_resumen`, `v_ticket_promedio_barbero`,
 * `v_ocupacion_por_barbero`), que era justamente el pendiente 7 del proyecto.
 */

import type {
  VistaOcupacionBarbero,
  VistaProfesionalResumen,
  VistaTicketPromedioBarbero,
} from '@barber-shop/tipos';

import { PROFESIONALES_DEMO } from '../demo/datos-catalogo';
import { MODO_DEMO } from '../demo/modo';
import { traducirError } from '../errores';
import { clienteServidor } from '../supabase/cliente-servidor';

/** Los criterios por los que se puede ordenar el ranking. */
export const CRITERIOS_RANKING = [
  'servicios',
  'facturado',
  'ticket',
  'clientes',
  'ocupacion',
] as const;
export type CriterioRanking = (typeof CRITERIOS_RANKING)[number];

export const TITULOS_CRITERIO: Record<CriterioRanking, string> = {
  servicios: 'Servicios realizados',
  facturado: 'Facturación generada',
  ticket: 'Ticket promedio',
  clientes: 'Clientes distintos',
  ocupacion: 'Horas ocupadas',
};

export interface FilaRanking {
  idProfesional: number;
  nombre: string;
  especialidad: string | null;
  activo: boolean;
  serviciosRealizados: number;
  facturado: number;
  /** Promedio por servicio. `0` si todavía no atendió a nadie. */
  ticketPromedio: number;
  clientesDistintos: number;
  /** Suma de `minutos_ocupados` de la agenda, en minutos. */
  minutosOcupados: number;
  ultimoServicio: string | null;
  /** Posición en el criterio elegido, empezando en 1. */
  posicion: number;
}

const VALOR: Record<CriterioRanking, (f: FilaRanking) => number> = {
  servicios: (f) => f.serviciosRealizados,
  facturado: (f) => f.facturado,
  ticket: (f) => f.ticketPromedio,
  clientes: (f) => f.clientesDistintos,
  ocupacion: (f) => f.minutosOcupados,
};

export interface FiltroRanking {
  criterio?: CriterioRanking;
  /** Rango sobre la fecha del servicio, aaaa-MM-dd. Vacío: todo el histórico. */
  desde?: string;
  hasta?: string;
  /** `false` incluye a los barberos desactivados. Por defecto solo los activos. */
  soloActivos?: boolean;
}

/**
 * Arma el ranking.
 *
 * Las tres vistas se piden en paralelo y se cruzan por `id_profesional`. La
 * de ocupación viene por día -es su granularidad- y se suma acá; pedirle a la
 * base una vista nueva solo para agregar por barbero seria duplicar lo que ya
 * existe.
 *
 * EL RANGO DE FECHAS SOLO AFECTA A LA OCUPACION. `v_profesionales_resumen` y
 * `v_ticket_promedio_barbero` agregan sobre todo el historial y no exponen la
 * fecha, así que filtrarlas exigiría cambiar las vistas. Se prefiere no
 * tocarlas: la pantalla lo dice explícitamente en lugar de mostrar un filtro
 * que solo funciona a medias en silencio.
 */
export async function rankingBarberos(filtro: FiltroRanking = {}): Promise<FilaRanking[]> {
  const criterio = filtro.criterio ?? 'servicios';

  if (MODO_DEMO) {
    return ordenar(
      PROFESIONALES_DEMO.map((p, i) => ({
        idProfesional: p.id_profesional,
        nombre: p.nombre,
        especialidad: p.especialidad,
        activo: p.estado,
        serviciosRealizados: [48, 37, 29][i] ?? 12,
        facturado: [3_120_000, 2_460_000, 1_680_000][i] ?? 700_000,
        ticketPromedio: [65_000, 66_486, 57_931][i] ?? 58_000,
        clientesDistintos: [31, 26, 21][i] ?? 9,
        minutosOcupados: [2_040, 1_610, 1_205][i] ?? 500,
        ultimoServicio: null,
        posicion: 0,
      })),
      criterio,
    );
  }

  const supabase = await clienteServidor();

  let ocupacion = supabase
    .from('v_ocupacion_por_barbero')
    .select('id_profesional, minutos_ocupados, dia');

  if (filtro.desde) ocupacion = ocupacion.gte('dia', filtro.desde);
  if (filtro.hasta) ocupacion = ocupacion.lte('dia', filtro.hasta);

  const [resumen, tickets, ocupaciones] = await Promise.all([
    supabase.from('v_profesionales_resumen').select('*'),
    supabase.from('v_ticket_promedio_barbero').select('*'),
    ocupacion,
  ]);

  if (resumen.error) throw traducirError(resumen.error);
  if (tickets.error) throw traducirError(tickets.error);
  if (ocupaciones.error) throw traducirError(ocupaciones.error);

  const porTicket = new Map(
    ((tickets.data ?? []) as VistaTicketPromedioBarbero[]).map((t) => [
      t.id_profesional,
      t.ticket_promedio,
    ]),
  );

  const minutos = new Map<number, number>();
  for (const o of (ocupaciones.data ?? []) as VistaOcupacionBarbero[]) {
    minutos.set(o.id_profesional, (minutos.get(o.id_profesional) ?? 0) + o.minutos_ocupados);
  }

  const filas = ((resumen.data ?? []) as VistaProfesionalResumen[])
    .filter((p) => filtro.soloActivos === false || p.estado)
    .map<FilaRanking>((p) => ({
      idProfesional: p.id_profesional,
      nombre: p.nombre,
      especialidad: p.especialidad,
      activo: p.estado,
      serviciosRealizados: p.servicios_realizados,
      facturado: p.facturado,
      // `v_ticket_promedio_barbero` hace un JOIN y no un LEFT JOIN, así que
      // el barbero que todavía no atendió a nadie no figura en ella. Es 0, no
      // un dato faltante.
      ticketPromedio: porTicket.get(p.id_profesional) ?? 0,
      clientesDistintos: p.clientes_distintos,
      minutosOcupados: minutos.get(p.id_profesional) ?? 0,
      ultimoServicio: p.ultimo_servicio,
      posicion: 0,
    }));

  return ordenar(filas, criterio);
}

/**
 * Ordena y numera.
 *
 * Los empates comparten posición -dos barberos con 12 servicios son ambos
 * terceros- porque desempatar por orden alfabético inventaría una diferencia
 * que los datos no tienen.
 */
function ordenar(filas: FilaRanking[], criterio: CriterioRanking): FilaRanking[] {
  const valor = VALOR[criterio];
  const ordenadas = [...filas].sort((a, b) => valor(b) - valor(a));

  let posicion = 0;
  let anterior: number | null = null;

  return ordenadas.map((f, i) => {
    const v = valor(f);
    if (v !== anterior) {
      posicion = i + 1;
      anterior = v;
    }
    return { ...f, posicion };
  });
}
