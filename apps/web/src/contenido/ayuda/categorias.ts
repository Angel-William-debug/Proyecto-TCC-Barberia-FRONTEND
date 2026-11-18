import type { Categoria } from './tipos';

/**
 * Las secciones del centro de ayuda, en el orden en que se muestran.
 *
 * El orden sigue el de la barra lateral: primero cómo entrar y moverse,
 * después lo que se usa con el cliente enfrente y al final lo que se ajusta
 * una vez al mes. Una categoría sin artículos para el rol no se muestra.
 */
export const CATEGORIAS: readonly Categoria[] = [
  { id: 'primeros-pasos', titulo: 'Primeros pasos', descripcion: 'Ingresar, confirmar el correo y recuperar la contraseña.', icono: 'key-round' },
  { id: 'uso-del-panel', titulo: 'Cómo se usa el panel', descripcion: 'Menú, búsqueda, filtros, formularios, exportar y la papelera.', icono: 'menu' },
  { id: 'guias', titulo: 'Guías de punta a punta', descripcion: 'Procesos que cruzan varias pantallas, en orden.', icono: 'clipboard-list' },
  { id: 'mi-dia', titulo: 'Mi día', descripcion: 'Su agenda, sus servicios y sus comisiones.', icono: 'clock' },
  { id: 'agenda', titulo: 'Agenda y turnos', descripcion: 'Agendar, confirmar, reprogramar, cancelar y completar turnos.', icono: 'calendar-days' },
  { id: 'cobros', titulo: 'Cobros y facturas', descripcion: 'Cobrar un turno y emitir su comprobante.', icono: 'receipt' },
  { id: 'clientes', titulo: 'Clientes', descripcion: 'Fichas, historial y recomendaciones.', icono: 'user-round' },
  { id: 'inventario', titulo: 'Inventario', descripcion: 'Productos, stock, movimientos y alertas.', icono: 'package' },
  { id: 'notificaciones', titulo: 'Avisos y recordatorios', descripcion: 'Lo que el sistema le manda a los clientes y lo que pide atención.', icono: 'bell' },
  { id: 'catalogos', titulo: 'Servicios y barberos', descripcion: 'El catálogo de servicios, sus recetas y el equipo.', icono: 'scissors' },
  { id: 'compras', titulo: 'Compras y proveedores', descripcion: 'Órdenes de compra, recepción y pagos a proveedores.', icono: 'truck' },
  { id: 'comisiones', titulo: 'Comisiones', descripcion: 'Cómo se generan y cómo se liquidan.', icono: 'hand-coins' },
  { id: 'informes', titulo: 'Tablero, reportes y ranking', descripcion: 'Indicadores, reportes exportables y el desempeño del equipo.', icono: 'chart-column' },
  { id: 'configuracion', titulo: 'Configuración', descripcion: 'Datos de la barbería, horarios, métodos de pago y recordatorios.', icono: 'settings' },
  { id: 'usuarios', titulo: 'Usuarios y auditoría', descripcion: 'Cuentas del personal, roles y registro de cambios.', icono: 'shield-check' },
  { id: 'reservas', titulo: 'Reservas y turnos', descripcion: 'Reservar, ver y cancelar sus turnos.', icono: 'calendar-days' },
  { id: 'su-cuenta', titulo: 'Su cuenta', descripcion: 'Historial, comprobantes, recomendaciones y sus datos.', icono: 'user-round' },
  { id: 'app', titulo: 'La app del teléfono', descripcion: 'Instalarla, los avisos y en qué se diferencia de la web.', icono: 'bell' },
];
