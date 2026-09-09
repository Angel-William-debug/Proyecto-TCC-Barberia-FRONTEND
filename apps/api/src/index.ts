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
  crearCliente,
  actualizarCliente,
  type EntradaCliente,
} from './modulos/clientes';

// --- Servicios -------------------------------------------------------------
export {
  listarServicios,
  listarCategoriasServicio,
  crearServicio,
  actualizarServicio,
  type EntradaServicio,
} from './modulos/servicios';

// --- Barberos --------------------------------------------------------------
export {
  listarProfesionales,
  crearBarbero,
  actualizarBarbero,
  type EntradaBarbero,
} from './modulos/barberos';

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
  crearProducto,
  actualizarProducto,
  crearCategoriaProducto,
  actualizarCategoriaProducto,
  crearLineaReceta,
  actualizarLineaReceta,
  type EntradaProducto,
  type EntradaCategoriaProducto,
  type EntradaLineaReceta,
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
  crearProveedor,
  actualizarProveedor,
  type EntradaProveedor,
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
  actualizarHorarios,
  listarMetodosPago,
  listarMetodosPagoTodos,
  actualizarMetodosPago,
  type EntradaConfiguracion,
  type EntradaHorario,
} from './modulos/configuracion';

// --- Usuarios y roles --------------------------------------------------------
export {
  listarUsuarios,
  listarRoles,
  crearUsuario,
  actualizarUsuario,
  type EntradaNuevoUsuario,
  type CambiosUsuario,
} from './modulos/usuarios';

// --- Auditoria -------------------------------------------------------------
export { listarAuditoria } from './modulos/auditoria';

// --- Borrado logico --------------------------------------------------------
/**
 * `crear` y `actualizar` NO se exportan, y es deliberado.
 *
 * Son el escritor generico: reciben el nombre de una tabla y un objeto con sus
 * columnas. Mientras salieron de aca, `apps/web` los llamaba directamente y por
 * eso conocia ocho nombres de tabla y sus columnas -`notas_internas`,
 * `porcentaje_com`, `id_categoria_p`-. Cerrar la puerta es lo que convierte la
 * regla 1 en algo que el compilador hace cumplir en vez de una intencion.
 *
 * Quien necesite escribir una entidad usa la funcion de su modulo:
 * `crearCliente`, `actualizarProducto`, `crearBarbero`. Ellas si los llaman,
 * desde adentro del paquete.
 *
 * El borrado logico es la excepcion legitima: `BotonBorrar` y `BotonRestaurar`
 * son un solo componente que sirve a ocho catalogos, y recibe el nombre de la
 * tabla como dato. Ahi la genericidad es el punto, no una fuga.
 */
export {
  borrarLogico,
  restaurar,
  listarBorrados,
  CLAVE_PRIMARIA,
  type TablaEscribible,
  type RegistroBorrado,
} from './compartido/escritura';
