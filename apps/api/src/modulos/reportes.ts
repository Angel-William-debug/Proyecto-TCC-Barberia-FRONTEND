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
import { generarExcel } from '../compartido/exportacion/excel';
import { generarPdfTabla } from '../compartido/exportacion/pdf';

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

  const { data, error } = await supabase.from('v_stock_critico').select('*');

  if (error) throw traducirError(error);
  return (data ?? []) as VistaStockCritico[];
}

/**
 * Comisiones pendientes por barbero.
 *
 * Solo el administrador puede leer esta vista: `pagos_profesional` es una
 * tabla de su exclusividad segun las politicas RLS. Un barbero que consulte
 * su propio panel obtiene sus comisiones por otra via, filtrada por su
 * `id_profesional`.
 */
export async function comisionesPendientes(): Promise<VistaComisionPendiente[]> {
  if (MODO_DEMO) return COMISIONES_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('v_comisiones_pendientes')
    .select('*')
    .order('total_comision', { ascending: false });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaComisionPendiente[];
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
  'general',
] as const;
export type TipoReporte = (typeof TIPOS_REPORTE)[number];

export const TITULOS_TIPO_REPORTE: Record<TipoReporte, string> = {
  clientes: 'Reporte de clientes',
  proveedores: 'Reporte de proveedores',
  cobros: 'Reporte de cobros',
  inventario: 'Reporte de inventario',
  comisiones: 'Reporte de comisiones',
  general: 'Reporte general (KPIs mensuales)',
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
