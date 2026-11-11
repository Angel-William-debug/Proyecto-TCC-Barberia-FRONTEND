/**
 * Dónde se ve cada registro auditado, cuando hay una pantalla propia.
 *
 * Lo usan el detalle de un registro de Auditoría y la actividad de un usuario
 * (QA F2-10, 11/11/2026): desde los dos se puede ir al registro que se tocó.
 * Las tablas que no están acá no tienen pantalla a la que llevar.
 */
export const RUTA_DEL_REGISTRO: Record<string, (id: number) => string> = {
  citas: (id) => `/panel/agenda/turno/${id}`,
  clientes: (id) => `/panel/clientes/${id}`,
  profesionales: (id) => `/panel/barberos/${id}`,
  servicios: () => '/panel/servicios',
  categorias_servicio: () => '/panel/servicios',
  productos: () => '/panel/inventario',
  categorias_producto: () => '/panel/inventario',
  pedidos: () => '/panel/compras',
  proveedores: () => '/panel/compras',
  cobros_cliente: () => '/panel/cobros',
  pagos_profesional: () => '/panel/comisiones',
  usuarios: () => '/panel/usuarios',
  metodos_pago: () => '/panel/configuracion/metodos-pago',
  horarios_atencion: () => '/panel/configuracion/horarios',
  configuracion_sistema: () => '/panel/configuracion',
};

/** El nombre de la tabla dicho como lo diría una persona. */
export const NOMBRE_DE_TABLA: Record<string, string> = {
  citas: 'el turno',
  clientes: 'el cliente',
  profesionales: 'el barbero',
  servicios: 'el servicio',
  categorias_servicio: 'la categoría de servicio',
  productos: 'el producto',
  categorias_producto: 'la categoría de producto',
  pedidos: 'la orden de compra',
  proveedores: 'el proveedor',
  cobros_cliente: 'el cobro',
  pagos_profesional: 'la comisión',
  usuarios: 'el usuario',
  metodos_pago: 'el método de pago',
  horarios_atencion: 'el horario',
  configuracion_sistema: 'los datos del establecimiento',
};
