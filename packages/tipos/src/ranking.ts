/**
 * Piezas puras del ranking de barberos: constantes, etiquetas y el mapeo
 * criterio -> campo. Viven acá (no en `@barber-shop/api`, junto a
 * `rankingBarberos()`) porque un componente cliente las necesita -el gráfico
 * de ranking- y `@barber-shop/api` arrastra código de servidor (Supabase,
 * `next/headers`) que no puede entrar al bundle del navegador.
 */

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

/** Qué campo de `FilaRanking` corresponde a cada criterio. Única fuente de verdad: la
 * reutiliza tanto el orden del backend como el gráfico de ranking en el frontend. */
export const valorPorCriterio: Record<CriterioRanking, (f: FilaRanking) => number> = {
  servicios: (f) => f.serviciosRealizados,
  facturado: (f) => f.facturado,
  ticket: (f) => f.ticketPromedio,
  clientes: (f) => f.clientesDistintos,
  ocupacion: (f) => f.minutosOcupados,
};
