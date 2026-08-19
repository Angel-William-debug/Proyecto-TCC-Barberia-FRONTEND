import type { Cliente, FiltroListado, Pagina, VistaHistorialCliente } from '@barber-shop/tipos';

import { CLIENTES_DEMO } from '../demo/datos-catalogo';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, entreFechas, paginar } from '../compartido/filtros';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { uno } from '../compartido/relaciones';

const POR_PAGINA = 25;

/**
 * Listado paginado de clientes (CU-002).
 *
 * La busqueda cubre nombre, telefono y correo, que es como el recepcionista
 * busca en la practica: con lo que el cliente dice por telefono.
 */
export interface FiltroClientes extends FiltroListado {
  /** `activo` e `inactivo`. Vacío significa ambos. */
  estados?: string[];
  /** Rango sobre `fecha_registro`, aaaa-MM-dd. */
  desde?: string;
  hasta?: string;
}

export async function listarClientes(filtro: FiltroClientes = {}): Promise<Pagina<Cliente>> {
  const pagina = Math.max(1, filtro.pagina ?? 1);
  const porPagina = filtro.porPagina ?? POR_PAGINA;
  const desde = (pagina - 1) * porPagina;

  const activo = (e: boolean) => (e ? 'activo' : 'inactivo');

  if (MODO_DEMO) {
    const filtrados = CLIENTES_DEMO.filter(
      (c) =>
        coincideTexto([c.nombre, c.telefono, c.email], filtro.busqueda) &&
        coincideEstado(activo(c.estado), filtro.estados) &&
        entreFechas(c.fecha_registro, filtro.desde, filtro.hasta),
    );

    return paginar(filtrados, pagina, porPagina);
  }

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('clientes')
    .select('*', { count: 'exact' })
    // Lo borrado logicamente no existe para la aplicacion.
    .eq('deleted', false)
    .order('nombre', { ascending: true })
    .range(desde, desde + porPagina - 1);

  if (filtro.estados?.length === 1) {
    consulta = consulta.eq('estado', filtro.estados[0] === 'activo');
  } else if (!filtro.estados?.length && filtro.soloActivos !== false) {
    consulta = consulta.eq('estado', true);
  }

  if (filtro.desde) consulta = consulta.gte('fecha_registro', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_registro', `${filtro.hasta}T23:59:59`);

  if (filtro.busqueda?.trim()) {
    const t = filtro.busqueda.trim();
    // `%` alrededor y `ilike` para que no distinga mayusculas ni acentos
    // iniciales. `or` con comas: la sintaxis de PostgREST.
    consulta = consulta.or(`nombre.ilike.%${t}%,telefono.ilike.%${t}%,email.ilike.%${t}%`);
  }

  const { data, error, count } = await consulta;
  if (error) throw traducirError(error);

  const total = count ?? 0;

  return {
    datos: (data ?? []) as Cliente[],
    total,
    pagina,
    porPagina,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export async function obtenerCliente(idCliente: number): Promise<Cliente | null> {
  if (MODO_DEMO) {
    return CLIENTES_DEMO.find((c) => c.id_cliente === idCliente) ?? null;
  }

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('id_cliente', idCliente)
    .eq('deleted', false)
    .maybeSingle();

  if (error) throw traducirError(error);
  return (data as Cliente | null) ?? null;
}



/**
 * Historial completo de un cliente (CU-012).
 *
 * Se consulta `historial_servicio` directamente y no la vista
 * `v_historial_completo_cliente`: esa vista no expone `id_cliente` -solo el
 * nombre-, asi que no se puede filtrar por cliente sin arriesgar una
 * coincidencia de nombre entre dos personas distintas.
 */
export async function listarHistorialCliente(
  idCliente: number,
): Promise<Array<Omit<VistaHistorialCliente, 'id_cliente' | 'nombre_cliente'>>> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('historial_servicio')
    .select('fecha_realizacion, costo_cobrado, servicios ( nombre ), profesionales ( nombre )')
    .eq('id_cliente', idCliente)
    .order('fecha_realizacion', { ascending: false });

  if (error) throw traducirError(error);

  return (data ?? []).map((f) => ({
    fecha_realizacion: f.fecha_realizacion,
    nombre_servicio: uno<{ nombre: string }>(f.servicios)?.nombre ?? '—',
    nombre_profesional: uno<{ nombre: string }>(f.profesionales)?.nombre ?? '—',
    costo_cobrado: f.costo_cobrado,
  }));
}

/**
 * Desactivar NO es lo mismo que borrar.
 *
 * Un cliente desactivado sigue existiendo y se lo puede reactivar: es el que
 * dejo de venir, o el que pidio no recibir mas recordatorios. Es un estado de
 * negocio (CU-002 A3), no una baja.
 */
export async function desactivarCliente(idCliente: number): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { error } = await supabase
    .from('clientes')
    .update({ estado: false })
    .eq('id_cliente', idCliente);

  if (error) throw traducirError(error);
}

/*
 * El alta, la edicion, el borrado logico y la restauracion NO viven aca.
 *
 * Los hace la capa generica de `compartido/escritura.ts`, que es identica para
 * las ocho tablas escribibles y ademas rechaza la escritura en modo
 * demostracion. Habia cuatro copias especificas de cliente que hacian lo mismo
 * sin ese guardia; se eliminaron.
 *
 * `desactivarCliente` se queda porque NO es lo mismo: desactivar es un estado
 * de negocio (CU-002 A3) y borrar es una baja.
 */
