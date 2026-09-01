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
// Columnas transversales
//
// Dos grupos de columnas que la base repite en muchas tablas. Se declaran una
// vez y las interfaces las heredan, de modo que agregar una tercera columna de
// auditoria se haga en un solo lugar.
// ---------------------------------------------------------------------------

/** Presente en las 27 tablas. `updated_at` lo mantiene un disparador. */
export interface AuditoriaTemporal {
  /** Instante de alta. Lo fija el valor por defecto de la columna. */
  created_at: string;
  /** Lo actualiza `fn_set_updated_at()`. Nunca se envia desde la aplicacion. */
  updated_at: string;
}

/**
 * Presente en 14 tablas: las entidades que el usuario da de alta y los
 * documentos que pueden cargarse por error.
 *
 * NO es lo mismo que `estado`. Un servicio con `estado: false` es uno que la
 * barberia dejo de ofrecer y puede reactivar; uno con `deleted: true` esta
 * dado de baja. Las dos columnas conviven a proposito.
 *
 * `deleted_at` lo completa un disparador; `deleted_user_id` lo envia la
 * aplicacion con el usuario de la sesion.
 */
export interface BorradoLogico {
  deleted: boolean;
  deleted_at: string | null;
  deleted_user_id: number | null;
}

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------

export interface Rol extends AuditoriaTemporal {
  id_rol: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

/** `usuarios.password_hash` fue eliminada: la credencial vive en `auth.users` (RN-001). */
export interface Usuario extends AuditoriaTemporal, BorradoLogico {
  id_usuario: number;
  id_rol: number;
  auth_uid: string | null;
  nombre: string;
  email: string;
  fecha_creacion: string;
  estado: boolean;
}

export interface Cliente extends AuditoriaTemporal, BorradoLogico {
  id_cliente: number;
  /** Usuario que lo registro, NO el cliente como usuario del sistema. */
  id_usuario_reg: number | null;
  /**
   * Cuenta con la que este cliente entra al portal.
   *
   * `null` cuando lo registro el mostrador y nunca abrio una cuenta, que es el
   * caso de quien pasa una vez. No confundir con `id_usuario_reg`: aquel es
   * quien lo dio de alta, este es el.
   */
  id_usuario: number | null;
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
export interface Profesional extends AuditoriaTemporal, BorradoLogico {
  id_profesional: number;
  id_usuario: number | null;
  nombre: string;
  especialidad: string | null;
  tipo: string | null;
  /** 0 a 100. Porcentaje de comision sobre el servicio realizado. */
  porcentaje_com: number;
  estado: boolean;
}

export interface CategoriaServicio extends AuditoriaTemporal, BorradoLogico {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface Servicio extends AuditoriaTemporal, BorradoLogico {
  id_servicio: number;
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  duracion_min: number;
  precio_base: number;
  estado: boolean;
}

export interface CategoriaProducto extends AuditoriaTemporal, BorradoLogico {
  id_categoria_p: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface Producto extends AuditoriaTemporal, BorradoLogico {
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
export interface ServicioProducto extends AuditoriaTemporal, BorradoLogico {
  id_servicio_producto: number;
  id_servicio: number;
  id_producto: number;
  cantidad_estandar: number;
  unidad_uso: string | null;
  estado: boolean;
}

export interface Cita extends AuditoriaTemporal, BorradoLogico {
  id_cita: number;
  id_cliente: number;
  /** Usuario que gestiona la cita. */
  id_usuario: number | null;
  fecha_hora: string;
  estado: EstadoCita;
  observaciones: string | null;
  /** Lo calcula el trigger `trg_detalle_cita_after_insert`. No enviarlo al crear. */
  total: number;
}

export interface DetalleCita extends AuditoriaTemporal {
  id_detalle: number;
  id_cita: number;
  id_servicio: number;
  id_profesional: number;
  duracion_min: number;
  precio_unit: number;
  subtotal: number;
}

export interface HistorialServicio extends AuditoriaTemporal {
  id_historial: number;
  id_cita: number | null;
  id_cliente: number;
  id_profesional: number;
  id_servicio: number;
  fecha_realizacion: string;
  costo_cobrado: number;
  observaciones: string | null;
}

export interface ProductoUtilizado extends AuditoriaTemporal {
  id_uso: number;
  id_historial: number;
  id_producto: number;
  cantidad_usada: number;
  /** CU-007 A1: marca el consumo autorizado pese a stock insuficiente (RN-031). */
  excepcion_stock: boolean;
  fecha_uso: string;
}

export interface MetodoPago extends AuditoriaTemporal, BorradoLogico {
  id_metodo: number;
  nombre: string;
  estado: boolean;
}

export interface CobroCliente extends AuditoriaTemporal, BorradoLogico {
  id_cobro: number;
  id_cita: number;
  id_metodo_pago: number;
  monto: number;
  estado: EstadoCobro;
  fecha_pago: string | null;
  comprobante_url: string | null;
}

export interface PagoProfesional extends AuditoriaTemporal {
  id_pago_prof: number;
  id_profesional: number;
  /** UNIQUE: una sola liquidacion por servicio realizado. */
  id_historial: number;
  monto: number;
  fecha_liquidacion: string | null;
  estado: EstadoComision;
}

export interface Proveedor extends AuditoriaTemporal, BorradoLogico {
  id_proveedor: number;
  nombre: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
}

export interface Pedido extends AuditoriaTemporal, BorradoLogico {
  id_pedido: number;
  id_proveedor: number;
  id_usuario: number | null;
  fecha_pedido: string;
  fecha_recepcion: string | null;
  estado: EstadoPedido;
  total: number;
}

export interface DetallePedido extends AuditoriaTemporal {
  id_detalle_pedido: number;
  id_pedido: number;
  id_producto: number;
  cantidad: number;
  precio_unit: number;
  subtotal: number;
}

export interface PagoProveedor extends AuditoriaTemporal {
  id_pago_prov: number;
  id_pedido: number;
  id_metodo_pago: number;
  monto: number;
  fecha_pago: string | null;
  estado: EstadoPagoProveedor;
}

export interface MovimientoInventario extends AuditoriaTemporal {
  id_movimiento: number;
  id_producto: number;
  id_usuario: number | null;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  fecha: string;
}

export interface AlertaStock extends AuditoriaTemporal {
  id_alerta: number;
  id_producto: number;
  stock_actual: number;
  stock_minimo: number;
  fecha_alerta: string;
  resuelta: boolean;
}

export interface Notificacion extends AuditoriaTemporal {
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

export interface RecomendacionMl extends AuditoriaTemporal {
  id_recomendacion: number;
  id_cliente: number;
  id_servicio: number;
  /** 0 a 1. */
  score_relevancia: number;
  algoritmo: string | null;
  fecha_generacion: string;
}

export interface Auditoria extends AuditoriaTemporal {
  id_auditoria: number;
  id_usuario: number | null;
  tabla_afectada: string;
  accion: AccionAuditoria;
  registro_id: number | null;
  detalle: string | null;
  fecha_accion: string;
}

/** CU-020. Fila unica: `id_configuracion` siempre vale 1. */
export interface ConfiguracionSistema extends AuditoriaTemporal {
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
}

/** CU-020. `dia_semana`: 0 = domingo ... 6 = sabado. */
export interface HorarioAtencion extends AuditoriaTemporal, BorradoLogico {
  id_horario: number;
  dia_semana: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Formato HH:mm:ss. */
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

/** `facturas.estado`. */
export const ESTADOS_FACTURA = ['emitida', 'anulada'] as const;
export type EstadoFactura = (typeof ESTADOS_FACTURA)[number];

/**
 * CU-025 (anexo). Comprobante interno de venta emitido desde un cobro.
 * Sin integracion con SIFEN: no reemplaza una factura legal paraguaya.
 */
export interface Factura extends AuditoriaTemporal, BorradoLogico {
  id_factura: number;
  id_cliente: number;
  id_cita: number;
  id_cobro: number | null;
  fecha_emision: string;
  subtotal: number;
  total: number;
  estado: EstadoFactura;
  observaciones: string | null;
}

export interface DetalleFactura extends AuditoriaTemporal {
  id_detalle_factura: number;
  id_factura: number;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
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
// Vistas ampliadas (24). Todas de solo lectura, con security_invoker, y ya
// filtradas por `not deleted`: lo borrado no aparece.
// ---------------------------------------------------------------------------

// --- Modulo 1: configuracion -----------------------------------------------

export interface VistaHorarioSemana {
  id_horario: number;
  dia_semana: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  nombre_dia: string;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
  /** Minutos que la barberia abre ese dia. Denominador de la ocupacion. */
  minutos_abierta: number;
}

export interface VistaUsuarioPorRol {
  id_usuario: number;
  nombre: string;
  email: string;
  rol: NombreRol;
  estado: boolean;
  created_at: string;
  id_profesional: number | null;
  es_barbero: boolean;
}

// --- Modulo 2: clientes ----------------------------------------------------

export interface VistaClienteResumen {
  id_cliente: number;
  nombre: string;
  telefono: string;
  email: string | null;
  fecha_nacimiento: string | null;
  estado: boolean;
  created_at: string;
  cantidad_visitas: number;
  total_gastado: number;
  ticket_promedio: number;
  ultima_visita: string | null;
  primera_visita: string | null;
  /** Null si el cliente nunca vino. */
  dias_sin_venir: number | null;
}

export interface VistaClienteInactivo {
  id_cliente: number;
  nombre: string;
  telefono: string;
  email: string | null;
  cantidad_visitas: number;
  total_gastado: number;
  ultima_visita: string;
  dias_sin_venir: number;
}

export interface VistaClienteFrecuente {
  id_cliente: number;
  nombre: string;
  telefono: string;
  cantidad_visitas: number;
  total_gastado: number;
  ticket_promedio: number;
  ultima_visita: string;
  /** Visitas por mes desde la primera. Indicador de frecuencia del TCC. */
  visitas_por_mes: number | null;
}

export interface VistaCumpleanos {
  id_cliente: number;
  nombre: string;
  telefono: string;
  email: string | null;
  fecha_nacimiento: string;
  dia: number;
  edad: number;
}

// --- Modulo 3: administracion de datos -------------------------------------

export interface VistaCatalogoServicio {
  id_servicio: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  duracion_min: number;
  precio_base: number;
  estado: boolean;
  productos_receta: number;
}

export interface VistaServicioSolicitado {
  id_servicio: number;
  nombre: string;
  categoria: string;
  precio_base: number;
  veces_realizado: number;
  facturado: number;
  ultima_vez: string | null;
}

export interface VistaProfesionalResumen {
  id_profesional: number;
  nombre: string;
  especialidad: string | null;
  tipo: string | null;
  porcentaje_com: number;
  estado: boolean;
  servicios_realizados: number;
  facturado: number;
  comision_pendiente: number;
  comision_liquidada: number;
  clientes_distintos: number;
  ultimo_servicio: string | null;
}

// --- Modulo 4: agenda ------------------------------------------------------

export interface VistaAgendaDia {
  id_cita: number;
  fecha_hora: string;
  dia: string;
  estado: EstadoCita;
  total: number;
  observaciones: string | null;
  id_cliente: number;
  nombre_cliente: string;
  telefono_cliente: string;
  /** Nombres separados por coma: un turno puede tener varios barberos. */
  barberos: string | null;
  servicios: string | null;
  duracion_total_min: number;
  fecha_hora_fin: string;
}

export interface VistaOcupacionBarbero {
  id_profesional: number;
  nombre_profesional: string;
  dia: string;
  turnos: number;
  minutos_ocupados: number;
  facturacion_agendada: number;
}

export interface VistaProximoTurno {
  id_cita: number;
  fecha_hora: string;
  estado: EstadoCita;
  nombre_cliente: string;
  telefono: string;
  email: string | null;
  servicios: string | null;
  /** RN-050: evita mandar el recordatorio dos veces. */
  recordatorio_enviado: boolean;
}

export interface VistaCitaCancelada {
  id_cita: number;
  fecha_hora: string;
  dia: string;
  estado: Extract<EstadoCita, 'cancelado' | 'no_asistio'>;
  nombre_cliente: string;
  telefono: string;
  observaciones: string | null;
  monto_perdido: number;
  fecha_cancelacion: string;
}

// --- Modulo 5: cobros y pagos ----------------------------------------------

export interface VistaCobroDetalle {
  id_cobro: number;
  id_cita: number;
  monto: number;
  estado: EstadoCobro;
  fecha_pago: string | null;
  comprobante_url: string | null;
  metodo_pago: string;
  id_cliente: number;
  nombre_cliente: string;
  fecha_turno: string;
  total_turno: number;
  saldo: number;
}

export interface VistaCobroPendiente {
  id_cita: number;
  fecha_hora: string;
  nombre_cliente: string;
  telefono: string;
  total: number;
  cobrado: number;
  saldo: number;
}

export interface VistaIngresoPorMetodo {
  id_metodo: number;
  metodo_pago: string;
  anio: number;
  mes: number;
  cantidad_cobros: number;
  total: number;
  promedio: number;
}

export interface VistaTicketPromedioBarbero {
  id_profesional: number;
  nombre_profesional: string;
  servicios: number;
  facturado: number;
  ticket_promedio: number;
  minimo: number;
  maximo: number;
}

export interface VistaComisionLiquidada {
  id_pago_prof: number;
  id_profesional: number;
  nombre_profesional: string;
  nombre_servicio: string;
  fecha_realizacion: string;
  costo_cobrado: number;
  porcentaje_com: number;
  comision: number;
  fecha_liquidacion: string | null;
}

// --- Modulo 6: inventario y compras ----------------------------------------

export interface VistaInventarioValorizado {
  id_producto: number;
  nombre: string;
  categoria: string;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number | null;
  precio_unitario: number;
  valor_stock: number;
  /** Replica la logica de la seccion 10.5 del sistema de diseno. */
  nivel: 'sin_stock' | 'critico' | 'bajo' | 'disponible' | 'sobrestock';
}

export interface VistaProductoConsumido {
  id_producto: number;
  nombre: string;
  categoria: string;
  stock_actual: number;
  unidad_uso: string | null;
  veces_usado: number;
  cantidad_total: number;
  /** Veces que se completo un servicio con stock insuficiente (CU-007 A1). */
  usos_con_excepcion: number;
  ultimo_uso: string | null;
}

export interface VistaMovimientoDetalle {
  id_movimiento: number;
  fecha: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  id_producto: number;
  nombre_producto: string;
  nombre_usuario: string | null;
}

export interface VistaCompraPorProveedor {
  id_proveedor: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  pedidos: number;
  recibidos: number;
  cancelados: number;
  total_comprado: number;
  ultimo_pedido: string | null;
}

// --- Modulo 7: reportes ----------------------------------------------------

export interface VistaResumenMensual {
  /** Primer dia del mes, aaaa-MM-dd. */
  mes: string;
  anio: number;
  numero_mes: number;
  turnos: number;
  completados: number;
  cancelados: number;
  clientes_atendidos: number;
  ingresos: number;
  comisiones: number;
}

export interface VistaAuditoriaDetalle {
  id_auditoria: number;
  fecha_accion: string;
  tabla_afectada: string;
  accion: AccionAuditoria;
  registro_id: number | null;
  detalle: string | null;
  id_usuario: number | null;
  /** «Sistema» cuando la accion no tiene usuario asociado. */
  nombre_usuario: string;
  rol_usuario: NombreRol | null;
}

// ---------------------------------------------------------------------------
// Catalogo publico del portal del cliente
//
// Las tres vistas `v_publico_*` son las unicas del sistema declaradas SIN
// `security_invoker`: se ejecutan con los permisos de su dueno y atraviesan
// RLS. Por eso exponen una lista de columnas corta y elegida a mano —
// `v_publico_barberos` omite `porcentaje_com` a proposito—, y por eso `anon`
// puede leerlas: la portada muestra precios y horarios sin pedir sesion.
// ---------------------------------------------------------------------------

export interface VistaPublicoServicio {
  id_servicio: number;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  duracion_min: number;
  precio_base: number;
}

export interface VistaPublicoBarbero {
  id_profesional: number;
  nombre: string;
  especialidad: string | null;
}

export interface VistaPublicoHorario {
  /** 0 = domingo ... 6 = sabado. */
  dia_semana: number;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

// ---------------------------------------------------------------------------
// Funciones RPC expuestas por la base
// ---------------------------------------------------------------------------

/**
 * Una fila de `fn_turnos_disponibles(p_fecha, p_duracion_min, ...)`.
 *
 * `barberos_disponibles` es la capacidad real de esa franja: cuantos turnos
 * simultaneos entran. No sale de un cupo configurado sino de cuantos barberos
 * activos quedan libres, asi que baja sola cuando uno se desactiva.
 */
export interface FranjaDisponible {
  /** ISO 8601 con zona. Es lo que se manda como `fecha_hora` al agendar. */
  inicio: string;
  /** `HH:mm:ss` en la zona horaria de la barberia. Para mostrar, no para enviar. */
  hora_local: string;
  barberos_disponibles: number;
  ids_barberos: number[];
}

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

/**
 * Campos que la base genera sola y nunca se envian en un INSERT.
 *
 * Incluye las columnas de borrado logico: un registro no nace borrado, y
 * `deleted_at` lo completa un disparador. Para dar de baja se usa
 * `borrarLogico()` de la capa de datos, no un insert ni un update crudo.
 */
type Generados =
  | 'created_at'
  | 'updated_at'
  | 'deleted'
  | 'deleted_at'
  | 'deleted_user_id'
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
export type NuevoServicioProducto = Nuevo<ServicioProducto, 'id_servicio_producto'>;
export type CambiosServicioProducto = Cambios<ServicioProducto, 'id_servicio_producto'>;
export type NuevaCategoriaProducto = Nuevo<CategoriaProducto, 'id_categoria_p'>;
