/**
 * Tipos del dominio: los que la interfaz necesita y la base no devuelve tal cual.
 *
 * Aqui viven las composiciones (una cita con su cliente y sus servicios), los
 * valores derivados (el nivel de stock) y los contratos de los formularios.
 * Nada de esto es una tabla; todo se arma en `@barber-shop/api`.
 */

import type {
  AccionAuditoria,
  AuditoriaTemporal,
  BorradoLogico,
  Cita,
  Cliente,
  DetalleCita,
  EstadoCita,
  EstadoCobro,
  EstadoComision,
  EstadoFactura,
  EstadoPagoProveedor,
  EstadoPedido,
  NombreRol,
  Producto,
  Profesional,
  Servicio,
  TipoMovimiento,
} from './base-datos';

// ---------------------------------------------------------------------------
// Sesion y permisos
// ---------------------------------------------------------------------------

export interface UsuarioSesion {
  idUsuario: number;
  authUid: string;
  nombre: string;
  email: string;
  rol: NombreRol;
  /** Presente solo si el usuario tambien es profesional. Habilita el panel del barbero. */
  idProfesional: number | null;
}

/**
 * Modulos de la aplicacion. El acceso se decide en la base mediante RLS;
 * esto solo controla que se muestra en la navegacion, para no ofrecer
 * pantallas que despues van a fallar.
 */
export const MODULOS = [
  'agenda',
  'clientes',
  'servicios',
  'profesionales',
  'cobros',
  'facturas',
  'comisiones',
  'inventario',
  'compras',
  'reportes',
  'configuracion',
  'usuarios',
  'papelera',
  'auditoria',
] as const;
export type Modulo = (typeof MODULOS)[number];

/**
 * Refleja las politicas RLS. La base sigue siendo la autoridad.
 *
 * `cliente` esta vacio y va a seguir estandolo: no es que le falten permisos,
 * es que no usa el panel. Su lugar es el portal (`/mi-cuenta`), que tiene su
 * propia navegacion en `SECCIONES_PORTAL` porque no comparte ni el armazon ni
 * la identidad visual con las pantallas del mostrador.
 */
export const MODULOS_POR_ROL: Record<NombreRol, readonly Modulo[]> = {
  administrador: MODULOS,
  recepcionista: [
    'agenda', 'clientes', 'servicios', 'profesionales', 'cobros', 'facturas', 'inventario',
    'papelera',
  ],
  profesional: ['agenda', 'comisiones'],
  cliente: [],
};

/** Un rol usa el panel del mostrador, o usa el portal. Nunca los dos. */
export function usaElPortal(rol: NombreRol): boolean {
  return rol === 'cliente';
}

// ---------------------------------------------------------------------------
// Composiciones de lectura
// ---------------------------------------------------------------------------

/**
 * Un servicio dentro de una cita, ya resuelto con sus nombres.
 *
 * Se omiten `created_at` y `updated_at`: la consulta de la agenda no los pide
 * porque ninguna pantalla los muestra, y traer columnas que no se usan encarece
 * cada carga de la agenda sin beneficio.
 */
export interface ServicioDeCita extends Omit<DetalleCita, keyof AuditoriaTemporal> {
  servicio: Pick<Servicio, 'id_servicio' | 'nombre'>;
  profesional: Pick<Profesional, 'id_profesional' | 'nombre'>;
}

/**
 * Una cita lista para mostrarse en la agenda o en su ficha.
 *
 * Se omiten las columnas de borrado logico: la consulta ya filtra por ellas,
 * de modo que `deleted` seria siempre falso y arrastrarlo hasta la vista solo
 * invita a volver a comprobarlo donde no hace falta.
 */
export interface CitaCompleta extends Omit<Cita, keyof BorradoLogico> {
  cliente: Pick<Cliente, 'id_cliente' | 'nombre' | 'telefono'>;
  servicios: ServicioDeCita[];
  /** Suma de `duracion_min` de los detalles. Define el alto del bloque en la agenda. */
  duracionTotalMin: number;
  /** Instante de finalizacion, en ISO. `fecha_hora` mas la duracion total. */
  fechaHoraFin: string;
}

/** Fila de la agenda diaria agrupada por barbero. */
export interface ColumnaAgenda {
  profesional: Pick<Profesional, 'id_profesional' | 'nombre' | 'especialidad'>;
  citas: CitaCompleta[];
}

/**
 * Filas de listado ya resueltas con sus nombres.
 *
 * La base guarda claves foráneas; una tabla necesita nombres. Estas formas
 * son lo que devuelve la capa de datos después de hacer el `join`, para que
 * ninguna vista tenga que pedir el nombre de un producto por separado.
 */

export interface CobroDeLista {
  id_cobro: number;
  id_cita: number;
  nombre_cliente: string;
  metodo_pago: string;
  monto: number;
  estado: EstadoCobro;
  fecha_pago: string | null;
}

export interface ComisionDeLista {
  id_pago_prof: number;
  nombre_profesional: string;
  nombre_servicio: string;
  fecha_realizacion: string;
  costo_cobrado: number;
  porcentaje: number;
  monto: number;
  estado: EstadoComision;
}

export interface PedidoDeLista {
  id_pedido: number;
  nombre_proveedor: string;
  fecha_pedido: string;
  fecha_recepcion: string | null;
  cantidad_items: number;
  estado: EstadoPedido;
  total: number;
}

/** CU-018 — pago al proveedor. */
export interface PagoProveedorDeLista {
  id_pago_prov: number;
  id_pedido: number;
  nombre_proveedor: string;
  metodo_pago: string;
  monto: number;
  fecha_pago: string | null;
  estado: EstadoPagoProveedor;
}

/** Ordenes recibidas con saldo sin pagar, para el selector del formulario (RN-028). */
export interface PedidoPendientePago {
  id_pedido: number;
  nombre_proveedor: string;
  fecha_pedido: string;
  total: number;
  pagado: number;
  saldo: number;
}

export interface MovimientoDeLista {
  id_movimiento: number;
  nombre_producto: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string | null;
  fecha: string;
  nombre_usuario: string | null;
}

export interface AuditoriaDeLista {
  id_auditoria: number;
  nombre_usuario: string | null;
  tabla_afectada: string;
  accion: AccionAuditoria;
  registro_id: number | null;
  detalle: string | null;
  fecha_accion: string;
}

// ---------------------------------------------------------------------------
// Valores derivados
// ---------------------------------------------------------------------------

/** Seccion 10.5 del sistema de diseno. */
export const NIVELES_STOCK = [
  'sin_stock',
  'critico',
  'bajo',
  'disponible',
  'sobrestock',
] as const;
export type NivelStock = (typeof NIVELES_STOCK)[number];

export interface ProductoConNivel extends Producto {
  nivel: NivelStock;
}

/**
 * Deriva el nivel a partir del stock actual y el minimo.
 *
 * Vive en `tipos` y no en `ui` a proposito: la capa de datos tambien lo
 * necesita, y hacer que `@barber-shop/api` dependiera de `@barber-shop/ui`
 * significaria arrastrar React dentro del acceso a datos.
 *
 * `stockActual` PUEDE SER NEGATIVO: la restriccion `CHECK stock_actual >= 0`
 * se elimino de la base para habilitar el flujo CU-007 A1, que autoriza
 * completar un servicio con stock insuficiente previa confirmacion. Por eso
 * la primera comparacion es `<= 0` y no `=== 0`.
 */
export function nivelStock(
  stockActual: number,
  stockMinimo: number,
  stockMaximo?: number | null,
): NivelStock {
  if (stockActual <= 0) return 'sin_stock';
  if (stockMaximo != null && stockActual > stockMaximo) return 'sobrestock';
  if (stockActual <= stockMinimo) return 'critico';
  if (stockActual <= stockMinimo * 1.5) return 'bajo';
  return 'disponible';
}

// ---------------------------------------------------------------------------
// Contratos de entrada
// ---------------------------------------------------------------------------

/**
 * Alta de una cita. El total NO se envia: lo calcula el trigger
 * `trg_detalle_cita_after_insert` a partir de los subtotales.
 */
export interface EntradaNuevaCita {
  idCliente: number;
  /** ISO 8601 con zona. */
  fechaHora: string;
  observaciones?: string;
  servicios: Array<{
    idServicio: number;
    idProfesional: number;
  }>;
}

export interface EntradaNuevoCobro {
  idCita: number;
  idMetodoPago: number;
  monto: number;
  /** `true` cuando el monto no cubre el total de la cita (RN-025). */
  esParcial: boolean;
  comprobanteUrl?: string;
}

/** Filtros comunes de los listados. */
export interface FiltroListado {
  busqueda?: string;
  soloActivos?: boolean;
  pagina?: number;
  porPagina?: number;
}

export interface FiltroAgenda {
  /** Fecha en formato aaaa-MM-dd. */
  desde: string;
  hasta: string;
  idProfesional?: number;
  estados?: EstadoCita[];
}

/** Respuesta paginada de cualquier listado. */
export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

// ---------------------------------------------------------------------------
// Insumos: receta del servicio y consumo al cerrar un turno (CU-003, CU-011)
// ---------------------------------------------------------------------------

/** Una linea de la receta de un servicio, con el nombre del producto resuelto. */
export interface RecetaLinea {
  id_servicio_producto: number;
  id_producto: number;
  nombre_producto: string;
  cantidad_estandar: number;
  unidad_uso: string | null;
}

export interface EntradaLineaReceta {
  idServicio: number;
  idProducto: number;
  cantidadEstandar: number;
  unidadUso?: string;
}

/** Un producto de la receta propuesto para un servicio ya cerrado, con su stock. */
export interface ProductoSugerido {
  idProducto: number;
  nombreProducto: string;
  cantidadSugerida: number;
  unidadUso: string | null;
  stockActual: number;
}

/** Lo que devuelve `completarCita`: por cada servicio del turno, su receta sugerida. */
export interface SugerenciaCierre {
  idHistorial: number;
  idServicio: number;
  nombreServicio: string;
  productos: ProductoSugerido[];
}

export interface EntradaProductoUtilizado {
  idHistorial: number;
  idProducto: number;
  cantidadUsada: number;
  /** RN-031: el usuario confirmo consumir por encima del stock disponible. */
  excepcionStock?: boolean;
}

// ---------------------------------------------------------------------------
// Alertas de stock (CU-022)
// ---------------------------------------------------------------------------

export interface AlertaDeLista {
  id_alerta: number;
  id_producto: number;
  nombre_producto: string;
  stock_actual: number;
  stock_minimo: number;
  fecha_alerta: string;
  resuelta: boolean;
}

// ---------------------------------------------------------------------------
// Recomendaciones ML (CU-013)
// ---------------------------------------------------------------------------

export interface RecomendacionDeLista {
  id_recomendacion: number;
  id_servicio: number;
  nombre_servicio: string;
  score_relevancia: number;
  algoritmo: string | null;
  fecha_generacion: string;
}

// ---------------------------------------------------------------------------
// Facturas (CU-025, anexo)
// ---------------------------------------------------------------------------

export interface FacturaDeLista {
  id_factura: number;
  id_cliente: number;
  nombre_cliente: string;
  id_cita: number;
  fecha_emision: string;
  total: number;
  estado: EstadoFactura;
}

export interface FacturaCompleta extends FacturaDeLista {
  subtotal: number;
  observaciones: string | null;
  lineas: Array<{
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
  }>;
}

// ---------------------------------------------------------------------------
// Portal del cliente
//
// El portal es la mitad de la plataforma que usa quien viene a cortarse el
// pelo. Comparte la base de datos y `apps/api` con el panel del mostrador, y
// no comparte nada mas: ni armazon, ni navegacion, ni la sensacion de estar
// frente a un sistema de gestion.
//
// Lo que puede hacer, y no mas que eso: reservar un turno viendo que hay
// libre, consultar sus turnos, y mirar su historial y sus facturas. Todo lo
// demas -precios de costo, comisiones, inventario, otros clientes- no le
// llega, y no porque la pantalla no lo muestre sino porque las politicas RLS
// del rol `cliente` no lo devuelven.
// ---------------------------------------------------------------------------

/** Las secciones del portal, en el orden en que aparecen en su navegacion. */
export const SECCIONES_PORTAL = ['reservar', 'turnos', 'historial', 'perfil'] as const;
export type SeccionPortal = (typeof SECCIONES_PORTAL)[number];

/**
 * Alta de cuenta desde el registro publico (CU-001).
 *
 * Es lo unico que se le pide a alguien para poder reservar. El telefono va
 * porque `clientes.telefono` es NOT NULL desde la migracion de validaciones y
 * porque es como la barberia avisa si algo cambia.
 */
export interface EntradaRegistroCliente {
  nombre: string;
  email: string;
  telefono: string;
  password: string;
}

/** La ficha del cliente tal como el la ve. Sin `notas_internas` (RN-008). */
export interface PerfilCliente {
  idCliente: number;
  nombre: string;
  email: string | null;
  telefono: string;
  direccion: string | null;
  fechaNacimiento: string | null;
  fechaRegistro: string;
}

/** Lo que el cliente puede cambiar de su propia ficha. */
export interface CambiosPerfilCliente {
  nombre: string;
  telefono: string;
  direccion?: string;
  fechaNacimiento?: string;
}

/**
 * Un turno en la lista del cliente.
 *
 * Trae el nombre del barbero y de los servicios ya resueltos, y la duracion
 * total, que es la respuesta a «cuanto me va a llevar» — la pregunta que el
 * mostrador contesta de memoria y el portal tiene que contestar solo.
 */
export interface TurnoDelCliente {
  idCita: number;
  fechaHora: string;
  fechaHoraFin: string;
  estado: EstadoCita;
  duracionTotalMin: number;
  total: number;
  observaciones: string | null;
  servicios: Array<{
    idServicio: number;
    nombre: string;
    barbero: string;
    duracionMin: number;
    precio: number;
  }>;
  /** `true` mientras el turno se pueda cancelar desde el portal. */
  cancelable: boolean;
}

/**
 * Reserva hecha desde el portal.
 *
 * No lleva `idCliente`: sale de la sesion. Pedirlo permitiria mandar el de
 * otro, y aunque RLS lo rechazaria, un contrato que invita a intentarlo esta
 * mal escrito.
 */
export interface EntradaReserva {
  /** ISO 8601 con zona, tal como lo devuelve `FranjaDisponible.inicio`. */
  fechaHora: string;
  idServicio: number;
  idProfesional: number;
  observaciones?: string;
}

/** Una factura en la lista del portal. Igual que la del panel, sin el cliente. */
export interface FacturaDelCliente {
  idFactura: number;
  idCita: number;
  fechaEmision: string;
  total: number;
  estado: EstadoFactura;
}
