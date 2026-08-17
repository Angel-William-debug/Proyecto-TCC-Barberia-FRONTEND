/**
 * Datos ficticios de los módulos de operación: cobros, comisiones, compras,
 * movimientos de inventario, auditoría y horarios.
 *
 * Separado de `datos.ts` para que ese archivo no crezca sin control. Ambos se
 * borran juntos el día que sobre el modo demostración.
 *
 * Las fechas son relativas al momento de la consulta, no fijas: un listado
 * congelado en agosto de 2026 se vería viejo al mes siguiente.
 */

import type {
  AuditoriaDeLista,
  CobroDeLista,
  ComisionDeLista,
  HorarioAtencion,
  MovimientoDeLista,
  PedidoDeLista,
  Proveedor,
} from '@barber-shop/tipos';

/** Hace `dias` días, a la hora indicada. Devuelve ISO. */
function haceDias(dias: number, hora = 12, minuto = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// Cobros (CU-008)
// ---------------------------------------------------------------------------

export const COBROS_DEMO: CobroDeLista[] = [
  {
    id_cobro: 1,
    id_cita: 1,
    nombre_cliente: 'Juan Carlos González',
    metodo_pago: 'Efectivo',
    monto: 50000,
    estado: 'pagado',
    fecha_pago: haceDias(0, 9, 5),
  },
  {
    id_cobro: 2,
    id_cita: 2,
    nombre_cliente: 'Pedro Benítez Cáceres',
    metodo_pago: 'Transferencia',
    monto: 85000,
    estado: 'pagado',
    fecha_pago: haceDias(0, 10, 12),
  },
  {
    id_cobro: 3,
    id_cita: 3,
    nombre_cliente: 'Luis Alberto Cabrera',
    metodo_pago: 'Tarjeta de débito',
    monto: 40000,
    estado: 'parcial',
    fecha_pago: haceDias(0, 10, 20),
  },
  {
    id_cobro: 4,
    id_cita: 11,
    nombre_cliente: 'Carlos Vera Duarte',
    metodo_pago: 'Billetera electrónica',
    monto: 60000,
    estado: 'pagado',
    fecha_pago: haceDias(1, 16, 40),
  },
  {
    id_cobro: 5,
    id_cita: 12,
    nombre_cliente: 'Marco Antonio Duarte',
    metodo_pago: 'Efectivo',
    monto: 95000,
    estado: 'pagado',
    fecha_pago: haceDias(1, 18, 10),
  },
  {
    id_cobro: 6,
    id_cita: 13,
    nombre_cliente: 'Hugo Ramírez Sosa',
    metodo_pago: 'Efectivo',
    monto: 45000,
    estado: 'pendiente',
    fecha_pago: null,
  },
  {
    id_cobro: 7,
    id_cita: 14,
    nombre_cliente: 'Sergio Villalba',
    metodo_pago: 'Tarjeta de crédito',
    monto: 85000,
    estado: 'anulado',
    fecha_pago: haceDias(2, 11, 0),
  },
  {
    id_cobro: 8,
    id_cita: 15,
    nombre_cliente: 'Óscar Fernández',
    metodo_pago: 'Transferencia',
    monto: 55000,
    estado: 'pagado',
    fecha_pago: haceDias(2, 15, 25),
  },
];

// ---------------------------------------------------------------------------
// Comisiones (CU-009)
// ---------------------------------------------------------------------------

export const COMISIONES_DETALLE_DEMO: ComisionDeLista[] = [
  {
    id_pago_prof: 1,
    nombre_profesional: 'Marcos Ayala',
    nombre_servicio: 'Corte clásico',
    fecha_realizacion: haceDias(0),
    costo_cobrado: 50000,
    porcentaje: 40,
    monto: 20000,
    estado: 'pendiente',
  },
  {
    id_pago_prof: 2,
    nombre_profesional: 'Marcos Ayala',
    nombre_servicio: 'Corte y barba',
    fecha_realizacion: haceDias(0),
    costo_cobrado: 85000,
    porcentaje: 40,
    monto: 34000,
    estado: 'pendiente',
  },
  {
    id_pago_prof: 3,
    nombre_profesional: 'Diego Rojas',
    nombre_servicio: 'Corte degradado',
    fecha_realizacion: haceDias(0),
    costo_cobrado: 60000,
    porcentaje: 35,
    monto: 21000,
    estado: 'pendiente',
  },
  {
    id_pago_prof: 4,
    nombre_profesional: 'Fabián Ortiz',
    nombre_servicio: 'Afeitado tradicional',
    fecha_realizacion: haceDias(1),
    costo_cobrado: 55000,
    porcentaje: 35,
    monto: 19250,
    estado: 'pendiente',
  },
  {
    id_pago_prof: 5,
    nombre_profesional: 'Marcos Ayala',
    nombre_servicio: 'Corte clásico',
    fecha_realizacion: haceDias(8),
    costo_cobrado: 50000,
    porcentaje: 40,
    monto: 20000,
    estado: 'liquidado',
  },
  {
    id_pago_prof: 6,
    nombre_profesional: 'Diego Rojas',
    nombre_servicio: 'Perfilado de barba',
    fecha_realizacion: haceDias(8),
    costo_cobrado: 45000,
    porcentaje: 35,
    monto: 15750,
    estado: 'liquidado',
  },
  {
    id_pago_prof: 7,
    nombre_profesional: 'Fabián Ortiz',
    nombre_servicio: 'Corte infantil',
    fecha_realizacion: haceDias(9),
    costo_cobrado: 40000,
    porcentaje: 35,
    monto: 14000,
    estado: 'anulado',
  },
];

// ---------------------------------------------------------------------------
// Compras (módulo 6)
// ---------------------------------------------------------------------------

export const PROVEEDORES_DEMO: Proveedor[] = [
  {
    id_proveedor: 1,
    nombre: 'Distribuidora Capilar S.A.',
    email: 'ventas@capilar.com.py',
    telefono: '021 445 6677',
    direccion: 'Asunción, Central',
    estado: true,
  },
  {
    id_proveedor: 2,
    nombre: 'Insumos Barber Py',
    email: 'contacto@insumosbarber.com.py',
    telefono: '0981 334 455',
    direccion: 'San Lorenzo, Central',
    estado: true,
  },
  {
    id_proveedor: 3,
    nombre: 'Importadora del Este',
    email: null,
    telefono: '0983 776 554',
    direccion: 'Ciudad del Este, Alto Paraná',
    estado: true,
  },
];

export const PEDIDOS_DEMO: PedidoDeLista[] = [
  {
    id_pedido: 1,
    nombre_proveedor: 'Distribuidora Capilar S.A.',
    fecha_pedido: haceDias(2, 9),
    fecha_recepcion: null,
    cantidad_items: 4,
    estado: 'pedido',
    total: 1240000,
  },
  {
    id_pedido: 2,
    nombre_proveedor: 'Insumos Barber Py',
    fecha_pedido: haceDias(9, 10),
    fecha_recepcion: haceDias(5, 15),
    cantidad_items: 6,
    estado: 'recibido',
    total: 2180000,
  },
  {
    id_pedido: 3,
    nombre_proveedor: 'Importadora del Este',
    fecha_pedido: haceDias(21, 11),
    fecha_recepcion: haceDias(16, 14),
    cantidad_items: 3,
    estado: 'completado',
    total: 890000,
  },
  {
    id_pedido: 4,
    nombre_proveedor: 'Distribuidora Capilar S.A.',
    fecha_pedido: haceDias(28, 9),
    fecha_recepcion: null,
    cantidad_items: 2,
    estado: 'cancelado',
    total: 460000,
  },
];

// ---------------------------------------------------------------------------
// Movimientos de inventario
// ---------------------------------------------------------------------------

export const MOVIMIENTOS_DEMO: MovimientoDeLista[] = [
  {
    id_movimiento: 1,
    nombre_producto: 'Cera modeladora mate 100 g',
    tipo: 'salida',
    cantidad: 0.3,
    motivo: 'Consumo en servicio #0142',
    fecha: haceDias(0, 9, 10),
    nombre_usuario: 'Marcos Ayala',
  },
  {
    id_movimiento: 2,
    nombre_producto: 'Aceite para barba 30 ml',
    tipo: 'salida',
    cantidad: 1,
    motivo: 'Consumo en servicio #0143 — excepción de stock (CU-007 A1)',
    fecha: haceDias(0, 10, 25),
    nombre_usuario: 'Diego Rojas',
  },
  {
    id_movimiento: 3,
    nombre_producto: 'Talco mentolado 100 g',
    tipo: 'entrada',
    cantidad: 12,
    motivo: 'Recepción de orden #0002',
    fecha: haceDias(5, 15, 30),
    nombre_usuario: 'Angel Rolón',
  },
  {
    id_movimiento: 4,
    nombre_producto: 'Hojas de afeitar (caja x100)',
    tipo: 'ajuste',
    cantidad: 2,
    motivo: 'Corrección por recuento físico',
    fecha: haceDias(6, 18, 0),
    nombre_usuario: 'Angel Rolón',
  },
  {
    id_movimiento: 5,
    nombre_producto: 'Gel fijador fuerte 250 ml',
    tipo: 'salida',
    cantidad: 0.5,
    motivo: 'Consumo en servicio #0138',
    fecha: haceDias(1, 11, 45),
    nombre_usuario: 'Fabián Ortiz',
  },
  {
    id_movimiento: 6,
    nombre_producto: 'Shampoo anticaspa 500 ml',
    tipo: 'entrada',
    cantidad: 6,
    motivo: 'Recepción de orden #0002',
    fecha: haceDias(5, 15, 32),
    nombre_usuario: 'Angel Rolón',
  },
];

// ---------------------------------------------------------------------------
// Auditoría
// ---------------------------------------------------------------------------

export const AUDITORIA_DEMO: AuditoriaDeLista[] = [
  {
    id_auditoria: 1,
    nombre_usuario: 'Angel Rolón',
    tabla_afectada: 'servicios',
    accion: 'UPDATE',
    registro_id: 5,
    detalle: 'precio_base: 80000 → 85000',
    fecha_accion: haceDias(0, 8, 15),
  },
  {
    id_auditoria: 2,
    nombre_usuario: 'Marcos Ayala',
    tabla_afectada: 'citas',
    accion: 'UPDATE',
    registro_id: 142,
    detalle: 'estado: en_proceso → completado',
    fecha_accion: haceDias(0, 9, 2),
  },
  {
    id_auditoria: 3,
    nombre_usuario: 'Marcos Ayala',
    tabla_afectada: 'cobros_cliente',
    accion: 'INSERT',
    registro_id: 1,
    detalle: 'monto: 50000, método: Efectivo',
    fecha_accion: haceDias(0, 9, 5),
  },
  {
    id_auditoria: 4,
    nombre_usuario: 'Angel Rolón',
    tabla_afectada: 'productos',
    accion: 'UPDATE',
    registro_id: 6,
    detalle: 'stock_actual: 4 → 2 (ajuste por recuento)',
    fecha_accion: haceDias(6, 18, 0),
  },
  {
    id_auditoria: 5,
    nombre_usuario: 'Angel Rolón',
    tabla_afectada: 'profesionales',
    accion: 'INSERT',
    registro_id: 3,
    detalle: 'Alta de Fabián Ortiz, comisión 35 %',
    fecha_accion: haceDias(14, 10, 30),
  },
  {
    id_auditoria: 6,
    nombre_usuario: 'Angel Rolón',
    tabla_afectada: 'clientes',
    accion: 'DELETE',
    registro_id: 21,
    detalle: 'Baja lógica: estado → false',
    fecha_accion: haceDias(18, 16, 45),
  },
];

// ---------------------------------------------------------------------------
// Horarios de atención (CU-020)
// ---------------------------------------------------------------------------

export const HORARIOS_DEMO: HorarioAtencion[] = [
  { id_horario: 1, dia_semana: 0, hora_apertura: '09:00:00', hora_cierre: '13:00:00', activo: false },
  { id_horario: 2, dia_semana: 1, hora_apertura: '08:00:00', hora_cierre: '19:00:00', activo: true },
  { id_horario: 3, dia_semana: 2, hora_apertura: '08:00:00', hora_cierre: '19:00:00', activo: true },
  { id_horario: 4, dia_semana: 3, hora_apertura: '08:00:00', hora_cierre: '19:00:00', activo: true },
  { id_horario: 5, dia_semana: 4, hora_apertura: '08:00:00', hora_cierre: '19:00:00', activo: true },
  { id_horario: 6, dia_semana: 5, hora_apertura: '08:00:00', hora_cierre: '20:00:00', activo: true },
  { id_horario: 7, dia_semana: 6, hora_apertura: '08:00:00', hora_cierre: '18:00:00', activo: true },
];
