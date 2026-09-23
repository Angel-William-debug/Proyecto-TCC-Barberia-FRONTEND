/**
 * Usuarios y roles (CU-019).
 *
 * El alta es la unica operacion de todo el sistema que toca dos sistemas a
 * la vez: `auth.users` (Supabase Auth) y `public.usuarios`. Por eso usa
 * `clienteAdmin()` -la clave de servicio, que omite RLS- solo para la mitad
 * de Auth; la fila de `public.usuarios` se inserta con `clienteServidor()`,
 * que respeta la politica RLS `admin_total` de esa tabla (solo el
 * Administrador puede escribir en `usuarios` y en `roles`).
 *
 * EL ALTA CREA LA CUENTA, NO LA INVITA
 *
 * Hasta el 9/9/2026 usaba `inviteUserByEmail`: se mandaba un correo y la
 * persona elegia su contrasena. Eso era el codigo apartandose del documento,
 * no al reves. CU-019 dice, en sus propias palabras: paso 3 «Hace clic en
 * Nuevo Usuario», paso 4 «Completa nombre, email y selecciona el rol», paso 6
 * «El sistema CREA LA CREDENCIAL en Supabase Auth y vincula auth_uid». En
 * ningun paso aparece una invitacion.
 *
 * Y no habia regla que lo exigiera: RN-047 dice «la contrasena no se almacena
 * en USUARIOS; el usuario se vincula a Supabase Auth mediante auth_uid», que
 * es sobre DONDE vive la contrasena, no sobre quien la elige. Se sigue
 * cumpliendo igual: la credencial la guarda Auth y `public.usuarios` solo
 * tiene el `auth_uid`.
 *
 * En la practica la invitacion tampoco servia. La barberia da de alta a un
 * barbero que esta parado al lado del mostrador, y esperar a que abra su
 * correo -si es que lo tiene, y si no cae en la carpeta de no deseados- lo
 * deja sin poder entrar el mismo dia que empieza a trabajar. Peor: si la
 * invitacion se pierde, no hay forma de reenviarla desde la interfaz.
 *
 * Ahora el Administrador fija una contrasena inicial y se la entrega en mano.
 * La persona la cambia cuando quiera desde «Recuperar contrasena», que es el
 * mecanismo nativo de Supabase Auth y sigue estando.
 *
 * `email_confirm: true` porque el Administrador da fe de la direccion: sin eso
 * la cuenta queda sin confirmar y no puede iniciar sesion hasta que alguien
 * abra un correo, que es exactamente lo que se quiso evitar.
 */

import type { Rol, VistaUsuarioPorRol } from '@barber-shop/tipos';

import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { clienteAdmin } from '../supabase/cliente-admin';
import { ErrorAplicacion, traducirError } from '../errores';
import { actualizar, rechazarSiEsDemo } from '../compartido/escritura';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';

export async function listarRoles(): Promise<Rol[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('estado', true)
    .order('id_rol');

  if (error) throw traducirError(error);
  return (data ?? []) as Rol[];
}

export interface FiltroUsuarios extends FiltroTabla {
  /** Nombre de rol: `administrador`, `recepcionista`, `profesional`, `cliente`. */
  rol?: string;
}

export async function listarUsuarios(filtro: FiltroUsuarios = {}): Promise<VistaUsuarioPorRol[]> {
  if (MODO_DEMO) return [];

  const supabase = await clienteServidor();

  const { data, error } = await supabase.from('v_usuarios_por_rol').select('*').order('nombre');
  if (error) throw traducirError(error);

  const filas = (data ?? []) as VistaUsuarioPorRol[];

  return filas.filter(
    (u) =>
      coincideTexto([u.nombre, u.email], filtro.busqueda) &&
      coincideEstado(u.estado ? 'activo' : 'inactivo', filtro.estados) &&
      (!filtro.rol || u.rol === filtro.rol) &&
      entreFechas(u.created_at, filtro.desde, filtro.hasta),
  );
}

export interface EntradaNuevoUsuario {
  nombre: string;
  email: string;
  idRol: number;
  /** Contrasena inicial. La fija el Administrador y la persona la cambia despues. */
  password: string;
}

/**
 * Alta de un usuario (CU-019, paso 1-8).
 *
 * Si la fila de `public.usuarios` falla -email duplicado, rol inexistente-
 * se borra el usuario recien creado en Auth para no dejar una cuenta sin
 * ficha, huerfana e invisible para el resto del sistema.
 */
export async function crearUsuario(entrada: EntradaNuevoUsuario): Promise<number> {
  rechazarSiEsDemo();

  const admin = clienteAdmin();

  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: entrada.email,
    password: entrada.password,
    email_confirm: true,
    user_metadata: { nombre: entrada.nombre },
  });

  if (errorAuth || !creado.user) {
    // Aca SI se dice que el correo ya existe, al reves que en el registro del
    // portal: quien esta mirando esta pantalla es el Administrador y ya tiene
    // la lista completa de usuarios delante. Ocultarselo solo lo dejaria sin
    // entender por que no puede dar de alta a alguien.
    throw new ErrorAplicacion(
      errorAuth?.message?.includes('already been registered')
        ? 'Ya existe una cuenta con ese correo.'
        : 'No se pudo crear el usuario. Verifique el correo e intente nuevamente.',
    );
  }

  const authUid = creado.user.id;
  const supabase = await clienteServidor();

  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuarios')
    .insert({
      id_rol: entrada.idRol,
      auth_uid: authUid,
      nombre: entrada.nombre,
      email: entrada.email,
      estado: true,
    })
    .select('id_usuario')
    .single();

  if (errorUsuario) {
    await admin.auth.admin.deleteUser(authUid);
    throw traducirError(errorUsuario);
  }

  return (usuario as { id_usuario: number }).id_usuario;
}

// ---------------------------------------------------------------------------
// Cambio de rol y de estado (CU-019 A2, A3)
// ---------------------------------------------------------------------------

/**
 * Lo unico editable de un usuario ya creado.
 *
 * El nombre y el correo no estan: identifican la cuenta de Supabase Auth, y
 * cambiarlos desde aca dejaria la ficha de `usuarios` desincronizada de su
 * cuenta real. La contrasena tampoco: la cambia su dueno.
 */
export interface CambiosUsuario {
  idRol: number;
  estado: boolean;
}

/** Cambio de rol o de estado (CU-019 A2, A3). No toca Auth. */
export async function actualizarUsuario(id: number, cambios: CambiosUsuario): Promise<void> {
  return actualizar('usuarios', id, { id_rol: cambios.idRol, estado: cambios.estado });
}
