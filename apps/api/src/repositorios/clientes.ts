import type { Cliente, FiltroListado, NuevoCliente, Pagina } from '@barber-shop/tipos';

import { CLIENTES_DEMO } from '../demo/datos';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, entreFechas, paginar } from './filtros';

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
    .maybeSingle();

  if (error) throw traducirError(error);
  return (data as Cliente | null) ?? null;
}

export async function crearCliente(entrada: NuevoCliente): Promise<Cliente> {
  const supabase = await clienteServidor();

  const { data, error } = await supabase.from('clientes').insert(entrada).select().single();

  if (error) throw traducirError(error);
  return data as Cliente;
}

export async function actualizarCliente(
  idCliente: number,
  cambios: Partial<NuevoCliente>,
): Promise<Cliente> {
  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('clientes')
    .update(cambios)
    .eq('id_cliente', idCliente)
    .select()
    .single();

  if (error) throw traducirError(error);
  return data as Cliente;
}

/**
 * Baja logica (CU-002 A3).
 *
 * Nunca se borra un cliente: su historial de servicios y sus cobros lo
 * referencian, y ademas se perderia la base sobre la que el motor de
 * recomendaciones aprende. Se marca `estado = false` y deja de aparecer en
 * los listados.
 */
export async function desactivarCliente(idCliente: number): Promise<void> {
  const supabase = await clienteServidor();

  const { error } = await supabase
    .from('clientes')
    .update({ estado: false })
    .eq('id_cliente', idCliente);

  if (error) throw traducirError(error);
}
