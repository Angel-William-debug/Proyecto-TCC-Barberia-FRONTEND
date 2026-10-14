/**
 * Hora de la barbería -> instante.
 *
 * Los formularios entregan día y hora sueltos, en hora de Asunción
 * (`2026-10-16T10:00:00`). La columna `citas.fecha_hora` es `timestamptz` y
 * PostgREST corre en UTC: si se manda el texto sin zona, la base lo toma como
 * UTC y el turno queda tres horas antes. Lo mismo pasa con `new Date(...)` en
 * el servidor de Vercel, que también corre en UTC.
 *
 * Por eso se convierte acá, con la zona de la barbería, a un instante con su
 * desfase. El desfase se calcula con `Intl` en lugar de escribir `-03:00` a
 * mano, por si Paraguay vuelve a cambiar de horario.
 */

const ZONA = 'America/Asuncion';

const partes = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

/** Minutos que la zona de la barbería está corrida respecto de UTC en ese instante. */
function desfaseMin(instante: Date): number {
  const p = Object.fromEntries(partes.formatToParts(instante).map((x) => [x.type, x.value]));
  const comoUtc = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
  return Math.round((comoUtc - instante.getTime()) / 60_000);
}

/**
 * `"2026-10-16T10:00"` o `"2026-10-16T10:00:00"` en hora de Asunción ->
 * `"2026-10-16T13:00:00.000Z"`. Si el texto ya trae zona (`Z` o `±hh:mm`),
 * se respeta tal cual.
 */
export function instanteDeHoraLocal(fechaHora: string): string {
  if (/(Z|[+-]\d{2}:?\d{2})$/.test(fechaHora)) return new Date(fechaHora).toISOString();
  const [fecha, hora = '00:00'] = fechaHora.split('T') as [string, string?];
  const [a, m, d] = fecha.split('-').map(Number) as [number, number, number];
  const [h, mi, s = 0] = hora.split(':').map(Number) as [number, number, number?];
  const supuesto = Date.UTC(a, m - 1, d, h, mi, s);
  // Dos pasadas: la primera estima, la segunda corrige si el cambio de
  // horario cae justo entre la estimación y la hora pedida.
  let instante = supuesto - desfaseMin(new Date(supuesto)) * 60_000;
  instante = supuesto - desfaseMin(new Date(instante)) * 60_000;
  return new Date(instante).toISOString();
}
