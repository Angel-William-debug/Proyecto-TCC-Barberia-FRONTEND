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
 * No se fija contrasena desde aca (RN-047): `inviteUserByEmail` manda un
 * enlace de Supabase Auth para que la persona elija la suya. Es el mismo
 * mecanismo nativo de Supabase, no depende de Resend.
 */

import type { Rol, VistaUsuarioPorRol } from '@barber-shop/tipos';

import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { clienteAdmin } from '../supabase/cliente-admin';
import { ErrorAplicacion, traducirError } from '../errores';
import { rechazarSiEsDemo } from '../compartido/escritura';
import { coincideEstado, coincideTexto, type FiltroTabla } from '../compartido/filtros';

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
      (!filtro.rol || u.rol === filtro.rol),
  );
}

export interface EntradaNuevoUsuario {
  nombre: string;
  email: string;
  idRol: number;
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

  const { data: invitado, error: errorInvitacion } = await admin.auth.admin.inviteUserByEmail(
    entrada.email,
  );

  if (errorInvitacion || !invitado.user) {
    throw new ErrorAplicacion(
      errorInvitacion?.message?.includes('already been registered')
        ? 'Ya existe un usuario de Auth con ese correo.'
        : 'No se pudo invitar al usuario. Verifique el correo e intente nuevamente.',
    );
  }

  const authUid = invitado.user.id;
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
