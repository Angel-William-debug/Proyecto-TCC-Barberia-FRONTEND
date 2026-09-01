/**
 * Conjunto de datos ficticio del modo demostración.
 *
 * Los nombres, teléfonos y correos son inventados. Los precios están en
 * guaraníes y en el rango real de una barbería de San Lorenzo, para que las
 * capturas del TCC resulten verosímiles.
 *
 * Las citas se generan sobre la fecha que pida la agenda, no sobre una fecha
 * fija: si estuvieran congeladas, la vista aparecería vacía al día siguiente.
 */

import type {
  CategoriaProducto,
  CategoriaServicio,
  CitaCompleta,
  Cliente,
  ConfiguracionSistema,
  EstadoCita,
  MetodoPago,
  Producto,
  ProductoConNivel,
  Profesional,
  ResumenKpis,
  Servicio,
  UsuarioSesion,
  VistaComisionPendiente,
  VistaIngresoPorPeriodo,
  VistaStockCritico,
} from '@barber-shop/tipos';
import { nivelStock } from '@barber-shop/tipos';
import type { AuditoriaTemporal, BorradoLogico } from '@barber-shop/tipos';

// ---------------------------------------------------------------------------
// Columnas transversales de los registros ficticios
//
// Desde las migraciones 10 y 11, toda tabla tiene created_at y updated_at, y
// catorce tienen ademas las de borrado logico. Repetir cinco campos en cada
// objeto de este archivo lo volveria ilegible, asi que se agregan con estos
// dos ayudantes.
// ---------------------------------------------------------------------------

/** Fecha fija: los datos ficticios no deben cambiar entre dos capturas. */
const SELLO = '2026-06-01T09:00:00-03:00';

/** Agrega created_at y updated_at. */
function conFechas<T extends object>(fila: T): T & AuditoriaTemporal {
  return { ...fila, created_at: SELLO, updated_at: SELLO };
}

/** Agrega las fechas y marca la fila como vigente, es decir, no borrada. */
function vigente<T extends object>(fila: T): T & AuditoriaTemporal & BorradoLogico {
  return { ...conFechas(fila), deleted: false, deleted_at: null, deleted_user_id: null };
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

export const USUARIO_DEMO: UsuarioSesion = {
  idUsuario: 1,
  authUid: '00000000-0000-0000-0000-000000000001',
  nombre: 'Angel Rolón',
  email: 'demo@barbershop.com.py',
  rol: 'administrador',
  idProfesional: null,
};

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

export const PROFESIONALES_DEMO: Profesional[] = [
  {
    id_profesional: 1,
    id_usuario: 2,
    nombre: 'Marcos Ayala',
    especialidad: 'Corte clásico y navaja',
    tipo: 'barbero senior',
    porcentaje_com: 40,
    estado: true,
  },
  {
    id_profesional: 2,
    id_usuario: 3,
    nombre: 'Diego Rojas',
    especialidad: 'Degradados y diseño',
    tipo: 'barbero',
    porcentaje_com: 35,
    estado: true,
  },
  {
    id_profesional: 3,
    id_usuario: 4,
    nombre: 'Fabián Ortiz',
    especialidad: 'Barbería tradicional',
    tipo: 'barbero',
    porcentaje_com: 35,
    estado: true,
  },
].map(vigente);

export const SERVICIOS_DEMO: Servicio[] = [
  {
    id_servicio: 1,
    id_categoria: 1,
    nombre: 'Corte clásico',
    descripcion: 'Corte a tijera y máquina, con lavado',
    duracion_min: 30,
    precio_base: 50000,
    estado: true,
  },
  {
    id_servicio: 2,
    id_categoria: 1,
    nombre: 'Corte degradado',
    descripcion: 'Degradado a máquina con perfilado',
    duracion_min: 40,
    precio_base: 60000,
    estado: true,
  },
  {
    id_servicio: 3,
    id_categoria: 2,
    nombre: 'Perfilado de barba',
    descripcion: 'Delineado y recorte con navaja',
    duracion_min: 20,
    precio_base: 45000,
    estado: true,
  },
  {
    id_servicio: 4,
    id_categoria: 2,
    nombre: 'Afeitado tradicional',
    descripcion: 'Toalla caliente, navaja y bálsamo',
    duracion_min: 30,
    precio_base: 55000,
    estado: true,
  },
  {
    id_servicio: 5,
    id_categoria: 1,
    nombre: 'Corte y barba',
    descripcion: 'Corte completo más perfilado de barba',
    duracion_min: 55,
    precio_base: 85000,
    estado: true,
  },
  {
    id_servicio: 6,
    id_categoria: 3,
    nombre: 'Corte infantil',
    descripcion: 'Hasta 12 años',
    duracion_min: 25,
    precio_base: 40000,
    estado: true,
  },
].map(vigente);

export const METODOS_PAGO_DEMO: MetodoPago[] = [
  { id_metodo: 1, nombre: 'Efectivo', estado: true },
  { id_metodo: 2, nombre: 'Transferencia', estado: true },
  { id_metodo: 3, nombre: 'Tarjeta de débito', estado: true },
  { id_metodo: 4, nombre: 'Tarjeta de crédito', estado: true },
  { id_metodo: 5, nombre: 'Billetera electrónica', estado: true },
].map(vigente);

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

const NOMBRES_CLIENTES: Array<[string, string, string | null]> = [
  ['Juan Carlos González', '0981234567', 'jc.gonzalez@correo.com.py'],
  ['Pedro Benítez Cáceres', '0982345678', 'pbenitez@correo.com.py'],
  ['Luis Alberto Cabrera', '0971456789', null],
  ['Carlos Vera Duarte', '0983567890', 'cvera@correo.com.py'],
  ['Marco Antonio Duarte', '0961678901', null],
  ['Hugo Ramírez Sosa', '0984789012', 'hramirez@correo.com.py'],
  ['Sergio Villalba', '0972890123', null],
  ['Óscar Fernández', '0985901234', 'ofernandez@correo.com.py'],
  ['Nelson Aquino Riveros', '0973012345', null],
  ['Rodrigo Martínez Ruiz', '0986123456', 'rmartinez@correo.com.py'],
  ['Gustavo Espínola', '0975234567', null],
  ['Fernando Giménez Paredes', '0987345678', 'fgimenez@correo.com.py'],
  ['Alberto Núñez Ovelar', '0976456789', null],
  ['Ramón Insfrán', '0988567890', 'rinsfran@correo.com.py'],
  ['Víctor Hugo Acosta', '0977678901', null],
];

export const CLIENTES_DEMO: Cliente[] = NOMBRES_CLIENTES.map(([nombre, telefono, email], i) =>
  vigente({
    id_cliente: i + 1,
    id_usuario_reg: 1,
    // Solo los que tienen correo pueden tener cuenta en el portal, y ni
    // siquiera todos: la mayoria de los clientes de una barberia los registra
    // el mostrador y nunca abren una. La proporcion -uno de cada tres- deja la
    // columna «Cuenta» de la lista de clientes con los dos casos a la vista.
    id_usuario: email && i % 3 === 0 ? 100 + i : null,
    nombre,
    email,
    telefono,
    direccion: i % 3 === 0 ? 'San Lorenzo, Central' : null,
    fecha_nacimiento: null,
    notas_internas: i === 0 ? 'Prefiere tijera, no máquina en los costados.' : null,
    // Fechas de registro escalonadas hacia atrás, una cada cinco días.
    fecha_registro: new Date(Date.now() - (i + 1) * 5 * 86_400_000).toISOString(),
    estado: true,
  }),
);

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

const PRODUCTOS_BASE: Array<[string, number, number, number]> = [
  // nombre, stock_actual, stock_minimo, precio_unitario
  ['Cera modeladora mate 100 g', 14, 5, 45000],
  ['Gel fijador fuerte 250 ml', 3, 4, 28000],
  ['Aceite para barba 30 ml', 0, 3, 65000],
  ['Shampoo anticaspa 500 ml', 9, 3, 52000],
  ['Talco mentolado 100 g', 22, 6, 18000],
  ['Hojas de afeitar (caja x100)', 2, 5, 38000],
  ['Loción after shave 200 ml', 11, 4, 42000],
  ['Bálsamo para barba 50 ml', 6, 4, 58000],
];

export const PRODUCTOS_DEMO: ProductoConNivel[] = PRODUCTOS_BASE.map(
  ([nombre, actual, minimo, precio], i) => {
    const p: Producto = vigente({
      id_producto: i + 1,
      id_categoria_p: 1,
      nombre,
      descripcion: null,
      unidad_medida: 'unidad',
      unidad_uso: 'ml',
      cantidad_uso_estandar: null,
      precio_unitario: precio,
      stock_minimo: minimo,
      stock_maximo: null,
      stock_actual: actual,
      estado: true,
    });
    return { ...p, nivel: nivelStock(actual, minimo, null) };
  },
);

// ---------------------------------------------------------------------------
// Agenda
// ---------------------------------------------------------------------------

/** Turno del día: hora, cliente, servicios, barbero y estado. */
const PLANTILLA_TURNOS: Array<{
  hora: string;
  idCliente: number;
  idsServicio: number[];
  idProfesional: number;
  estado: EstadoCita;
}> = [
  { hora: '08:30', idCliente: 1, idsServicio: [1], idProfesional: 1, estado: 'completado' },
  { hora: '09:15', idCliente: 2, idsServicio: [5], idProfesional: 1, estado: 'completado' },
  { hora: '09:30', idCliente: 3, idsServicio: [2], idProfesional: 2, estado: 'completado' },
  { hora: '10:30', idCliente: 4, idsServicio: [3], idProfesional: 2, estado: 'en_proceso' },
  { hora: '11:00', idCliente: 5, idsServicio: [1, 3], idProfesional: 3, estado: 'confirmado' },
  { hora: '14:00', idCliente: 6, idsServicio: [4], idProfesional: 1, estado: 'confirmado' },
  { hora: '14:30', idCliente: 7, idsServicio: [6], idProfesional: 3, estado: 'pendiente' },
  { hora: '15:30', idCliente: 8, idsServicio: [5], idProfesional: 2, estado: 'pendiente' },
  { hora: '16:30', idCliente: 9, idsServicio: [1], idProfesional: 1, estado: 'cancelado' },
  { hora: '17:00', idCliente: 10, idsServicio: [2], idProfesional: 3, estado: 'no_asistio' },
];

/**
 * Arma la agenda de una fecha concreta.
 *
 * El desfase horario se compone a mano con `-03:00` (America/Asuncion) en vez
 * de usar el reloj del equipo: así la hora que se ve en pantalla es la misma
 * en cualquier máquina donde se tome la captura.
 */
export function agendaDemo(fecha: string): CitaCompleta[] {
  const porServicio = new Map(SERVICIOS_DEMO.map((s) => [s.id_servicio, s]));
  const porProfesional = new Map(PROFESIONALES_DEMO.map((p) => [p.id_profesional, p]));
  const porCliente = new Map(CLIENTES_DEMO.map((c) => [c.id_cliente, c]));

  return PLANTILLA_TURNOS.map((t, indice) => {
    const inicioIso = `${fecha}T${t.hora}:00-03:00`;
    const profesional = porProfesional.get(t.idProfesional)!;
    const cliente = porCliente.get(t.idCliente)!;

    let idDetalle = indice * 10;
    const servicios = t.idsServicio.map((id) => {
      const s = porServicio.get(id)!;
      idDetalle += 1;
      return {
        id_detalle: idDetalle,
        id_cita: indice + 1,
        id_servicio: s.id_servicio,
        id_profesional: profesional.id_profesional,
        duracion_min: s.duracion_min,
        precio_unit: s.precio_base,
        subtotal: s.precio_base,
        servicio: { id_servicio: s.id_servicio, nombre: s.nombre },
        profesional: {
          id_profesional: profesional.id_profesional,
          nombre: profesional.nombre,
        },
      };
    });

    const duracionTotalMin = servicios.reduce((suma, s) => suma + s.duracion_min, 0);
    const total = servicios.reduce((suma, s) => suma + s.subtotal, 0);
    const fin = new Date(new Date(inicioIso).getTime() + duracionTotalMin * 60_000);

    return {
      id_cita: indice + 1,
      id_cliente: cliente.id_cliente,
      id_usuario: 1,
      fecha_hora: inicioIso,
      estado: t.estado,
      observaciones: null,
      // Una cita cancelada o no asistida no factura.
      total: t.estado === 'cancelado' || t.estado === 'no_asistio' ? 0 : total,
      created_at: inicioIso,
      updated_at: inicioIso,
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre: cliente.nombre,
        telefono: cliente.telefono,
      },
      servicios,
      duracionTotalMin,
      fechaHoraFin: fin.toISOString(),
    } satisfies CitaCompleta;
  });
}

// ---------------------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------------------

export const KPIS_DEMO: ResumenKpis = {
  periodo_desde: '2026-08-01',
  periodo_hasta: '2026-08-31',
  total_ingresos: 18450000,
  clientes_atendidos: 184,
  servicios_completados: 231,
  tasa_cancelacion: 6.8,
  stock_critico_count: 3,
  comisiones_pendientes: 3120000,
};

export const INGRESOS_DEMO: VistaIngresoPorPeriodo[] = [
  { anio: 2026, mes: 8, total_ingresos: 18450000, cantidad_servicios: 231, ticket_promedio: 79870 },
  { anio: 2026, mes: 7, total_ingresos: 16420000, cantidad_servicios: 209, ticket_promedio: 78565 },
  { anio: 2026, mes: 6, total_ingresos: 15180000, cantidad_servicios: 198, ticket_promedio: 76667 },
  { anio: 2026, mes: 5, total_ingresos: 14760000, cantidad_servicios: 191, ticket_promedio: 77277 },
];

export const STOCK_CRITICO_DEMO: VistaStockCritico[] = PRODUCTOS_DEMO.filter(
  (p) => p.nivel === 'sin_stock' || p.nivel === 'critico',
).map((p) => ({
  id_producto: p.id_producto,
  nombre: p.nombre,
  stock_actual: p.stock_actual,
  stock_minimo: p.stock_minimo,
  faltante: Math.max(0, p.stock_minimo - p.stock_actual),
}));

export const COMISIONES_DEMO: VistaComisionPendiente[] = [
  {
    id_profesional: 1,
    nombre_profesional: 'Marcos Ayala',
    cantidad_servicios: 42,
    total_comision: 1420000,
  },
  {
    id_profesional: 2,
    nombre_profesional: 'Diego Rojas',
    cantidad_servicios: 35,
    total_comision: 1050000,
  },
  {
    id_profesional: 3,
    nombre_profesional: 'Fabián Ortiz',
    cantidad_servicios: 24,
    total_comision: 650000,
  },
];

export const CONFIGURACION_DEMO: ConfiguracionSistema = conFechas({
  id_configuracion: 1,
  nombre_barberia: 'Barbería San Lorenzo',
  ruc: '80012345-6',
  direccion: 'Avda. Mariscal López 1234, San Lorenzo',
  telefono: '021 555 1234',
  email: 'contacto@barberiasanlorenzo.com.py',
  logo_url: null,
  moneda: 'PYG',
  zona_horaria: 'America/Asuncion',
  minutos_antes_recordatorio: 1440,
  max_reintentos_notif: 3,
});

// ---------------------------------------------------------------------------
// Categorías
//
// Los identificadores coinciden con los que usan SERVICIOS_DEMO y
// PRODUCTOS_DEMO: sin eso, el formulario de edición abriría con la categoría
// vacía y parecería un error de guardado.
// ---------------------------------------------------------------------------

export const CATEGORIAS_SERVICIO_DEMO: CategoriaServicio[] = [
  { id_categoria: 1, nombre: 'Corte', descripcion: 'Cortes de cabello', estado: true },
  { id_categoria: 2, nombre: 'Barba', descripcion: 'Perfilado y afeitado', estado: true },
  { id_categoria: 3, nombre: 'Infantil', descripcion: 'Hasta 12 años', estado: true },
].map(vigente);

export const CATEGORIAS_PRODUCTO_DEMO: CategoriaProducto[] = [
  { id_categoria_p: 1, nombre: 'Peinado y fijación', descripcion: null, estado: true },
  { id_categoria_p: 2, nombre: 'Cuidado de barba', descripcion: null, estado: true },
  { id_categoria_p: 3, nombre: 'Higiene', descripcion: null, estado: true },
  { id_categoria_p: 4, nombre: 'Descartables', descripcion: null, estado: true },
].map(vigente);
