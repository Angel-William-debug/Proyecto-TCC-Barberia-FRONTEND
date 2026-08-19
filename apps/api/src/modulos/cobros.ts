/**
 * Cobros a clientes (CU-008).
 *
 * Devuelve las filas ya resueltas con sus nombres: la base guarda claves
 * foraneas, pero la tabla necesita mostrar «Marcos Ayala», no «2». El join se
 * hace en una sola consulta anidada de PostgREST para evitar el N+1.
 */

import type { CobroDeLista, EntradaNuevoCobro, VistaCobroPendiente } from '@barber-shop/tipos';

import { COBROS_DEMO } from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { uno } from '../compartido/relaciones';

export interface FiltroCobros extends FiltroTabla {
  /** Nombre del método de pago. */
  metodo?: string;
}

export async function listarCobros(filtro: FiltroCobros = {}): Promise<CobroDeLista[]> {
  if (MODO_DEMO) {
    return COBROS_DEMO.filter(
      (c) =>
        coincideTexto([c.nombre_cliente], filtro.busqueda) &&
        coincideEstado(c.estado, filtro.estados) &&
        (!filtro.metodo || c.metodo_pago === filtro.metodo) &&
        entreFechas(c.fecha_pago, filtro.desde, filtro.hasta),
    );
  }

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('cobros_cliente')
    .select(
      `id_cobro, id_cita, monto, estado, fecha_pago,
       metodos_pago ( nombre ),
       citas ( clientes ( nombre ) )`,
    )
    .eq('deleted', false)
    .order('fecha_pago', { ascending: false, nullsFirst: false })
    .limit(200);

  if (filtro.estados?.length) consulta = consulta.in('estado', filtro.estados);
  if (filtro.desde) consulta = consulta.gte('fecha_pago', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_pago', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  const filas = (data ?? []).map((f) => {
    const cita = uno<{ clientes: unknown }>(f.citas);
    const cliente = uno<{ nombre: string }>(cita?.clientes);
    const metodo = uno<{ nombre: string }>(f.metodos_pago);

    return {
      id_cobro: f.id_cobro,
      id_cita: f.id_cita,
      nombre_cliente: cliente?.nombre ?? 'Cliente eliminado',
      metodo_pago: metodo?.nombre ?? '—',
      monto: f.monto,
      estado: f.estado,
      fecha_pago: f.fecha_pago,
    } satisfies CobroDeLista;
  });

  // El nombre del cliente y el método viven en tablas anidadas; PostgREST no
  // filtra por ellos con `ilike` sin recurrir a una vista. Se resuelve aquí,
  // sobre las 200 filas ya traídas.
  return filas.filter(
    (c) =>
      coincideTexto([c.nombre_cliente], filtro.busqueda) &&
      (!filtro.metodo || c.metodo_pago === filtro.metodo),
  );
}

/**
 * Turnos completados con saldo pendiente, para el selector del formulario de
 * cobro. Lee `v_cobros_pendientes`, que ya calcula lo cobrado y el saldo
 * restante (RN-024, RN-025) en la base en lugar de traer todos los cobros al
 * cliente para sumarlos aquí.
 */
export async function listarCitasPendientesDeCobro(): Promise<VistaCobroPendiente[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('v_cobros_pendientes')
    .select('*')
    .order('fecha_hora', { ascending: true });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaCobroPendiente[];
}

/**
 * Alta de un cobro (CU-008).
 *
 * `fecha_pago` se fija al momento del registro: el cobro se cierra en el
 * mostrador, no se agenda para despues. La base valida sola que la cita este
 * completada (RN-024) y que la suma de cobros no supere el total (RN-025);
 * duplicar esa cuenta aqui solo arriesgaria que las dos versiones difieran.
 */
export async function crearCobro(entrada: EntradaNuevoCobro): Promise<number> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('cobros_cliente')
    .insert({
      id_cita: entrada.idCita,
      id_metodo_pago: entrada.idMetodoPago,
      monto: entrada.monto,
      estado: entrada.esParcial ? 'parcial' : 'pagado',
      fecha_pago: new Date().toISOString(),
      comprobante_url: entrada.comprobanteUrl ?? null,
    })
    .select('id_cobro')
    .single();

  if (error) throw traducirError(error);
  return (data as { id_cobro: number }).id_cobro;
}
