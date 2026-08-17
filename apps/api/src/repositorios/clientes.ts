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
 * Desactivar NO es lo mismo que borrar.
 *
 * Un cliente desactivado sigue existiendo y se lo puede reactivar: es el que
 * dejo de venir, o el que pidio no recibir mas recordatorios. Es un estado de
 * negocio (CU-002 A3), no una baja.
 */
export async function desactivarCliente(idCliente: number): Promise<void> {
  const supabase = await clienteServidor();

  const { error } = await supabase
    .from('clientes')
    .update({ estado: false })
    .eq('id_cliente', idCliente);

  if (error) throw traducirError(error);
}

/**
 * Borrado logico: el registro deja de existir para la aplicacion.
 *
 * Se usa para la ficha cargada por error o duplicada. Nunca se borra de
 * verdad: el historial de servicios y los cobros lo referencian, y ademas se
 * perderia la base sobre la que el motor de recomendaciones aprende.
 *
 * `deleted_at` lo completa el disparador de la base; aqui solo se marca la
 * bandera y se deja constancia de quien lo hizo.
 */
export async function borrarCliente(idCliente: number, idUsuario: number): Promise<void> {
  const supabase = await clienteServidor();

  const { error } = await supabase
    .from('clientes')
    .update({ deleted: true, deleted_user_id: idUsuario })
    .eq('id_cliente', idCliente);

  if (error) throw traducirError(error);
}

/**
 * Restaura un cliente borrado.
 *
 * PUEDE FALLAR, y el fallo es correcto: si mientras estuvo borrado otro
 * cliente tomo su correo, restaurarlo dejaria dos vigentes con la misma
 * direccion y el indice unico parcial lo rechaza. `traducirError` convierte
 * ese rechazo en un mensaje que explica que paso.
 */
export async function restaurarCliente(idCliente: number): Promise<void> {
  const supabase = await clienteServidor();

  const { error } = await supabase
    .from('clientes')
    .update({ deleted: false })
    .eq('id_cliente', idCliente);

  if (error) throw traducirError(error);
}
