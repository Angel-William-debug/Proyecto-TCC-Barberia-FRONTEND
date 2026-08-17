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
  'comisiones',
  'inventario',
  'compras',
  'reportes',
  'configuracion',
  'auditoria',
] as const;
export type Modulo = (typeof MODULOS)[number];

/** Refleja las 56 politicas RLS. La base sigue siendo la autoridad. */
export const MODULOS_POR_ROL: Record<NombreRol, readonly Modulo[]> = {
  administrador: MODULOS,
  recepcionista: ['agenda', 'clientes', 'servicios', 'profesionales', 'cobros', 'inventario'],
  profesional: ['agenda', 'comisiones'],
  cliente: [],
};

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
