/**
 * Seccion 5.4 del Sistema de Diseno: numeros, moneda, fechas y duraciones.
 *
 * Todo formateo del sistema pasa por aqui. Motivo: la zona horaria se fija en
 * America/Asuncion y NO se toma del navegador. Las columnas de la base son
 * `timestamptz` para que un turno agendado no se desplace, y esa garantia se
 * pierde si cada pantalla formatea con la zona del equipo del usuario.
 *
 * Los objetos Intl se crean una sola vez a nivel de modulo: construirlos es
 * caro y una tabla de 25 filas los invocaria cientos de veces.
 */

export const ZONA_HORARIA = 'America/Asuncion';
const LOCALE = 'es-PY';

// ---------------------------------------------------------------------------
// Moneda
// ---------------------------------------------------------------------------

const fmtGuaranies = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'PYG',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const fmtGuaraniesSinSimbolo = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** `150000` -> `"Gs. 150.000"`. Guarani sin decimales. */
export function guaranies(monto: number | null | undefined): string {
  if (monto == null || Number.isNaN(monto)) return '—';
  return fmtGuaranies.format(monto);
}

/**
 * `150000` -> `"150.000"`. Para columnas de tabla, donde el simbolo va en
 * el encabezado y repetirlo en cada fila solo agrega ruido.
 */
export function guaraniesSinSimbolo(monto: number | null | undefined): string {
  if (monto == null || Number.isNaN(monto)) return '—';
  return fmtGuaraniesSinSimbolo.format(monto);
}

// ---------------------------------------------------------------------------
// Numeros
// ---------------------------------------------------------------------------

const fmtDecimal = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Cantidades de stock: `numeric(12,2)` en la base. `12.5` -> `"12,50"`. */
export function cantidad(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor)) return '—';
  return fmtDecimal.format(valor);
}

/** `35.5` -> `"35,50 %"`. Espacio antes del signo, como corresponde. */
export function porcentaje(valor: number | null | undefined): string {
  if (valor == null || Number.isNaN(valor)) return '—';
  return `${fmtDecimal.format(valor)} %`;
}

/** `142` -> `"#0142"`. Relleno a cuatro cifras. */
export function identificador(id: number | null | undefined): string {
  if (id == null) return '—';
  return `#${String(id).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// Fechas y horas
// ---------------------------------------------------------------------------

const fmtFechaCorta = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: ZONA_HORARIA,
});

const fmtFechaLarga = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: ZONA_HORARIA,
});

const fmtHora = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: ZONA_HORARIA,
});

const fmtDiaSemana = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  timeZone: ZONA_HORARIA,
});

function aFecha(valor: string | Date | null | undefined): Date | null {
  if (valor == null) return null;
  const d = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `"2026-08-16T14:30:00Z"` -> `"16/08/2026"`. */
export function fechaCorta(valor: string | Date | null | undefined): string {
  const d = aFecha(valor);
  return d ? fmtFechaCorta.format(d) : '—';
}

/** `"2026-08-16"` -> `"16 de agosto de 2026"`. */
export function fechaLarga(valor: string | Date | null | undefined): string {
  const d = aFecha(valor);
  return d ? fmtFechaLarga.format(d) : '—';
}

/** `"2026-08-16T14:30:00Z"` -> `"14:30"` en hora de Asuncion. */
export function hora(valor: string | Date | null | undefined): string {
  const d = aFecha(valor);
  return d ? fmtHora.format(d) : '—';
}

/** `"16/08/2026 14:30"`. */
export function fechaHora(valor: string | Date | null | undefined): string {
  const d = aFecha(valor);
  return d ? `${fmtFechaCorta.format(d)} ${fmtHora.format(d)}` : '—';
}

/** `"domingo"`, `"lunes"`... Util para `horarios_atencion.dia_semana`. */
export function diaSemana(indice: number): string {
  // 2026-08-16 fue domingo; sirve de ancla para mapear 0..6 a un nombre.
  const domingo = new Date(Date.UTC(2026, 7, 16, 12, 0, 0));
  const d = new Date(domingo);
  d.setUTCDate(domingo.getUTCDate() + indice);
  return fmtDiaSemana.format(d);
}

// ---------------------------------------------------------------------------
// Duraciones
// ---------------------------------------------------------------------------

/** `45` -> `"45 min"`. `90` -> `"1 h 30 min"`. `120` -> `"2 h"`. */
export function duracion(minutos: number | null | undefined): string {
  if (minutos == null || Number.isNaN(minutos)) return '—';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${String(resto).padStart(2, '0')} min`;
}

// ---------------------------------------------------------------------------
// Texto
// ---------------------------------------------------------------------------

/**
 * `"5 cobros"`, `"1 cobro"`, `"1 orden"`, `"3 órdenes"`.
 *
 * Existe porque la concordancia se rompe sola: escribir
 * `${n} órdenes en curso` produce «1 órdenes en curso» el día que quede una
 * sola, y ese descuido aparece en pantalla justo cuando alguien lo está
 * mirando.
 */
export function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/** `"Angel Rolon Martinez"` -> `"AR"`. Marcador de posicion de un avatar. */
export function iniciales(nombre: string | null | undefined): string {
  if (!nombre) return '?';
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const primera = partes[0]?.[0] ?? '';
  const segunda = partes.length > 1 ? (partes[1]?.[0] ?? '') : '';
  return (primera + segunda).toUpperCase() || '?';
}

/** `"0981123456"` -> `"0981 123 456"`. Formato paraguayo de celular. */
export function telefono(valor: string | null | undefined): string {
  if (!valor) return '—';
  const soloDigitos = valor.replace(/\D/g, '');
  if (soloDigitos.length === 10 && soloDigitos.startsWith('0')) {
    return `${soloDigitos.slice(0, 4)} ${soloDigitos.slice(4, 7)} ${soloDigitos.slice(7)}`;
  }
  return valor;
}
