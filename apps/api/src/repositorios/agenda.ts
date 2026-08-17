import type {
  CitaCompleta,
  EntradaNuevaCita,
  FiltroAgenda,
  ServicioDeCita,
} from '@barber-shop/tipos';

import { agendaDemo } from '../demo/datos';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';

/**
 * Agenda de turnos (CU-006).
 *
 * La consulta trae la cita, su cliente y el detalle con servicio y
 * profesional en un solo viaje. Hacerlo en varios producia el problema N+1:
 * un dia con cuarenta turnos disparaba mas de ochenta consultas.
 */
const SELECCION_CITA = `
  id_cita, id_cliente, id_usuario, fecha_hora, estado, observaciones, total,
  created_at, updated_at,
  clientes ( id_cliente, nombre, telefono ),
  detalle_cita (
    id_detalle, id_cita, id_servicio, id_profesional,
    duracion_min, precio_unit, subtotal,
    servicios ( id_servicio, nombre ),
    profesionales ( id_profesional, nombre )
  )
`;

interface FilaCruda {
  id_cita: number;
  id_cliente: number;
  id_usuario: number | null;
  fecha_hora: string;
  estado: CitaCompleta['estado'];
  observaciones: string | null;
  total: number;
  created_at: string;
  updated_at: string;
  clientes: { id_cliente: number; nombre: string; telefono: string } | null;
  detalle_cita: Array<{
    id_detalle: number;
    id_cita: number;
    id_servicio: number;
    id_profesional: number;
    duracion_min: number;
    precio_unit: number;
    subtotal: number;
    servicios: { id_servicio: number; nombre: string } | null;
    profesionales: { id_profesional: number; nombre: string } | null;
  }>;
}

function componer(fila: FilaCruda): CitaCompleta {
  const servicios: ServicioDeCita[] = fila.detalle_cita.map((d) => ({
    id_detalle: d.id_detalle,
    id_cita: d.id_cita,
    id_servicio: d.id_servicio,
    id_profesional: d.id_profesional,
    duracion_min: d.duracion_min,
    precio_unit: d.precio_unit,
    subtotal: d.subtotal,
    servicio: d.servicios ?? { id_servicio: d.id_servicio, nombre: 'Servicio eliminado' },
    profesional: d.profesionales ?? { id_profesional: d.id_profesional, nombre: 'Sin asignar' },
  }));

  const duracionTotalMin = servicios.reduce((suma, s) => suma + s.duracion_min, 0);
  const inicio = new Date(fila.fecha_hora);
  const fin = new Date(inicio.getTime() + duracionTotalMin * 60_000);

  return {
    id_cita: fila.id_cita,
    id_cliente: fila.id_cliente,
    id_usuario: fila.id_usuario,
    fecha_hora: fila.fecha_hora,
    estado: fila.estado,
    observaciones: fila.observaciones,
    total: fila.total,
    created_at: fila.created_at,
    updated_at: fila.updated_at,
    cliente: fila.clientes ?? {
      id_cliente: fila.id_cliente,
      nombre: 'Cliente eliminado',
      telefono: '',
    },
    servicios,
    duracionTotalMin,
    fechaHoraFin: fin.toISOString(),
  };
}

export async function listarAgenda(filtro: FiltroAgenda): Promise<CitaCompleta[]> {
  if (MODO_DEMO) {
    let demo = agendaDemo(filtro.desde);
    if (filtro.estados?.length) {
      demo = demo.filter((c) => filtro.estados!.includes(c.estado));
    }
    if (filtro.idProfesional != null) {
      const id = filtro.idProfesional;
      demo = demo.filter((c) => c.servicios.some((s) => s.id_profesional === id));
    }
    return demo;
  }

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('citas')
    .select(SELECCION_CITA)
    .eq('deleted', false)
    .gte('fecha_hora', `${filtro.desde}T00:00:00`)
    .lte('fecha_hora', `${filtro.hasta}T23:59:59`)
    .order('fecha_hora', { ascending: true });

  if (filtro.estados?.length) {
    consulta = consulta.in('estado', filtro.estados);
  }

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  let citas = (data as unknown as FilaCruda[]).map(componer);

  // El filtro por profesional se aplica aqui y no en la consulta: un turno
  // puede tener varios servicios con barberos distintos, y filtrar en SQL
  // descartaria la cita entera en lugar de conservarla.
  if (filtro.idProfesional != null) {
    const id = filtro.idProfesional;
    citas = citas.filter((c) => c.servicios.some((s) => s.id_profesional === id));
  }

  return citas;
}

export async function obtenerCita(idCita: number): Promise<CitaCompleta | null> {
  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('citas')
    .select(SELECCION_CITA)
    .eq('id_cita', idCita)
    .eq('deleted', false)
    .maybeSingle();

  if (error) throw traducirError(error);
  return data ? componer(data as unknown as FilaCruda) : null;
}

/**
 * Comprueba si un barbero ya tiene un turno superpuesto (RN-016).
 *
 * Delega en la funcion `fn_verificar_conflicto_horario` de la base en lugar
 * de resolverlo en TypeScript. Motivo: la regla debe valer tambien para
 * cualquier otro cliente de la base, y una comprobacion hecha aqui se saltea
 * con una llamada directa a la API.
 *
 * `pIdCitaExcluir` es imprescindible al editar: sin ese parametro, una cita
 * con varios servicios del mismo barbero se detecta como conflicto consigo
 * misma.
 */
export async function hayConflictoHorario(params: {
  idProfesional: number;
  fechaHora: string;
  duracionMin: number;
  idCitaExcluir?: number;
}): Promise<boolean> {
  const supabase = await clienteServidor();

  const { data, error } = await supabase.rpc('fn_verificar_conflicto_horario', {
    p_id_profesional: params.idProfesional,
    p_fecha_hora: params.fechaHora,
    p_duracion_min: params.duracionMin,
    p_id_cita_excluir: params.idCitaExcluir ?? null,
  });

  if (error) throw traducirError(error);
  return data === true;
}

/**
 * Alta de un turno (CU-006).
 *
 * El campo `total` NO se envia: lo calcula el disparador
 * `trg_detalle_cita_after_insert` sumando los subtotales. Enviarlo desde aqui
 * abriria la puerta a que la cabecera y el detalle discrepen.
 *
 * Tampoco se envian `duracion_min` ni `precio_unit`: se toman del catalogo en
 * el momento del alta, para que un cambio de precio posterior no altere
 * turnos ya agendados.
 */
export async function crearCita(entrada: EntradaNuevaCita): Promise<number> {
  const supabase = await clienteServidor();

  if (entrada.servicios.length === 0) {
    throw new ErrorAplicacion('El turno debe incluir al menos un servicio.');
  }

  const idsServicio = entrada.servicios.map((s) => s.idServicio);
  const { data: catalogo, error: errorCatalogo } = await supabase
    .from('servicios')
    .select('id_servicio, duracion_min, precio_base')
    .in('id_servicio', idsServicio)
    .eq('deleted', false)
    .eq('estado', true);

  if (errorCatalogo) throw traducirError(errorCatalogo);

  const porId = new Map(
    (catalogo ?? []).map((s) => [s.id_servicio, s as { duracion_min: number; precio_base: number }]),
  );

  for (const s of entrada.servicios) {
    if (!porId.has(s.idServicio)) {
      throw new ErrorAplicacion(
        `El servicio ${s.idServicio} no existe o esta desactivado.`,
        'RN-013',
      );
    }
  }

  // Verificacion de solapamiento antes de escribir nada.
  let desplazamiento = 0;
  for (const s of entrada.servicios) {
    const info = porId.get(s.idServicio)!;
    const inicio = new Date(new Date(entrada.fechaHora).getTime() + desplazamiento * 60_000);

    const conflicto = await hayConflictoHorario({
      idProfesional: s.idProfesional,
      fechaHora: inicio.toISOString(),
      duracionMin: info.duracion_min,
    });

    if (conflicto) {
      throw new ErrorAplicacion(
        'El barbero seleccionado ya tiene otro turno en ese horario.',
        'RN-016',
      );
    }

    desplazamiento += info.duracion_min;
  }

  const { data: cita, error: errorCita } = await supabase
    .from('citas')
    .insert({
      id_cliente: entrada.idCliente,
      fecha_hora: entrada.fechaHora,
      observaciones: entrada.observaciones ?? null,
      estado: 'pendiente',
    })
    .select('id_cita')
    .single();

  if (errorCita) throw traducirError(errorCita);

  const idCita = (cita as { id_cita: number }).id_cita;

  const detalles = entrada.servicios.map((s) => {
    const info = porId.get(s.idServicio)!;
    return {
      id_cita: idCita,
      id_servicio: s.idServicio,
      id_profesional: s.idProfesional,
      duracion_min: info.duracion_min,
      precio_unit: info.precio_base,
      subtotal: info.precio_base,
    };
  });

  const { error: errorDetalle } = await supabase.from('detalle_cita').insert(detalles);

  if (errorDetalle) {
    // La cabecera quedo sin detalle. Se limpia para no dejar un turno vacio
    // en la agenda. Lo correcto seria una funcion transaccional en la base;
    // queda anotado como mejora.
    await supabase.from('citas').delete().eq('id_cita', idCita);
    throw traducirError(errorDetalle);
  }

  return idCita;
}

/**
 * Cambio de estado del turno (CU-007).
 *
 * No valida la transicion: de eso se encarga el disparador
 * `trg_cita_inmutable`, que rechaza cualquier cambio sobre una cita
 * completada o cancelada (RN-018). Duplicar la regla aqui solo garantizaria
 * que algun dia las dos versiones difieran.
 */
export async function cambiarEstadoCita(
  idCita: number,
  estado: CitaCompleta['estado'],
): Promise<void> {
  const supabase = await clienteServidor();

  const { error } = await supabase.from('citas').update({ estado }).eq('id_cita', idCita);

  if (error) throw traducirError(error);
}
