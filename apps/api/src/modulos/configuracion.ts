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

/**
 * Todos los metodos de pago, habilitados o no.
 *
 * `listarMetodosPago` filtra por `estado = true` porque quien cobra un turno
 * solo puede elegir entre los habilitados. La pantalla que los administra
 * necesita justo lo contrario: ver tambien los apagados, que son los que se
 * pueden volver a encender.
 */
export async function listarMetodosPagoTodos(): Promise<MetodoPago[]> {
  if (MODO_DEMO) return METODOS_PAGO_DEMO;

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('metodos_pago')
    .select('*')
    .eq('deleted', false)
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
 *
 * Acepta un SUBCONJUNTO de los campos. Desde el 9/9/2026 la configuracion se
 * reparte en varias pantallas del area -los datos del establecimiento en una,
 * las notificaciones en otra- y cada una guarda lo suyo. Mandar el objeto
 * completo desde cada una obligaria a que la pantalla de notificaciones
 * arrastrara el RUC y la direccion en campos ocultos solo para no borrarlos,
 * que es exactamente la clase de dato invisible que despues se pisa.
 */
export async function actualizarConfiguracion(
  datos: Partial<EntradaConfiguracion>,
): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();
  const { error } = await supabase
    .from('configuracion_sistema')
    .update(datos)
    .eq('id_configuracion', 1);

  if (error) throw traducirError(error);
}

/** Una fila del horario, tal como la manda la pantalla. */
export interface EntradaHorario {
  id_horario: number;
  hora_apertura: string;
  hora_cierre: string;
  activo: boolean;
}

/**
 * Guarda el horario de atencion completo (CU-020).
 *
 * Son siete filas fijas -una por dia, creadas por la instalacion-, asi que
 * esto solo actualiza: no hay alta ni baja de dias.
 *
 * POR QUE SIETE `update` Y NO UN `upsert`
 *
 * `upsert` exige mandar todas las columnas obligatorias de la tabla, y un
 * error de calculo en `dia_semana` reescribiria el dia equivocado sin que
 * nadie lo note. Siete actualizaciones por clave primaria no pueden tocar una
 * fila que no sea la suya. Van en paralelo porque son independientes entre si.
 *
 * La base exige `hora_cierre > hora_apertura` con un CHECK, tambien en los
 * dias cerrados. La accion valida antes para poder decirlo con palabras.
 */
export async function actualizarHorarios(horarios: EntradaHorario[]): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const resultados = await Promise.all(
    horarios.map(({ id_horario, ...campos }) =>
      supabase.from('horarios_atencion').update(campos).eq('id_horario', id_horario),
    ),
  );

  const fallo = resultados.find((r) => r.error);
  if (fallo?.error) throw traducirError(fallo.error);
}

/**
 * Habilita o deshabilita metodos de pago (CU-020).
 *
 * No es un borrado: un metodo apagado sigue existiendo porque los cobros
 * historicos lo referencian. Deja de ofrecerse al cobrar, nada mas.
 */
export async function actualizarMetodosPago(
  metodos: Array<{ id_metodo: number; estado: boolean }>,
): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const resultados = await Promise.all(
    metodos.map(({ id_metodo, estado }) =>
      supabase.from('metodos_pago').update({ estado }).eq('id_metodo', id_metodo),
    ),
  );

  const fallo = resultados.find((r) => r.error);
  if (fallo?.error) throw traducirError(fallo.error);
}
