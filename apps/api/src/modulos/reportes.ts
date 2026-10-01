import type {
  ResumenKpis,
  VistaComisionPendiente,
  VistaIngresoPorPeriodo,
  VistaStockCritico,
} from '@barber-shop/tipos';

import {
  COMISIONES_DEMO,
  INGRESOS_DEMO,
  KPIS_DEMO,
  STOCK_CRITICO_DEMO,
} from '../demo/datos-catalogo';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';
import { uno } from '../compartido/relaciones';
import { generarExcel } from '../compartido/exportacion/excel';
import { generarPdfTabla } from '../compartido/exportacion/pdf';
import { listarProfesionales } from './barberos';
import { listarServicios } from './servicios';
import { listarUsuarios } from './usuarios';
import { listarAgenda } from './agenda';
import { listarPedidos } from './compras';
import { listarAuditoria } from './auditoria';
import { listarFacturas } from './facturas';
import { rankingBarberos } from './ranking';

/**
 * Reportes del modulo 7.
 *
 * Se apoyan en las 7 vistas SQL y en `fn_generar_resumen_kpis`, que ya viven
 * en la base. Recalcular esos agregados en TypeScript significaria traer al
 * cliente miles de filas para sumarlas, cuando PostgreSQL lo resuelve en una
 * sola consulta.
 */

export async function resumenKpis(desde: string, hasta: string): Promise<ResumenKpis> {
  if (MODO_DEMO) return { ...KPIS_DEMO, periodo_desde: desde, periodo_hasta: hasta };

  const supabase = await clienteServidor();

  const { data, error } = await supabase.rpc('fn_generar_resumen_kpis', {
    p_desde: desde,
    p_hasta: hasta,
  });

  if (error) throw traducirError(error);
  return data as ResumenKpis;
}

export async function ingresosPorPeriodo(): Promise<VistaIngresoPorPeriodo[]> {
  if (MODO_DEMO) return INGRESOS_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('v_ingresos_por_periodo')
    .select('*')
    .order('anio', { ascending: false })
    .order('mes', { ascending: false });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaIngresoPorPeriodo[];
}

export async function stockCritico(): Promise<VistaStockCritico[]> {
  if (MODO_DEMO) return STOCK_CRITICO_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('v_stock_critico')
    .select('id_producto, nombre_producto, stock_actual, stock_minimo, diferencia')
    .order('diferencia', { ascending: false });

  if (error) throw traducirError(error);

  // La vista nombra las columnas `nombre_producto` y `diferencia` (minimo menos
  // actual); el tipo, `nombre` y `faltante`. Antes se devolvia la fila tal
  // cual y Reportes mostraba el producto sin nombre y el faltante como «—».
  return (data ?? []).map((f) => ({
    id_producto: f.id_producto,
    nombre: f.nombre_producto,
    stock_actual: Number(f.stock_actual),
    stock_minimo: Number(f.stock_minimo),
    faltante: Number(f.diferencia),
  }));
}

/**
 * Comisiones pendientes por barbero.
 *
 * Solo el administrador puede leer esto: `pagos_profesional` es una tabla de
 * su exclusividad segun las politicas RLS. Un barbero que consulte su propio
 * panel obtiene sus comisiones por otra via, filtrada por su
 * `id_profesional`.
 *
 * SE AGRUPA ACA Y NO EN LA VISTA
 *
 * Antes se leia `v_comisiones_pendientes` ordenando por `total_comision`,
 * pero esa vista devuelve UNA FILA POR COMISION (id, barbero, servicio,
 * monto, fecha) y no tiene esa columna: la consulta fallaba y Reportes
 * mostraba «No se pudieron cargar los datos». En Comisiones el mismo error
 * quedaba tapado por un `.catch(() => [])` y el resumen salia siempre vacio.
 * En modo demostracion no se veia, porque los datos ficticios ya venian con
 * la forma agrupada.
 *
 * Se lee la tabla con el mismo filtro que la vista -solo las pendientes- y
 * se agrupa por barbero en memoria: son las comisiones de un solo local.
 */
export async function comisionesPendientes(): Promise<VistaComisionPendiente[]> {
  if (MODO_DEMO) return COMISIONES_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('pagos_profesional')
    .select('id_profesional, monto, profesionales ( nombre )')
    .eq('estado', 'pendiente');

  if (error) throw traducirError(error);

  const porBarbero = new Map<number, VistaComisionPendiente>();
  for (const fila of data ?? []) {
    const actual = porBarbero.get(fila.id_profesional) ?? {
      id_profesional: fila.id_profesional,
      nombre_profesional: uno<{ nombre: string }>(fila.profesionales)?.nombre ?? 'Barbero eliminado',
      cantidad_servicios: 0,
      total_comision: 0,
    };
    actual.cantidad_servicios += 1;
    actual.total_comision += Number(fila.monto);
    porBarbero.set(fila.id_profesional, actual);
  }

  return [...porBarbero.values()].sort((a, b) => b.total_comision - a.total_comision);
}

// ---------------------------------------------------------------------------
// CU-014 — Exportar. Seis tipos de reporte, cada uno sobre la vista SQL que
// ya trae el agregado resuelto; aca solo se define que columnas mostrar y
// como filtrar por rango de fechas y busqueda antes de exportar.
// ---------------------------------------------------------------------------

export const TIPOS_REPORTE = [
  'clientes',
  'proveedores',
  'cobros',
  'inventario',
  'comisiones',
  'inactivos',
  'cumpleanos',
  'general',
  'barberos',
  'servicios',
  'usuarios',
  'agenda',
  'compras',
  'auditoria',
  'ranking',
  'facturas',
] as const;
export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export const TITULOS_TIPO_REPORTE: Record<TipoReporte, string> = {
  clientes: 'Reporte de clientes',
  proveedores: 'Reporte de proveedores',
  cobros: 'Reporte de cobros',
  inventario: 'Reporte de inventario',
  comisiones: 'Reporte de comisiones',
  inactivos: 'Clientes inactivos (fidelización)',
  cumpleanos: 'Cumpleaños del mes',
  general: 'Reporte general (KPIs mensuales)',
  barberos: 'Reporte de barberos',
  servicios: 'Reporte de servicios',
  usuarios: 'Reporte de usuarios',
  agenda: 'Reporte de agenda',
  compras: 'Reporte de órdenes de compra',
  auditoria: 'Reporte de auditoría',
  ranking: 'Reporte de ranking de barberos',
  facturas: 'Reporte de facturas',
};

export interface FiltroReporte {
  desde?: string;
  hasta?: string;
  busqueda?: string;
}

interface ColumnaDef {
  clave: string;
  titulo: string;
  /** Ancho de columna en Excel (caracteres). */
  anchoExcel?: number;
  /** Ancho relativo en el PDF: dos columnas con 2 y 1 quedan en proporcion 2 a 1. */
  pesoPdf?: number;
  tipo?: 'texto' | 'numero' | 'moneda' | 'fecha';
}

interface DatosReporte {
  titulo: string;
  columnas: ColumnaDef[];
  filas: Array<Record<string, unknown>>;
}

async function datosReporte(tipo: TipoReporte, filtro: FiltroReporte): Promise<DatosReporte> {
  const supabase = await clienteServidor();
  const titulo = TITULOS_TIPO_REPORTE[tipo];

  switch (tipo) {
    case 'clientes': {
      let consulta = supabase.from('v_clientes_resumen').select('*').order('total_gastado', {
        ascending: false,
      });
      if (filtro.busqueda) consulta = consulta.ilike('nombre', `%${filtro.busqueda}%`);
      if (filtro.desde) consulta = consulta.gte('ultima_visita', `${filtro.desde}T00:00:00`);
      if (filtro.hasta) consulta = consulta.lte('ultima_visita', `${filtro.hasta}T23:59:59`);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Cliente', anchoExcel: 28, pesoPdf: 2.2 },
          { clave: 'telefono', titulo: 'Telefono', anchoExcel: 16, pesoPdf: 1.3 },
          { clave: 'cantidad_visitas', titulo: 'Visitas', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'total_gastado', titulo: 'Total gastado', anchoExcel: 16, pesoPdf: 1.3, tipo: 'moneda' },
          { clave: 'ticket_promedio', titulo: 'Ticket promedio', anchoExcel: 16, pesoPdf: 1.3, tipo: 'moneda' },
          { clave: 'ultima_visita', titulo: 'Ultima visita', anchoExcel: 14, pesoPdf: 1.1, tipo: 'fecha' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'proveedores': {
      let consulta = supabase.from('v_compras_por_proveedor').select('*').order('total_comprado', {
        ascending: false,
      });
      if (filtro.busqueda) consulta = consulta.ilike('nombre', `%${filtro.busqueda}%`);
      if (filtro.desde) consulta = consulta.gte('ultimo_pedido', `${filtro.desde}T00:00:00`);
      if (filtro.hasta) consulta = consulta.lte('ultimo_pedido', `${filtro.hasta}T23:59:59`);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Proveedor', anchoExcel: 28, pesoPdf: 2 },
          { clave: 'pedidos', titulo: 'Pedidos', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'recibidos', titulo: 'Recibidos', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'cancelados', titulo: 'Cancelados', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'total_comprado', titulo: 'Total comprado', anchoExcel: 16, pesoPdf: 1.3, tipo: 'moneda' },
          { clave: 'ultimo_pedido', titulo: 'Ultimo pedido', anchoExcel: 14, pesoPdf: 1.1, tipo: 'fecha' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'cobros': {
      let consulta = supabase.from('v_cobros_detalle').select('*').order('fecha_pago', {
        ascending: false,
      });
      if (filtro.busqueda) consulta = consulta.ilike('nombre_cliente', `%${filtro.busqueda}%`);
      if (filtro.desde) consulta = consulta.gte('fecha_pago', `${filtro.desde}T00:00:00`);
      if (filtro.hasta) consulta = consulta.lte('fecha_pago', `${filtro.hasta}T23:59:59`);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'nombre_cliente', titulo: 'Cliente', anchoExcel: 26, pesoPdf: 1.8 },
          { clave: 'metodo_pago', titulo: 'Metodo', anchoExcel: 16, pesoPdf: 1.1 },
          { clave: 'monto', titulo: 'Monto', anchoExcel: 14, pesoPdf: 1, tipo: 'moneda' },
          { clave: 'saldo', titulo: 'Saldo', anchoExcel: 14, pesoPdf: 1, tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', anchoExcel: 12, pesoPdf: 0.9 },
          { clave: 'fecha_pago', titulo: 'Fecha de pago', anchoExcel: 14, pesoPdf: 1.1, tipo: 'fecha' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'inventario': {
      let consulta = supabase.from('v_inventario_valorizado').select('*').order('valor_stock', {
        ascending: false,
      });
      if (filtro.busqueda) consulta = consulta.ilike('nombre', `%${filtro.busqueda}%`);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Producto', anchoExcel: 26, pesoPdf: 2 },
          { clave: 'categoria', titulo: 'Categoria', anchoExcel: 18, pesoPdf: 1.3 },
          { clave: 'stock_actual', titulo: 'Stock', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'nivel', titulo: 'Nivel', anchoExcel: 12, pesoPdf: 1 },
          { clave: 'precio_unitario', titulo: 'Precio unit.', anchoExcel: 14, pesoPdf: 1.1, tipo: 'moneda' },
          { clave: 'valor_stock', titulo: 'Valor en stock', anchoExcel: 16, pesoPdf: 1.2, tipo: 'moneda' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'comisiones': {
      let consulta = supabase.from('v_comisiones_liquidadas').select('*').order('fecha_realizacion', {
        ascending: false,
      });
      if (filtro.busqueda) consulta = consulta.ilike('nombre_profesional', `%${filtro.busqueda}%`);
      if (filtro.desde) consulta = consulta.gte('fecha_realizacion', `${filtro.desde}T00:00:00`);
      if (filtro.hasta) consulta = consulta.lte('fecha_realizacion', `${filtro.hasta}T23:59:59`);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'nombre_profesional', titulo: 'Barbero', anchoExcel: 22, pesoPdf: 1.6 },
          { clave: 'nombre_servicio', titulo: 'Servicio', anchoExcel: 22, pesoPdf: 1.6 },
          { clave: 'fecha_realizacion', titulo: 'Fecha', anchoExcel: 14, pesoPdf: 1, tipo: 'fecha' },
          { clave: 'costo_cobrado', titulo: 'Costo', anchoExcel: 14, pesoPdf: 1, tipo: 'moneda' },
          { clave: 'comision', titulo: 'Comision', anchoExcel: 14, pesoPdf: 1, tipo: 'moneda' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'inactivos': {
      let consulta = supabase.from('v_clientes_inactivos').select('*').order('dias_sin_venir', {
        ascending: false,
      });
      if (filtro.busqueda) consulta = consulta.ilike('nombre', `%${filtro.busqueda}%`);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Cliente', anchoExcel: 26, pesoPdf: 1.8 },
          { clave: 'telefono', titulo: 'Teléfono', anchoExcel: 16, pesoPdf: 1.1 },
          { clave: 'cantidad_visitas', titulo: 'Visitas', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'total_gastado', titulo: 'Total gastado', anchoExcel: 16, pesoPdf: 1.2, tipo: 'moneda' },
          { clave: 'ultima_visita', titulo: 'Última visita', anchoExcel: 14, pesoPdf: 1, tipo: 'fecha' },
          { clave: 'dias_sin_venir', titulo: 'Días sin venir', anchoExcel: 14, pesoPdf: 1, tipo: 'numero' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'cumpleanos': {
      let consulta = supabase.from('v_cumpleanos_del_mes').select('*').order('dia', { ascending: true });
      if (filtro.busqueda) consulta = consulta.ilike('nombre', `%${filtro.busqueda}%`);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Cliente', anchoExcel: 26, pesoPdf: 1.8 },
          { clave: 'telefono', titulo: 'Teléfono', anchoExcel: 16, pesoPdf: 1.1 },
          { clave: 'dia', titulo: 'Día', anchoExcel: 8, pesoPdf: 0.6, tipo: 'numero' },
          { clave: 'edad', titulo: 'Edad', anchoExcel: 8, pesoPdf: 0.6, tipo: 'numero' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'general': {
      let consulta = supabase.from('v_resumen_mensual').select('*').order('mes', { ascending: false });
      if (filtro.desde) consulta = consulta.gte('mes', filtro.desde);
      if (filtro.hasta) consulta = consulta.lte('mes', filtro.hasta);

      const { data, error } = await consulta;
      if (error) throw traducirError(error);

      return {
        titulo,
        columnas: [
          { clave: 'mes', titulo: 'Mes', anchoExcel: 14, pesoPdf: 1, tipo: 'fecha' },
          { clave: 'turnos', titulo: 'Turnos', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'completados', titulo: 'Completados', anchoExcel: 12, pesoPdf: 0.9, tipo: 'numero' },
          { clave: 'cancelados', titulo: 'Cancelados', anchoExcel: 12, pesoPdf: 0.9, tipo: 'numero' },
          { clave: 'clientes_atendidos', titulo: 'Clientes', anchoExcel: 12, pesoPdf: 0.9, tipo: 'numero' },
          { clave: 'ingresos', titulo: 'Ingresos', anchoExcel: 16, pesoPdf: 1.2, tipo: 'moneda' },
          { clave: 'comisiones', titulo: 'Comisiones', anchoExcel: 16, pesoPdf: 1.2, tipo: 'moneda' },
        ],
        filas: (data ?? []) as unknown as Array<Record<string, unknown>>,
      };
    }

    case 'barberos': {
      const filas = await listarProfesionales({
        busqueda: filtro.busqueda,
        desde: filtro.desde,
        hasta: filtro.hasta,
      });

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Barbero', anchoExcel: 24, pesoPdf: 1.8 },
          { clave: 'especialidad', titulo: 'Especialidad', anchoExcel: 22, pesoPdf: 1.6 },
          { clave: 'tipo', titulo: 'Tipo', anchoExcel: 16, pesoPdf: 1.1 },
          { clave: 'porcentaje_com', titulo: 'Comisión %', anchoExcel: 12, pesoPdf: 0.9, tipo: 'numero' },
          { clave: 'estado_texto', titulo: 'Estado', anchoExcel: 12, pesoPdf: 0.9 },
        ],
        filas: filas.map((p) => ({
          nombre: p.nombre,
          especialidad: p.especialidad,
          tipo: p.tipo,
          porcentaje_com: p.porcentaje_com,
          estado_texto: p.estado ? 'Activo' : 'Inactivo',
        })),
      };
    }

    case 'servicios': {
      const filas = await listarServicios({
        busqueda: filtro.busqueda,
        desde: filtro.desde,
        hasta: filtro.hasta,
      });

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Servicio', anchoExcel: 26, pesoPdf: 2 },
          { clave: 'descripcion', titulo: 'Descripción', anchoExcel: 30, pesoPdf: 2.2 },
          { clave: 'duracion_min', titulo: 'Duración (min)', anchoExcel: 12, pesoPdf: 1, tipo: 'numero' },
          { clave: 'precio_base', titulo: 'Precio base', anchoExcel: 14, pesoPdf: 1.1, tipo: 'moneda' },
          { clave: 'estado_texto', titulo: 'Estado', anchoExcel: 12, pesoPdf: 0.9 },
        ],
        filas: filas.map((s) => ({
          nombre: s.nombre,
          descripcion: s.descripcion,
          duracion_min: s.duracion_min,
          precio_base: s.precio_base,
          estado_texto: s.estado ? 'Activo' : 'Inactivo',
        })),
      };
    }

    case 'usuarios': {
      const filas = await listarUsuarios({
        busqueda: filtro.busqueda,
        desde: filtro.desde,
        hasta: filtro.hasta,
      });

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Usuario', anchoExcel: 24, pesoPdf: 1.8 },
          { clave: 'email', titulo: 'Correo', anchoExcel: 26, pesoPdf: 2 },
          { clave: 'rol', titulo: 'Rol', anchoExcel: 16, pesoPdf: 1.2 },
          { clave: 'estado_texto', titulo: 'Estado', anchoExcel: 12, pesoPdf: 0.9 },
          { clave: 'created_at', titulo: 'Alta', anchoExcel: 14, pesoPdf: 1.1, tipo: 'fecha' },
        ],
        filas: filas.map((u) => ({
          nombre: u.nombre,
          email: u.email,
          rol: u.rol,
          estado_texto: u.estado ? 'Activo' : 'Inactivo',
          created_at: u.created_at,
        })),
      };
    }

    case 'agenda': {
      // listarAgenda exige un rango: sin filtro propio, se exporta el mes en curso.
      const hoy = new Date();
      const desde =
        filtro.desde ?? `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
      const hasta = filtro.hasta ?? hoy.toISOString().slice(0, 10);

      const filas = await listarAgenda({ desde, hasta, busqueda: filtro.busqueda });

      return {
        titulo,
        columnas: [
          { clave: 'fecha_hora', titulo: 'Fecha y hora', anchoExcel: 18, pesoPdf: 1.3, tipo: 'fecha' },
          { clave: 'nombre_cliente', titulo: 'Cliente', anchoExcel: 22, pesoPdf: 1.6 },
          { clave: 'servicios_texto', titulo: 'Servicios', anchoExcel: 26, pesoPdf: 2 },
          { clave: 'barberos_texto', titulo: 'Barbero', anchoExcel: 20, pesoPdf: 1.5 },
          { clave: 'total', titulo: 'Total', anchoExcel: 14, pesoPdf: 1, tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', anchoExcel: 12, pesoPdf: 0.9 },
        ],
        filas: filas.map((c) => ({
          fecha_hora: c.fecha_hora,
          nombre_cliente: c.cliente.nombre,
          servicios_texto: c.servicios.map((s) => s.servicio.nombre).join(', '),
          barberos_texto: [...new Set(c.servicios.map((s) => s.profesional.nombre))].join(', '),
          total: c.total,
          estado: c.estado,
        })),
      };
    }

    case 'compras': {
      const filas = await listarPedidos({
        busqueda: filtro.busqueda,
        desde: filtro.desde,
        hasta: filtro.hasta,
      });

      return {
        titulo,
        columnas: [
          { clave: 'nombre_proveedor', titulo: 'Proveedor', anchoExcel: 26, pesoPdf: 2 },
          { clave: 'fecha_pedido', titulo: 'Fecha de pedido', anchoExcel: 16, pesoPdf: 1.2, tipo: 'fecha' },
          { clave: 'cantidad_items', titulo: 'Ítems', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'estado', titulo: 'Estado', anchoExcel: 14, pesoPdf: 1 },
          { clave: 'total', titulo: 'Total', anchoExcel: 14, pesoPdf: 1.1, tipo: 'moneda' },
        ],
        filas: filas.map((p) => ({
          nombre_proveedor: p.nombre_proveedor,
          fecha_pedido: p.fecha_pedido,
          cantidad_items: p.cantidad_items,
          estado: p.estado,
          total: p.total,
        })),
      };
    }

    case 'auditoria': {
      const filas = await listarAuditoria({
        busqueda: filtro.busqueda,
        desde: filtro.desde,
        hasta: filtro.hasta,
      });

      return {
        titulo,
        columnas: [
          { clave: 'fecha_accion', titulo: 'Fecha', anchoExcel: 16, pesoPdf: 1.2, tipo: 'fecha' },
          { clave: 'nombre_usuario', titulo: 'Usuario', anchoExcel: 22, pesoPdf: 1.6 },
          { clave: 'tabla_afectada', titulo: 'Tabla', anchoExcel: 16, pesoPdf: 1.2 },
          { clave: 'accion', titulo: 'Acción', anchoExcel: 12, pesoPdf: 0.9 },
          { clave: 'detalle', titulo: 'Detalle', anchoExcel: 30, pesoPdf: 2.2 },
        ],
        filas: filas.map((a) => ({
          fecha_accion: a.fecha_accion,
          nombre_usuario: a.nombre_usuario ?? '—',
          tabla_afectada: a.tabla_afectada,
          accion: a.accion,
          detalle: a.detalle,
        })),
      };
    }

    case 'ranking': {
      const filas = await rankingBarberos({ desde: filtro.desde, hasta: filtro.hasta });

      return {
        titulo,
        columnas: [
          { clave: 'nombre', titulo: 'Barbero', anchoExcel: 22, pesoPdf: 1.6 },
          { clave: 'serviciosRealizados', titulo: 'Servicios', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'clientesDistintos', titulo: 'Clientes', anchoExcel: 10, pesoPdf: 0.8, tipo: 'numero' },
          { clave: 'facturado', titulo: 'Facturado', anchoExcel: 16, pesoPdf: 1.2, tipo: 'moneda' },
          { clave: 'ticketPromedio', titulo: 'Ticket promedio', anchoExcel: 16, pesoPdf: 1.2, tipo: 'moneda' },
        ],
        filas: filas.map((f) => ({
          nombre: f.nombre,
          serviciosRealizados: f.serviciosRealizados,
          clientesDistintos: f.clientesDistintos,
          facturado: f.facturado,
          ticketPromedio: f.ticketPromedio,
        })),
      };
    }

    case 'facturas': {
      const filas = await listarFacturas({
        busqueda: filtro.busqueda,
        desde: filtro.desde,
        hasta: filtro.hasta,
      });

      return {
        titulo,
        columnas: [
          { clave: 'id_factura', titulo: 'N.°', anchoExcel: 10, pesoPdf: 0.7, tipo: 'numero' },
          { clave: 'nombre_cliente', titulo: 'Cliente', anchoExcel: 24, pesoPdf: 1.8 },
          { clave: 'fecha_emision', titulo: 'Emisión', anchoExcel: 16, pesoPdf: 1.2, tipo: 'fecha' },
          { clave: 'total', titulo: 'Total', anchoExcel: 14, pesoPdf: 1.1, tipo: 'moneda' },
          { clave: 'estado', titulo: 'Estado', anchoExcel: 12, pesoPdf: 0.9 },
        ],
        filas: filas.map((f) => ({
          id_factura: f.id_factura,
          nombre_cliente: f.nombre_cliente,
          fecha_emision: f.fecha_emision,
          total: f.total,
          estado: f.estado,
        })),
      };
    }

    default: {
      const exhaustivo: never = tipo;
      throw new ErrorAplicacion(`Tipo de reporte desconocido: ${exhaustivo}`);
    }
  }
}

function formatearValor(valor: unknown, tipo?: ColumnaDef['tipo']): string {
  if (valor === null || valor === undefined || valor === '') return '—';
  if (tipo === 'moneda' || tipo === 'numero') {
    const n = Number(valor);
    return Number.isFinite(n) ? n.toLocaleString('es-PY') : String(valor);
  }
  if (tipo === 'fecha') {
    const d = new Date(valor as string);
    return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleDateString('es-PY');
  }
  return String(valor);
}

function subtituloPeriodo(filtro: FiltroReporte): string {
  const generado = `Generado el ${new Date().toLocaleDateString('es-PY')}`;
  if (!filtro.desde && !filtro.hasta) return generado;
  return `${generado} · Periodo: ${filtro.desde ?? 'inicio'} a ${filtro.hasta ?? 'hoy'}`;
}

/** Lo que necesita la pantalla para pintar una tabla generica de cualquier tipo de reporte. */
export interface PrevisualizacionReporte {
  titulo: string;
  columnas: Array<{ clave: string; titulo: string; numerico: boolean }>;
  filas: Array<Record<string, string>>;
}

/**
 * Vista previa en pantalla, antes de exportar. Mismos datos que
 * `exportarReportePdf`, ya en texto.
 *
 * En modo demostracion devuelve la tabla vacia sin tocar `clienteServidor()`:
 * a diferencia de los cuatro reportes originales, estos seis tipos no tienen
 * un arreglo ficticio propio, y sin esta salida la pantalla intentaria abrir
 * una conexion real que en modo demostracion no existe.
 */
export async function previsualizarReporte(
  tipo: TipoReporte,
  filtro: FiltroReporte = {},
): Promise<PrevisualizacionReporte> {
  if (MODO_DEMO) return { titulo: TITULOS_TIPO_REPORTE[tipo], columnas: [], filas: [] };

  const { titulo, columnas, filas } = await datosReporte(tipo, filtro);

  return {
    titulo,
    columnas: columnas.map((c) => ({
      clave: c.clave,
      titulo: c.titulo,
      numerico: c.tipo === 'numero' || c.tipo === 'moneda',
    })),
    filas: filas
      .slice(0, 50)
      .map((fila) => Object.fromEntries(columnas.map((c) => [c.clave, formatearValor(fila[c.clave], c.tipo)]))),
  };
}

/** Exporta un reporte a `.xlsx`. `rechazarSiEsDemo` no aplica: exportar es lectura, no escritura. */
export async function exportarReporteExcel(tipo: TipoReporte, filtro: FiltroReporte = {}): Promise<Buffer> {
  if (MODO_DEMO) {
    throw new ErrorAplicacion('El modo demostracion no puede exportar: no hay datos reales que exportar.');
  }

  const { titulo, columnas, filas } = await datosReporte(tipo, filtro);

  return generarExcel(
    titulo,
    columnas.map((c) => ({ clave: c.clave, titulo: c.titulo, ancho: c.anchoExcel, formato: c.tipo })),
    filas,
  );
}

/** Exporta un reporte a PDF. */
export async function exportarReportePdf(tipo: TipoReporte, filtro: FiltroReporte = {}): Promise<Buffer> {
  if (MODO_DEMO) {
    throw new ErrorAplicacion('El modo demostracion no puede exportar: no hay datos reales que exportar.');
  }

  const { titulo, columnas, filas } = await datosReporte(tipo, filtro);

  const filasTexto = filas.map((fila) =>
    Object.fromEntries(columnas.map((c) => [c.clave, formatearValor(fila[c.clave], c.tipo)])),
  );

  return generarPdfTabla(
    titulo,
    subtituloPeriodo(filtro),
    columnas.map((c) => ({ clave: c.clave, titulo: c.titulo, ancho: c.pesoPdf })),
    filasTexto,
  );
}
