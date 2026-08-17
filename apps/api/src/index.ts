/**
 * @barber-shop/api - capa de acceso a datos.
 *
 * Es el unico lugar del sistema que conoce Supabase. Las vistas de
 * `apps/web` importan funciones de dominio (`listarClientes`, `crearCita`) y
 * nunca un cliente de base de datos. Esa frontera es lo que permite cambiar
 * el proveedor, agregar cache o registrar auditoria sin tocar una sola
 * pantalla.
 *
 * Los clientes de Supabase NO se reexportan aqui a proposito: se importan
 * desde sus subrutas (`@barber-shop/api/servidor`) para que quien los use
 * tenga que escribirlo de forma explicita.
 */

export { entornoPublico, entornoPrivado } from './entorno';
export { MODO_DEMO } from './demo/modo';
export { ErrorAplicacion, traducirError, ejecutar } from './errores';

export { usuarioActual, exigirSesion } from './repositorios/sesion';

export {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
} from './repositorios/clientes';

export {
  listarAgenda,
  obtenerCita,
  crearCita,
  cambiarEstadoCita,
  hayConflictoHorario,
} from './repositorios/agenda';

export {
  listarServicios,
  listarCategoriasServicio,
  listarProfesionales,
  listarMetodosPago,
  listarProductosConNivel,
  obtenerConfiguracion,
  listarHorariosAtencion,
} from './repositorios/catalogo';

export {
  resumenKpis,
  ingresosPorPeriodo,
  stockCritico,
  comisionesPendientes,
} from './repositorios/reportes';

export {
  listarCobros,
  listarComisiones,
  listarProveedores,
  listarPedidos,
  listarMovimientos,
  listarAuditoria,
  listarHorarios,
} from './repositorios/operaciones';
