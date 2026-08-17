/**
 * Tipos de las 27 tablas y 7 vistas de la base `Barberia TCC`.
 *
 * Escritos a mano contra las migraciones de Proyecto-TCC-Barberia-DBA para que
 * el frontend no dependa de tener la CLI de Supabase instalada. Cuando se
 * quiera regenerar automaticamente:
 *
 *     pnpm --filter @barber-shop/tipos generar
 *
 * Reglas que se respetan aqui:
 *  - Los `id` son `number`: las claves primarias son `int generated always as identity`.
 *  - Las columnas `numeric` llegan como `number` a traves de PostgREST.
 *  - Las columnas `timestamptz` llegan como `string` en formato ISO 8601.
 *  - Un campo opcional en la base es `| null`, no `?`. PostgREST devuelve la
 *    clave siempre presente con valor null.
 */

// ---------------------------------------------------------------------------
// Estados: replican exactamente las restricciones CHECK de la base.
// Agregar un valor aqui sin agregarlo en una migracion produce un error en
// tiempo de ejecucion, no de compilacion. El orden es el del flujo de negocio.
// ---------------------------------------------------------------------------

/** `citas.estado` — CU-006, CU-007. Masculino por alineacion con el CU. */
export const ESTADOS_CITA = [
  'pendiente',
  'confirmado',
  'en_proceso',
  'completado',
  'cancelado',
  'no_asistio',
] as const;
export type EstadoCita = (typeof ESTADOS_CITA)[number];

/** `cobros_cliente.estado` — RN-025 habilita el valor `parcial`. */
export const ESTADOS_COBRO = ['pendiente', 'parcial', 'pagado', 'anulado'] as const;
export type EstadoCobro = (typeof ESTADOS_COBRO)[number];

/** `pagos_profesional.estado` — RN-026. El estado final es `liquidado`. */
export const ESTADOS_COMISION = ['pendiente', 'liquidado', 'anulado'] as const;
export type EstadoComision = (typeof ESTADOS_COMISION)[number];

/** `pagos_proveedor.estado` */
export const ESTADOS_PAGO_PROVEEDOR = ['pendiente', 'pagado', 'anulado'] as const;
export type EstadoPagoProveedor = (typeof ESTADOS_PAGO_PROVEEDOR)[number];

/** `pedidos.estado` — RN-036. */
export const ESTADOS_PEDIDO = ['pedido', 'recibido', 'completado', 'cancelado'] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

/** `movimientos_inventario.tipo` */
export const TIPOS_MOVIMIENTO = ['entrada', 'salida', 'ajuste'] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

/** `notificaciones.tipo` — RN-042. */
export const TIPOS_NOTIFICACION = ['confirmacion', 'recordatorio'] as const;
export type TipoNotificacion = (typeof TIPOS_NOTIFICACION)[number];

/** `notificaciones.estado_envio` */
export const ESTADOS_ENVIO = ['pendiente', 'enviado', 'fallido', 'sin_email'] as const;
export type EstadoEnvio = (typeof ESTADOS_ENVIO)[number];

/** `auditoria.accion` */
export const ACCIONES_AUDITORIA = ['INSERT', 'UPDATE', 'DELETE'] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

/** Los 4 roles de `roles.nombre`. El rol `cliente` esta reservado, hoy sin acceso. */
export const ROLES = ['administrador', 'recepcionista', 'profesional', 'cliente'] as const;
export type NombreRol = (typeof ROLES)[number];

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------

export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

/** `usuarios.password_hash` fue eliminada: la credencial vive en `auth.users` (RN-001). */
export interface Usuario {
  id_usuario: number;
  id_rol: number;
  auth_uid: string | null;
  nombre: string;
  email: string;
  fecha_creacion: string;
  estado: boolean;
}

export interface Cliente {
  id_cliente: number;
  /** Usuario que lo registro, NO el cliente como usuario del sistema. */
  id_usuario_reg: number | null;
  nombre: string;
  email: string | null;
  /** NOT NULL desde la migracion de validaciones. */
  telefono: string;
  direccion: string | null;
  fecha_nacimiento: string | null;
  /** RN-008: visible solo para recepcionistas y administradores. */
  notas_internas: string | null;
  fecha_registro: string;
  estado: boolean;
}

/** En la interfaz se muestra como «Barbero». Ver seccion 13.3 del sistema de diseno. */
export interface Profesional {
  id_profesional: number;
  id_usuario: number | null;
  nombre: string;
  especialidad: string | null;
  tipo: string | null;
  /** 0 a 100. Porcentaje de comision sobre el servicio realizado. */
  porcentaje_com: number;
  estado: boolean;
}

export interface CategoriaServicio {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface Servicio {
  id_servicio: number;
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  precio_base: number;
  estado: boolean;
}

export interface CategoriaProducto {
  id_categoria_p: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface Producto {
  id_producto: number;
  id_categoria_p: number;
  nombre: string;
  descripcion: string | null;
  /** Unidad en que se compra. Ej: frasco. */
  unidad_medida: string | null;
  /** Unidad en que se consume. Ej: ml. Sin conversion automatica todavia. */
  unidad_uso: string | null;
  cantidad_uso_estandar: number | null;
  precio_unitario: number;
  stock_minimo: number;
  stock_maximo: number | null;
  /**
   * numeric(12,2), no entero: permite descontar consumos parciales.
   * PUEDE SER NEGATIVO. El CHECK >= 0 se elimino para habilitar CU-007 A1.
   */
  stock_actual: number;
  estado: boolean;
}

/** Receta: que productos consume cada servicio y en que cantidad. */
export interface ServicioProducto {
  id_servicio_producto: number;
  id_servicio: number;
  id_producto: number;
  cantidad_estandar: number;
  unidad_uso: string | null;
  estado: boolean;
}

export interface Cita {
  id_cita: number;
  id_cliente: number;
  /** Usuario que gestiona la cita. */
  id_usuario: number | null;
  fecha_hora: string;
  estado: EstadoCita;
  observaciones: string | null;
  /** Lo calcula el trigger `trg_detalle_cita_after_insert`. No enviarlo al crear. */
  total: number;
  created_at: string;
  updated_at: string;
}

export interface DetalleCita {
  id_detalle: number;
  id_cita: number;
  id_servicio: number;
  id_profesional: number;
  duracion_min: number;
  precio_unit: number;
  subtotal: number;
}

export interface HistorialServicio {
  id_historial: number;
  id_cita: number | null;
  id_cliente: number;
  id_profesional: number;
  id_servicio: number;
  fecha_realizacion: string;
  costo_cobrado: number;
  observaciones: string | null;
  created_at: string;
}

export interface ProductoUtilizado {
  id_uso: number;
  id_historial: number;
  id_producto: number;
  cantidad_usada: number;
  /** CU-007 A1: marca el consumo autorizado pese a stock insuficiente (RN-031). */
  excepcion_stock: boolean;
  fecha_uso: string;
}

export interface MetodoPago {
  id_metodo: number;
  nombre: string;
  estado: boolean;
}

export interface CobroCliente {
  id_cobro: number;
  id_cita: number;
  id_metodo_pago: number;
  monto: number;
  estado: EstadoCobro;
  fecha_pago: string | null;
  comprobante_url: string | null;
}

export interface PagoProfesional {
  id_pago_prof: number;
  id_profesional: number;
  /** UNIQUE: una sola liquidacion por servicio realizado. */
  id_historial: number;
  monto: number;
  fecha_liquid: string | null;
  estado: EstadoComision;
}

export interface Proveedor {
  id_proveedor: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
}

export interface Pedido {
  id_pedido: number;
  id_proveedor: number;
  id_usuario: number | null;
  fecha_pedido: string;
  fecha_recepcion: string | null;
  estado: EstadoPedido;
  total: number;
}

export interface DetallePedido {
  id_detalle_pedido: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unit: number;
  subtotal: number;
}

export interface PagoProveedor {
  id_pago_prov: number;
  id_pedido: number;
  id_metodo_pago: number;
  monto: number;
  fecha_pago: string | null;
  estado: EstadoPagoProveedor;
}

export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  id_usuario: number | null;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  fecha: string;
}

export interface AlertaStock {
  id_alerta: number;
  id_producto: number;
  stock_actual: number;
  stock_minimo: number;
  fecha_alerta: string;
  resuelta: boolean;
}

export interface Notificacion {
  id_notificacion: number;
  id_cita: number | null;
  id_usuario: number | null;
  tipo: TipoNotificacion | null;
  mensaje: string | null;
  email_destino: string | null;
  estado_envio: EstadoEnvio;
  fecha_envio: string | null;
  proveedor: string | null;
  /** CU-015 A2: reintento automatico hasta 3 veces. */
  intentos: number;
}

export interface RecomendacionMl {
  id_recomendacion: number;
  id_cliente: number;
  id_servicio: number;
  /** 0 a 1. */
  score_relevancia: number;
  algoritmo: string | null;
  fecha_generacion: string;
}

export interface Auditoria {
  id_auditoria: number;
  id_usuario: number | null;
  tabla_afectada: string;
  accion: AccionAuditoria;
  registro_id: number | null;
  detalle: string | null;
  fecha_accion: string;
}

/** CU-020. Fila unica: `id_configuracion` siempre vale 1. */
export interface ConfiguracionSistema {
  id_configuracion: 1;
  nombre_barberia: string;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  logo_url: string | null;
  moneda: string;
  zona_horaria: string;
  /** RN-042: 1440 minutos = 24 horas antes. */
  minutos_antes_recordatorio: number;
  max_reintentos_notif: number;
  updated_at: string;
}

/** CU-020. `dia_semana`: 0 = domingo ... 6 = sabado. */
export interface HorarioAtencion {
  id_horario: number;
  dia_semana: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Formato HH:mm:ss. */
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

// ---------------------------------------------------------------------------
// Vistas SQL (7). Son de solo lectura y usan security_invoker.
// ---------------------------------------------------------------------------

export interface VistaCitaActiva {
  id_cita: number;
  fecha_hora: string;
  estado: EstadoCita;
  nombre_cliente: string;
  nombre_servicio: string;
  nombre_profesional: string;
  duracion_min: number;
}

export interface VistaHistorialCliente {
  id_cliente: number;
  nombre_cliente: string;
  fecha_realizacion: string;
  nombre_servicio: string;
  nombre_profesional: string;
  costo_cobrado: number;
}

export interface VistaStockCritico {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
  faltante: number;
}

export interface VistaComisionPendiente {
  id_profesional: number;
  nombre_profesional: string;
  cantidad_servicios: number;
  total_comision: number;
}

export interface VistaIngresoPorPeriodo {
  anio: number;
  mes: number;
  total_ingresos: number;
  cantidad_servicios: number;
  ticket_promedio: number;
}

export interface VistaPedidoEstado {
  id_pedido: number;
  nombre_proveedor: string;
  fecha_pedido: string;
  estado: EstadoPedido;
  total: number;
}

export interface VistaValorizacionInventario {
  id_producto: number;
  nombre: string;
  stock_actual: number;
  precio_unitario: number;
  valor_total: number;
}

// ---------------------------------------------------------------------------
// Funciones RPC expuestas por la base
// ---------------------------------------------------------------------------

/** Resultado de `fn_generar_resumen_kpis(p_desde, p_hasta)`. */
export interface ResumenKpis {
  periodo_desde: string;
  periodo_hasta: string;
  total_ingresos: number;
  clientes_atendidos: number;
  servicios_completados: number;
  /** Porcentaje 0-100 con dos decimales. */
  tasa_cancelacion: number;
  stock_critico_count: number;
  comisiones_pendientes: number;
}

// ---------------------------------------------------------------------------
// Utilidades de tipos
// ---------------------------------------------------------------------------

/** Campos que la base genera sola y nunca se envian en un INSERT. */
type Generados =
  | 'created_at'
  | 'updated_at'
  | 'fecha_registro'
  | 'fecha_creacion'
  | 'fecha_accion'
  | 'fecha_generacion'
  | 'fecha_alerta'
  | 'fecha_uso'
  | 'fecha_pedido';

/** Forma de un registro nuevo: sin la clave primaria ni los campos generados. */
export type Nuevo<T, PK extends keyof T> = Omit<T, PK | Extract<keyof T, Generados>>;

/** Forma de una actualizacion parcial. */
export type Cambios<T, PK extends keyof T> = Partial<Nuevo<T, PK>>;

export type NuevoCliente = Nuevo<Cliente, 'id_cliente'>;
export type CambiosCliente = Cambios<Cliente, 'id_cliente'>;
export type NuevoServicio = Nuevo<Servicio, 'id_servicio'>;
export type CambiosServicio = Cambios<Servicio, 'id_servicio'>;
export type NuevoProfesional = Nuevo<Profesional, 'id_profesional'>;
export type CambiosProfesional = Cambios<Profesional, 'id_profesional'>;
export type NuevoProducto = Nuevo<Producto, 'id_producto'>;
export type CambiosProducto = Cambios<Producto, 'id_producto'>;
export type NuevoProveedor = Nuevo<Proveedor, 'id_proveedor'>;
