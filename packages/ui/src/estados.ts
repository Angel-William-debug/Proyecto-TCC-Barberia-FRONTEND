/**
 * Seccion 10 del Sistema de Diseno: el puente entre la base de datos y la
 * interfaz.
 *
 * Cada valor que la base guarda en una columna de estado tiene aqui, y solo
 * aqui, su etiqueta visible, su tono y su icono. Si esta traduccion se
 * repartiera por las vistas, la misma cita terminaria en verde en la agenda y
 * en azul en el reporte.
 *
 * REGLA: el chip nunca muestra el valor crudo. La base guarda `no_asistio`;
 * el usuario lee «No asistio».
 */

import type {
  EstadoCita,
  EstadoCobro,
  EstadoComision,
  EstadoPedido,
  NivelStock,
  NombreRol,
} from '@barber-shop/tipos';

/**
 * Los seis tonos disponibles. Se corresponden con los colores semanticos de
 * la seccion 4.5 mas el neutro y el de marca.
 */
export type Tono = 'neutro' | 'exito' | 'advertencia' | 'peligro' | 'info' | 'marca';

export interface Presentacion {
  /** Lo que lee el usuario. */
  etiqueta: string;
  tono: Tono;
  /** Nombre del icono de Lucide. Ver seccion 7.4. */
  icono: string;
  /** Texto de apoyo para una sugerencia emergente, cuando aporta algo. */
  ayuda?: string;
}

// ---------------------------------------------------------------------------
// 10.1 Cita
// ---------------------------------------------------------------------------

export const PRESENTACION_CITA: Record<EstadoCita, Presentacion> = {
  pendiente: {
    etiqueta: 'Pendiente',
    tono: 'neutro',
    icono: 'clock',
    ayuda: 'Agendada, a la espera de confirmación del cliente',
  },
  confirmado: {
    etiqueta: 'Confirmado',
    tono: 'info',
    icono: 'check-check',
    ayuda: 'El cliente confirmó su asistencia',
  },
  en_proceso: {
    etiqueta: 'En proceso',
    tono: 'advertencia',
    icono: 'scissors',
    ayuda: 'El servicio se está prestando en este momento',
  },
  completado: {
    etiqueta: 'Completado',
    tono: 'exito',
    icono: 'circle-check',
    ayuda: 'Servicio terminado. Habilita el registro del cobro',
  },
  cancelado: {
    etiqueta: 'Cancelado',
    tono: 'peligro',
    icono: 'circle-x',
    ayuda: 'Estado final. La cita ya no puede modificarse (RN-018)',
  },
  no_asistio: {
    etiqueta: 'No asistió',
    tono: 'peligro',
    icono: 'user-x',
    ayuda: 'El cliente no se presentó a su turno',
  },
};

// ---------------------------------------------------------------------------
// 10.2 Cobro
// ---------------------------------------------------------------------------

export const PRESENTACION_COBRO: Record<EstadoCobro, Presentacion> = {
  pendiente: { etiqueta: 'Pendiente', tono: 'neutro', icono: 'clock' },
  parcial: {
    etiqueta: 'Pago parcial',
    tono: 'advertencia',
    icono: 'circle-dashed',
    ayuda: 'El monto cobrado no cubre el total de la cita (RN-025)',
  },
  pagado: { etiqueta: 'Pagado', tono: 'exito', icono: 'circle-check' },
  anulado: { etiqueta: 'Anulado', tono: 'peligro', icono: 'ban' },
};

// ---------------------------------------------------------------------------
// 10.3 Comision
// ---------------------------------------------------------------------------

export const PRESENTACION_COMISION: Record<EstadoComision, Presentacion> = {
  pendiente: { etiqueta: 'Pendiente de liquidar', tono: 'advertencia', icono: 'clock' },
  liquidado: {
    etiqueta: 'Liquidado',
    tono: 'exito',
    icono: 'circle-check',
    ayuda: 'Un pago liquidado no puede modificarse ni revertirse (RN-027)',
  },
  anulado: { etiqueta: 'Anulado', tono: 'peligro', icono: 'ban' },
};

// ---------------------------------------------------------------------------
// 10.4 Pedido de compra
// ---------------------------------------------------------------------------

export const PRESENTACION_PEDIDO: Record<EstadoPedido, Presentacion> = {
  pedido: { etiqueta: 'Pedido', tono: 'neutro', icono: 'clipboard-list' },
  recibido: {
    etiqueta: 'Recibido',
    tono: 'info',
    icono: 'package-check',
    ayuda: 'La mercadería ingresó. Habilita el pago al proveedor (RN-028)',
  },
  completado: { etiqueta: 'Completado', tono: 'exito', icono: 'circle-check' },
  cancelado: { etiqueta: 'Cancelado', tono: 'peligro', icono: 'circle-x' },
};

// ---------------------------------------------------------------------------
// 10.5 Nivel de stock
// ---------------------------------------------------------------------------

export const PRESENTACION_STOCK: Record<NivelStock, Presentacion> = {
  sin_stock: { etiqueta: 'Sin stock', tono: 'peligro', icono: 'package-x' },
  critico: { etiqueta: 'Stock crítico', tono: 'peligro', icono: 'triangle-alert' },
  bajo: { etiqueta: 'Stock bajo', tono: 'advertencia', icono: 'trending-down' },
  disponible: { etiqueta: 'Disponible', tono: 'exito', icono: 'package-check' },
  sobrestock: { etiqueta: 'Sobrestock', tono: 'info', icono: 'trending-up' },
};

/**
 * `nivelStock` vive en `@barber-shop/tipos` porque la capa de datos tambien
 * la necesita. Se reexporta aqui para que las vistas la encuentren junto al
 * resto de la presentacion de estados.
 */
export { nivelStock } from '@barber-shop/tipos';

// ---------------------------------------------------------------------------
// 10.6 Roles
// ---------------------------------------------------------------------------

export const PRESENTACION_ROL: Record<NombreRol, Presentacion> = {
  administrador: { etiqueta: 'Administrador', tono: 'marca', icono: 'shield-check' },
  recepcionista: { etiqueta: 'Recepcionista', tono: 'info', icono: 'user-round' },
  profesional: { etiqueta: 'Barbero', tono: 'exito', icono: 'scissors' },
  cliente: {
    etiqueta: 'Cliente',
    tono: 'neutro',
    icono: 'user-round',
    ayuda: 'Rol reservado. Hoy sin acceso a la interfaz',
  },
};

// ---------------------------------------------------------------------------
// Clases por tono
// ---------------------------------------------------------------------------

/**
 * Clases de Tailwind para cada tono de chip. Se escriben completas y no
 * concatenadas: el compilador de Tailwind analiza el codigo como texto y no
 * detectaria una clase armada con plantillas.
 */
export const CLASES_CHIP: Record<Tono, string> = {
  neutro: 'bg-[var(--chip-neutro-fondo)] text-[var(--chip-neutro-texto)]',
  exito: 'bg-[var(--chip-exito-fondo)] text-exito',
  advertencia: 'bg-[var(--chip-advertencia-fondo)] text-advertencia',
  peligro: 'bg-[var(--chip-peligro-fondo)] text-peligro',
  info: 'bg-[var(--chip-info-fondo)] text-info',
  marca: 'bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]',
};

/** Solo el color del texto, para iconos y cifras destacadas. */
export const CLASES_TEXTO_TONO: Record<Tono, string> = {
  neutro: 'text-secundario',
  exito: 'text-exito',
  advertencia: 'text-advertencia',
  peligro: 'text-peligro',
  info: 'text-info',
  marca: 'text-marca',
};
