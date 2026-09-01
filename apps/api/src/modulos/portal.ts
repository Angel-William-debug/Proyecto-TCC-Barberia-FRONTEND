/**
 * El portal del cliente.
 *
 * Un modulo aparte y no funciones sueltas dentro de `agenda.ts` y
 * `clientes.ts`, aunque toque las mismas tablas. La razon es que el criterio
 * de organizacion del proyecto es «un archivo por pantalla de la barra
 * lateral», y el portal no esta en esa barra: es la otra mitad del sistema.
 * Quien busque por que un cliente ve lo que ve abre este archivo, no tres.
 *
 * TODAS las lecturas de aca pasan por `clienteServidor()`, es decir por RLS.
 * Ninguna filtra por cliente en TypeScript: la base ya devuelve unicamente lo
 * del solicitante gracias a `fn_id_cliente_actual()`. Escribir el filtro
 * tambien aca daria una falsa sensacion de seguridad y, el dia que las dos
 * versiones difieran, la que manda es la de la base.
 *
 * La unica excepcion es `registrarCliente`, y esta explicada donde ocurre.
 */

import type {
  EntradaRegistroCliente,
  EntradaReserva,
  CambiosPerfilCliente,
  FacturaDelCliente,
  FranjaDisponible,
  PerfilCliente,
  TurnoDelCliente,
  UsuarioSesion,
  VistaPublicoBarbero,
  VistaPublicoHorario,
  VistaPublicoServicio,
} from '@barber-shop/tipos';

import {
  BARBEROS_PORTAL_DEMO,
  FACTURAS_PORTAL_DEMO,
  HORARIOS_PORTAL_DEMO,
  PERFIL_PORTAL_DEMO,
  SERVICIOS_PORTAL_DEMO,
  SESION_CLIENTE_DEMO,
  franjasDemo,
  turnosPortalDemo,
} from '../demo/datos-portal';
import { MODO_DEMO } from '../demo/modo';
import { ErrorAplicacion, traducirError } from '../errores';
import { clienteAdmin } from '../supabase/cliente-admin';
import { clienteServidor } from '../supabase/cliente-servidor';
import { usuarioActual } from './sesion';

// ---------------------------------------------------------------------------
// Sesion del portal
// ---------------------------------------------------------------------------

/**
 * El usuario de la sesion, visto desde el portal.
 *
 * Fuera del modo demostracion es exactamente `usuarioActual()`. La diferencia
 * esta adentro: `USUARIO_DEMO` es un administrador -el modo se hizo para
 * recorrer el panel- y con esa sesion el portal quedaria inalcanzable, porque
 * su layout manda al panel a todo el que no sea cliente. Justo en el modo con
 * el que se toman las capturas del TCC.
 *
 * Asi que la demostracion tiene una persona de cada lado: el administrador
 * para el panel y `SESION_CLIENTE_DEMO` para el portal. No es una excepcion a
 * la separacion por rol: es la separacion aplicada tambien a los datos
 * ficticios.
 */
export async function sesionPortal(): Promise<UsuarioSesion | null> {
  if (MODO_DEMO) return SESION_CLIENTE_DEMO;
  return usuarioActual();
}

// ---------------------------------------------------------------------------
// Alta de cuenta (CU-001)
// ---------------------------------------------------------------------------

/**
 * Registro publico de un cliente.
 *
 * ESTE ES EL UNICO LUGAR DEL PORTAL QUE USA LA CLAVE DE SERVICIO, y hace falta
 * por como esta armada la cadena: quien se registra todavia no tiene sesion,
 * asi que no puede escribir en `public.usuarios` -exclusiva del Administrador-
 * ni crear su propia ficha de `clientes`. Alguien con permisos tiene que
 * armar las tres piezas por el.
 *
 * Se hace en el servidor y no en el navegador, al reves que el formulario
 * anterior, precisamente porque la clave de servicio no puede salir del
 * servidor.
 *
 * POR QUE ESTO NO ES UN AGUJERO
 *
 * La funcion no recibe el rol: lo busca ella y siempre es `cliente`. No hay
 * parametro que permita pedir otro. El alta de personal sigue siendo
 * `crearUsuario()`, que exige sesion de Administrador.
 *
 * Si algo falla despues de crear la cuenta de Auth se deshace lo hecho, igual
 * que en `crearUsuario()`: una cuenta de Auth sin ficha es invisible para el
 * sistema y su dueno no puede ni entrar ni volver a registrarse, porque el
 * correo ya figura como tomado.
 */
export async function registrarCliente(entrada: EntradaRegistroCliente): Promise<void> {
  if (MODO_DEMO) return;

  const admin = clienteAdmin();

  const { data: rol, error: errorRol } = await admin
    .from('roles')
    .select('id_rol')
    .eq('nombre', 'cliente')
    .single();

  if (errorRol || !rol) {
    throw new ErrorAplicacion('No se pudo completar el registro. Intente mas tarde.');
  }

  // `email_confirm: false` deja que Supabase mande el correo de confirmacion.
  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: entrada.email,
    password: entrada.password,
    email_confirm: false,
    user_metadata: { nombre: entrada.nombre },
  });

  if (errorAuth || !creado.user) {
    // No se distingue «ese correo ya existe» de otros fallos: revelarlo
    // permitiria averiguar quien es cliente de la barberia.
    throw new ErrorAplicacion('No se pudo crear la cuenta. Revise los datos e intente de nuevo.');
  }

  const authUid = creado.user.id;

  const { data: usuario, error: errorUsuario } = await admin
    .from('usuarios')
    .insert({
      id_rol: (rol as { id_rol: number }).id_rol,
      auth_uid: authUid,
      nombre: entrada.nombre,
      email: entrada.email,
      estado: true,
    })
    .select('id_usuario')
    .single();

  if (errorUsuario || !usuario) {
    await admin.auth.admin.deleteUser(authUid);
    throw new ErrorAplicacion('No se pudo crear la cuenta. Revise los datos e intente de nuevo.');
  }

  const idUsuario = (usuario as { id_usuario: number }).id_usuario;

  const { error: errorCliente } = await admin.from('clientes').insert({
    id_usuario: idUsuario,
    // Se registro solo: no hay recepcionista que lo haya dado de alta.
    id_usuario_reg: null,
    nombre: entrada.nombre,
    email: entrada.email,
    telefono: entrada.telefono,
    estado: true,
  });

  if (errorCliente) {
    await admin.from('usuarios').delete().eq('id_usuario', idUsuario);
    await admin.auth.admin.deleteUser(authUid);
    throw traducirError(errorCliente);
  }
}

// ---------------------------------------------------------------------------
// Catalogo publico
//
// Las tres vistas `v_publico_*` estan concedidas a `anon`, asi que estas
// funciones andan con o sin sesion. Es lo que permite que la portada muestre
// servicios y precios antes de pedirle nada a nadie.
// ---------------------------------------------------------------------------

export async function catalogoServicios(): Promise<VistaPublicoServicio[]> {
  if (MODO_DEMO) return SERVICIOS_PORTAL_DEMO;

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('v_publico_servicios')
    .select('*')
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaPublicoServicio[];
}

export async function barberosPublicos(): Promise<VistaPublicoBarbero[]> {
  if (MODO_DEMO) return BARBEROS_PORTAL_DEMO;

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('v_publico_barberos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaPublicoBarbero[];
}

export async function horariosPublicos(): Promise<VistaPublicoHorario[]> {
  if (MODO_DEMO) return HORARIOS_PORTAL_DEMO;

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('v_publico_horarios')
    .select('*')
    .order('dia_semana', { ascending: true });

  if (error) throw traducirError(error);
  return (data ?? []) as VistaPublicoHorario[];
}

// ---------------------------------------------------------------------------
// Disponibilidad
// ---------------------------------------------------------------------------

/**
 * Franjas libres de un dia para un servicio.
 *
 * El calculo entero vive en `fn_turnos_disponibles`, en la base. Podria
 * hacerse aca -traer las citas del dia y cruzarlas contra el horario- y seria
 * un error: quedarian dos definiciones de «esta libre», la de esta funcion y
 * la de `fn_verificar_conflicto_horario` que valida al guardar. El dia que
 * difieran, el portal ofrece un horario que la base despues rechaza.
 *
 * `barberos_disponibles` de cada franja es su capacidad: cuantas reservas
 * simultaneas entran ahi. Con cuatro barberos activos son cuatro turnos en
 * paralelo, y si uno se desactiva pasan a ser tres sin tocar nada.
 */
export async function turnosDisponibles(
  fecha: string,
  duracionMin: number,
  idProfesional?: number,
): Promise<FranjaDisponible[]> {
  if (MODO_DEMO) return franjasDemo(fecha, duracionMin, idProfesional);

  const supabase = await clienteServidor();
  const { data, error } = await supabase.rpc('fn_turnos_disponibles', {
    p_fecha: fecha,
    p_duracion_min: duracionMin,
    p_id_profesional: idProfesional ?? null,
  });

  if (error) throw traducirError(error);
  return (data ?? []) as FranjaDisponible[];
}

// ---------------------------------------------------------------------------
// Los turnos del cliente
// ---------------------------------------------------------------------------

/** Lo que PostgREST devuelve al pedir la cita con su detalle resuelto. */
interface FilaTurno {
  id_cita: number;
  fecha_hora: string;
  estado: TurnoDelCliente['estado'];
  observaciones: string | null;
  total: number;
  detalle_cita: Array<{
    id_servicio: number;
    duracion_min: number;
    precio_unit: number;
    servicios: { nombre: string } | { nombre: string }[] | null;
    profesionales: { nombre: string } | { nombre: string }[] | null;
  }> | null;
}

/** PostgREST devuelve objeto o arreglo segun infiera la cardinalidad. */
function nombreDe(valor: { nombre: string } | { nombre: string }[] | null): string {
  if (Array.isArray(valor)) return valor[0]?.nombre ?? '';
  return valor?.nombre ?? '';
}

const CANCELABLES: ReadonlyArray<TurnoDelCliente['estado']> = ['pendiente', 'confirmado'];

function armarTurno(fila: FilaTurno): TurnoDelCliente {
  const lineas = fila.detalle_cita ?? [];
  const duracionTotalMin = lineas.reduce((suma, l) => suma + l.duracion_min, 0);

  return {
    idCita: fila.id_cita,
    fechaHora: fila.fecha_hora,
    fechaHoraFin: new Date(
      new Date(fila.fecha_hora).getTime() + duracionTotalMin * 60_000,
    ).toISOString(),
    estado: fila.estado,
    duracionTotalMin,
    total: fila.total,
    observaciones: fila.observaciones,
    servicios: lineas.map((l) => ({
      idServicio: l.id_servicio,
      nombre: nombreDe(l.servicios),
      barbero: nombreDe(l.profesionales),
      duracionMin: l.duracion_min,
      precio: l.precio_unit,
    })),
    // Un turno ya pasado no se cancela aunque siga en `pendiente`: se marca
    // `no_asistio` desde el mostrador. Ofrecer cancelarlo seria ofrecer una
    // salida limpia a quien falto.
    cancelable:
      CANCELABLES.includes(fila.estado) && new Date(fila.fecha_hora).getTime() > Date.now(),
  };
}

const SELECT_TURNO =
  'id_cita, fecha_hora, estado, observaciones, total, ' +
  'detalle_cita(id_servicio, duracion_min, precio_unit, servicios(nombre), profesionales(nombre))';

/**
 * Los turnos del cliente, separados en los que vienen y los que ya pasaron.
 *
 * Se traen todos en una sola consulta y se parten en TypeScript en lugar de
 * hacer dos viajes: son las citas de una persona, no de la barberia entera, y
 * el volumen no justifica paginar.
 */
export async function misTurnos(): Promise<{
  proximos: TurnoDelCliente[];
  pasados: TurnoDelCliente[];
}> {
  if (MODO_DEMO) return turnosPortalDemo();

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('citas')
    .select(SELECT_TURNO)
    .eq('deleted', false)
    .order('fecha_hora', { ascending: false });

  if (error) throw traducirError(error);

  const turnos = ((data ?? []) as unknown as FilaTurno[]).map(armarTurno);
  const ahora = Date.now();

  const vigente = (t: TurnoDelCliente) =>
    new Date(t.fechaHora).getTime() >= ahora && CANCELABLES.includes(t.estado);

  return {
    // Los proximos se leen de mas cerca a mas lejos; los pasados, al reves.
    proximos: turnos.filter(vigente).reverse(),
    pasados: turnos.filter((t) => !vigente(t)),
  };
}

/**
 * Reserva un turno (CU-004 desde el portal).
 *
 * Dos escrituras que la base trata como una: la cita y su unica linea de
 * detalle. Si la segunda falla se borra la primera, porque una cita sin
 * servicios no tiene ni duracion ni total y aparece como un hueco vacio en la
 * agenda del mostrador.
 *
 * QUIEN COMPLETA EL PRECIO Y LA DURACION
 *
 * El servidor, leyendo el catalogo, igual que `crearCita()`. NO los
 * disparadores: `trg_detalle_cita_before_insert` valida -que el servicio y el
 * barbero esten activos, que no haya solapamiento- pero no rellena nada, y las
 * tres columnas son NOT NULL. Y NO el navegador: el cliente manda que servicio
 * quiere, no cuanto cuesta. Que se copien en el momento del alta, en vez de
 * leerse del catalogo al mostrar el turno, es deliberado: un cambio de precio
 * posterior no debe alterar un turno ya agendado.
 *
 * `total` sigue siendo cosa del disparador `trg_detalle_cita_after_insert`,
 * que suma los subtotales.
 */
export async function reservarTurno(entrada: EntradaReserva): Promise<number> {
  if (MODO_DEMO) {
    throw new ErrorAplicacion(
      'El modo demostracion no guarda reservas. Los datos son ficticios.',
    );
  }

  const supabase = await clienteServidor();

  const { data: cliente, error: errorCliente } = await supabase.rpc('fn_id_cliente_actual');

  if (errorCliente || cliente == null) {
    throw new ErrorAplicacion('Su cuenta todavia no esta habilitada para reservar turnos.');
  }

  // El catalogo se lee de la vista publica y no de `servicios`: es la unica
  // que el rol cliente puede leer, y ya filtra por activo y no borrado.
  const { data: servicio, error: errorServicio } = await supabase
    .from('v_publico_servicios')
    .select('duracion_min, precio_base')
    .eq('id_servicio', entrada.idServicio)
    .maybeSingle();

  if (errorServicio) throw traducirError(errorServicio);
  if (!servicio) {
    throw new ErrorAplicacion('Ese servicio ya no esta disponible.', 'RN-013');
  }

  const { duracion_min, precio_base } = servicio as {
    duracion_min: number;
    precio_base: number;
  };

  const { data: cita, error: errorCita } = await supabase
    .from('citas')
    .insert({
      id_cliente: cliente as number,
      fecha_hora: entrada.fechaHora,
      // Quien reserva no confirma su propio turno: eso es del mostrador
      // (CU-004). La politica RLS ademas no admite otro valor.
      estado: 'pendiente',
      observaciones: entrada.observaciones ?? null,
    })
    .select('id_cita')
    .single();

  if (errorCita) throw traducirError(errorCita);

  const idCita = (cita as { id_cita: number }).id_cita;

  const { error: errorDetalle } = await supabase.from('detalle_cita').insert({
    id_cita: idCita,
    id_servicio: entrada.idServicio,
    id_profesional: entrada.idProfesional,
    duracion_min,
    precio_unit: precio_base,
    subtotal: precio_base,
  });

  if (errorDetalle) {
    await supabase.from('citas').delete().eq('id_cita', idCita);
    throw traducirError(errorDetalle);
  }

  return idCita;
}

/**
 * Cancela un turno propio.
 *
 * No comprueba de quien es la cita: la politica `cliente_cancela_su_cita` solo
 * alcanza filas del solicitante en estado `pendiente` o `confirmado`, asi que
 * cualquier otro identificador actualiza cero filas. Se detecta por el conteo.
 */
export async function cancelarMiTurno(idCita: number): Promise<void> {
  if (MODO_DEMO) {
    throw new ErrorAplicacion('El modo demostracion no guarda cambios.');
  }

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('citas')
    .update({ estado: 'cancelado' })
    .eq('id_cita', idCita)
    .select('id_cita');

  if (error) throw traducirError(error);

  if (!data?.length) {
    throw new ErrorAplicacion('Ese turno ya no se puede cancelar.');
  }
}

// ---------------------------------------------------------------------------
// Perfil y facturas
// ---------------------------------------------------------------------------

export async function miPerfil(): Promise<PerfilCliente> {
  if (MODO_DEMO) return PERFIL_PORTAL_DEMO;

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('clientes')
    // `notas_internas` queda fuera a proposito (RN-008): son las anotaciones
    // que el mostrador hace sobre el cliente, no para el cliente.
    .select('id_cliente, nombre, email, telefono, direccion, fecha_nacimiento, fecha_registro')
    .maybeSingle();

  if (error) throw traducirError(error);
  if (!data) throw new ErrorAplicacion('Su cuenta todavia no tiene una ficha de cliente.');

  const f = data as {
    id_cliente: number;
    nombre: string;
    email: string | null;
    telefono: string;
    direccion: string | null;
    fecha_nacimiento: string | null;
    fecha_registro: string;
  };

  return {
    idCliente: f.id_cliente,
    nombre: f.nombre,
    email: f.email,
    telefono: f.telefono,
    direccion: f.direccion,
    fechaNacimiento: f.fecha_nacimiento,
    fechaRegistro: f.fecha_registro,
  };
}

/**
 * Edita la ficha propia.
 *
 * El correo no esta: cambiarlo significa cambiar la credencial de Auth, que es
 * otro flujo -con confirmacion al correo nuevo- y no una edicion de perfil.
 * Los campos de control tampoco: `trg_cliente_campos_de_control` los rechaza
 * aunque alguien los mande.
 */
export async function actualizarMiPerfil(cambios: CambiosPerfilCliente): Promise<void> {
  if (MODO_DEMO) {
    throw new ErrorAplicacion('El modo demostracion no guarda cambios.');
  }

  const supabase = await clienteServidor();
  const { data: idCliente, error: errorId } = await supabase.rpc('fn_id_cliente_actual');

  if (errorId || idCliente == null) {
    throw new ErrorAplicacion('Su cuenta todavia no tiene una ficha de cliente.');
  }

  const { error } = await supabase
    .from('clientes')
    .update({
      nombre: cambios.nombre,
      telefono: cambios.telefono,
      direccion: cambios.direccion ?? null,
      fecha_nacimiento: cambios.fechaNacimiento || null,
    })
    .eq('id_cliente', idCliente as number);

  if (error) throw traducirError(error);
}

export async function misFacturas(): Promise<FacturaDelCliente[]> {
  if (MODO_DEMO) return FACTURAS_PORTAL_DEMO;

  const supabase = await clienteServidor();
  const { data, error } = await supabase
    .from('facturas')
    .select('id_factura, id_cita, fecha_emision, total, estado')
    .eq('deleted', false)
    .order('fecha_emision', { ascending: false });

  if (error) throw traducirError(error);

  return ((data ?? []) as Array<{
    id_factura: number;
    id_cita: number;
    fecha_emision: string;
    total: number;
    estado: FacturaDelCliente['estado'];
  }>).map((f) => ({
    idFactura: f.id_factura,
    idCita: f.id_cita,
    fechaEmision: f.fecha_emision,
    total: f.total,
    estado: f.estado,
  }));
}
