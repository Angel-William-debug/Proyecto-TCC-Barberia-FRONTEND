/**
 * Configuracion del establecimiento (CU-020).
 *
 * Reune las tres cosas que se ven en esa pantalla: los datos de la barberia,
 * el horario de atencion y los metodos de pago habilitados. Son tres tablas
 * distintas de la base, pero una sola pantalla y un solo caso de uso.
 *
 * La tabla de configuracion tiene UNA fila y su clave primaria es literalmente
 * 1: un CHECK de la base lo impone. Por eso se actualiza, nunca se inserta.
 */

import type { HorarioAtencion, MetodoPago } from '@barber-shop/tipos';

import { CONFIGURACION_DEMO, METODOS_PAGO_DEMO } from '../demo/datos-catalogo';
import { HORARIOS_DEMO } from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { rechazarSiEsDemo } from '../compartido/escritura';

export async function listarMetodosPago(): Promise<MetodoPago[]> {
  if (MODO_DEMO) return METODOS_PAGO_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('metodos_pago')
    .select('*')
    .eq('deleted', false)
    .eq('estado', true)
    .order('id_metodo');

  if (error) throw traducirError(error);
  return (data ?? []) as MetodoPago[];
}

/** Configuracion general del establecimiento (CU-020). Fila unica. */
export async function obtenerConfiguracion() {
  if (MODO_DEMO) return CONFIGURACION_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('configuracion_sistema')
    .select('*')
    .eq('id_configuracion', 1)
    .maybeSingle();

  if (error) throw traducirError(error);
  return data;
}

export async function listarHorarios(): Promise<HorarioAtencion[]> {
  if (MODO_DEMO) return HORARIOS_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('horarios_atencion')
    .select('*')
    .eq('deleted', false)
    .order('dia_semana');

  if (error) throw traducirError(error);
  return (data ?? []) as HorarioAtencion[];
}

/** Campos editables de la configuracion. El resto los fija la instalacion. */
export interface EntradaConfiguracion {
  nombre_barberia: string;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  moneda: string;
  zona_horaria: string;
  minutos_antes_recordatorio: number;
  max_reintentos_notif: number;
}

/**
 * La tabla tiene una sola fila y su clave primaria es literalmente 1: un
 * CHECK de la base lo impone. Por eso esto es un `update`, nunca un `insert`.
 */
export async function actualizarConfiguracion(datos: EntradaConfiguracion): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();
  const { error } = await supabase
    .from('configuracion_sistema')
    .update(datos)
    .eq('id_configuracion', 1);

  if (error) throw traducirError(error);
}
