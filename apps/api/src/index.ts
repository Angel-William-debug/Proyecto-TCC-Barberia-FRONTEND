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

// --- Portal del cliente ------------------------------------------------------
// Fuera del orden de la barra lateral porque no esta en la barra lateral: es
// la otra mitad del sistema, la que usa quien viene a cortarse el pelo.
export {
  sesionPortal,
  registrarCliente,
  catalogoServicios,
  barberosPublicos,
  horariosPublicos,
  turnosDisponibles,
  misTurnos,
  reservarTurno,
  cancelarMiTurno,
  miPerfil,
  actualizarMiPerfil,
  misFacturas,
} from './modulos/portal';

// --- Agenda ----------------------------------------------------------------
export {
  listarAgenda,
  obtenerCita,
  crearCita,
  cambiarEstadoCita,
  hayConflictoHorario,
  completarCita,
  registrarProductosUtilizados,
} from './modulos/agenda';

// --- Clientes --------------------------------------------------------------
export {
  listarClientes,
  obtenerCliente,
  desactivarCliente,
  listarHistorialCliente,
} from './modulos/clientes';

// --- Servicios -------------------------------------------------------------
export { listarServicios, listarCategoriasServicio } from './modulos/servicios';

// --- Barberos --------------------------------------------------------------
export { listarProfesionales } from './modulos/barberos';

// --- Cobros ----------------------------------------------------------------
export { listarCobros, listarCitasPendientesDeCobro, crearCobro } from './modulos/cobros';

// --- Facturas ----------------------------------------------------------------
export {
  listarFacturas,
  obtenerFactura,
  crearFactura,
  generarFacturaPdf,
} from './modulos/facturas';

// --- Comisiones ------------------------------------------------------------
export { listarComisiones, liquidarComisiones } from './modulos/comisiones';

// --- Inventario ------------------------------------------------------------
export {
  listarCategoriasProducto,
  listarProductosConNivel,
  listarMovimientos,
  listarRecetaServicio,
  listarAlertas,
  marcarAlertaResuelta,
} from './modulos/inventario';

// --- Compras ---------------------------------------------------------------
export {
  listarProveedores,
  listarPedidos,
  crearPedido,
  listarPagosProveedor,
  listarPedidosPendientesDePago,
  crearPagoProveedor,
  type EntradaNuevoPedido,
  type LineaPedido,
  type EntradaNuevoPagoProveedor,
} from './modulos/compras';

// --- Recomendaciones ---------------------------------------------------------
export { generarRecomendaciones, listarRecomendaciones } from './modulos/recomendaciones';

// --- Reportes --------------------------------------------------------------
export {
  resumenKpis,
  ingresosPorPeriodo,
  stockCritico,
  comisionesPendientes,
  TIPOS_REPORTE,
  TITULOS_TIPO_REPORTE,
  previsualizarReporte,
  exportarReporteExcel,
  exportarReportePdf,
  type TipoReporte,
  type FiltroReporte,
  type PrevisualizacionReporte,
} from './modulos/reportes';

// --- Ranking de barberos -----------------------------------------------------
export {
  rankingBarberos,
  CRITERIOS_RANKING,
  TITULOS_CRITERIO,
  type CriterioRanking,
  type FilaRanking,
  type FiltroRanking,
} from './modulos/ranking';

// --- Configuracion ---------------------------------------------------------
export {
  obtenerConfiguracion,
  actualizarConfiguracion,
  listarHorarios,
  listarMetodosPago,
  type EntradaConfiguracion,
} from './modulos/configuracion';

// --- Usuarios y roles --------------------------------------------------------
export {
  listarUsuarios,
  listarRoles,
  crearUsuario,
  type EntradaNuevoUsuario,
} from './modulos/usuarios';

// --- Auditoria -------------------------------------------------------------
export { listarAuditoria } from './modulos/auditoria';

// --- Escritura generica ----------------------------------------------------
export {
  crear,
  actualizar,
  borrarLogico,
  restaurar,
  listarBorrados,
  CLAVE_PRIMARIA,
  type TablaEscribible,
  type RegistroBorrado,
} from './compartido/escritura';
