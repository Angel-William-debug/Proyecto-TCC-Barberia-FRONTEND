/**
 * La unica puerta publica del backend.
 *
 * `apps/web` importa de aca y de ningun otro lado: nunca de un modulo suelto
 * ni, mucho menos, de un cliente de Supabase. Esa regla la hace cumplir el
 * compilador, porque `@supabase/ssr` no es dependencia de `apps/web`.
 *
 * Los clientes de Supabase NO se reexportan a proposito: quien los necesita
 * -el middleware- los importa por su ruta completa, y esa friccion es
 * deliberada.
 *
 * El orden de los bloques es el mismo de la barra lateral del panel, para que
 * buscar una funcion sea mirar la pantalla donde se usa.
 */

export { entornoPublico, entornoPrivado } from './entorno';
export { MODO_DEMO } from './demo/modo';
export { ErrorAplicacion, traducirError, ejecutar } from './errores';

// --- Sesion ----------------------------------------------------------------
export { usuarioActual, exigirSesion } from './modulos/sesion';

// --- Agenda ----------------------------------------------------------------
export {
  listarAgenda,
  obtenerCita,
  crearCita,
  cambiarEstadoCita,
  hayConflictoHorario,
} from './modulos/agenda';

// --- Clientes --------------------------------------------------------------
export { listarClientes, obtenerCliente, desactivarCliente } from './modulos/clientes';

// --- Servicios -------------------------------------------------------------
export { listarServicios, listarCategoriasServicio } from './modulos/servicios';

// --- Barberos --------------------------------------------------------------
export { listarProfesionales } from './modulos/barberos';

// --- Cobros ----------------------------------------------------------------
export { listarCobros } from './modulos/cobros';

// --- Comisiones ------------------------------------------------------------
export { listarComisiones, liquidarComisiones } from './modulos/comisiones';

// --- Inventario ------------------------------------------------------------
export {
  listarCategoriasProducto,
  listarProductosConNivel,
  listarMovimientos,
} from './modulos/inventario';

// --- Compras ---------------------------------------------------------------
export {
  listarProveedores,
  listarPedidos,
  crearPedido,
  type EntradaNuevoPedido,
  type LineaPedido,
} from './modulos/compras';

// --- Reportes --------------------------------------------------------------
export {
  resumenKpis,
  ingresosPorPeriodo,
  stockCritico,
  comisionesPendientes,
} from './modulos/reportes';

// --- Configuracion ---------------------------------------------------------
export {
  obtenerConfiguracion,
  actualizarConfiguracion,
  listarHorarios,
  listarMetodosPago,
  type EntradaConfiguracion,
} from './modulos/configuracion';

// --- Auditoria -------------------------------------------------------------
export { listarAuditoria } from './modulos/auditoria';

// --- Escritura generica ----------------------------------------------------
export {
  crear,
  actualizar,
  borrarLogico,
  restaurar,
  CLAVE_PRIMARIA,
  type TablaEscribible,
} from './compartido/escritura';
