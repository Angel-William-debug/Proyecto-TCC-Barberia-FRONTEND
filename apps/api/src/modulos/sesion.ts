import type { NombreRol, UsuarioSesion } from '@barber-shop/tipos';

import { USUARIO_DEMO } from '../demo/datos-catalogo';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';

/**
 * Resuelve el usuario de la sesion actual con su rol.
 *
 * Supabase Auth solo conoce `auth.users`: correo, identificador y metadatos.
 * El rol y el resto del perfil viven en `public.usuarios`, vinculados por
 * `auth_uid`. Esta funcion une ambas mitades.
 *
 * Devuelve `null` si no hay sesion o si el usuario autenticado no tiene una
 * fila en `public.usuarios`, que es el caso de alguien dado de alta en Auth
 * pero todavia no habilitado en el sistema.
 */
export async function usuarioActual(): Promise<UsuarioSesion | null> {
  if (MODO_DEMO) return USUARIO_DEMO;

  const supabase = await clienteServidor();

  // `getUser()` y no `getSession()`: el primero valida el token contra el
  // servidor de Supabase. El segundo lee la cookie y confia en ella, lo que
  // en el servidor no es aceptable.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  /**
   * La forma de la fila, escrita a mano.
   *
   * Con el `!nombre_de_la_clave` del select, los tipos generados de Supabase
   * dejan de inferir la relacion y devuelven `GenericStringError`. El dato
   * llega bien -esta comprobado contra la base real-, es la inferencia la que
   * no acompana esa sintaxis. Declarar la forma aca es preferible a volver al
   * select ambiguo, que compilaba y fallaba en ejecucion.
   */
  interface FilaSesion {
    id_usuario: number;
    nombre: string;
    email: string;
    estado: boolean;
    roles: { nombre: string } | { nombre: string }[] | null;
    profesionales: { id_profesional: number } | { id_profesional: number }[] | null;
  }

  const { data: fila, error } = await supabase
    .from('usuarios')
    // `profesionales` va con el nombre de la clave foranea, y no a secas.
    // Hay DOS caminos entre `usuarios` y `profesionales`: `id_usuario` -el
    // barbero es este usuario- y `deleted_user_id` -este usuario borro al
    // barbero-, que agrego la migracion de borrado logico. Sin desambiguar,
    // PostgREST no elige: responde PGRST201 y esta funcion devuelve null, es
    // decir, nadie puede iniciar sesion. No se detecto antes porque el error
    // solo aparece contra la base real, y el recorrido de prueba se hizo
    // siempre en modo demostracion.
    .select(
      'id_usuario, nombre, email, estado, roles(nombre), ' +
        'profesionales!profesionales_id_usuario_fkey(id_profesional)',
    )
    .eq('auth_uid', user.id)
    // Un usuario borrado no entra. El filtro va en la consulta y no en una
    // comprobacion posterior: si alguna vez esta funcion cambia de forma, es
    // menos probable que se pierda una clausula que una linea de codigo suelta.
    .eq('deleted', false)
    .maybeSingle();

  if (error || !fila) return null;

  const data = fila as unknown as FilaSesion;

  // Un usuario desactivado (CU-001) conserva su cuenta en Auth pero pierde el
  // acceso. Distinto de borrado: al desactivado se lo puede reactivar. En los
  // dos casos se trata como si no tuviera sesion.
  if (!data.estado) return null;

  // PostgREST devuelve la relacion como objeto cuando es uno-a-uno y como
  // arreglo cuando es uno-a-muchos. El tipo inferido no siempre coincide con
  // la cardinalidad real, asi que se normalizan ambas formas.
  const primero = <T>(valor: unknown): T | null =>
    Array.isArray(valor) ? ((valor[0] as T) ?? null) : ((valor as T) ?? null);

  const rol = primero<{ nombre: string }>(data.roles)?.nombre;
  if (!rol) return null;

  const profesional = primero<{ id_profesional: number }>(data.profesionales);

  return {
    idUsuario: data.id_usuario,
    authUid: user.id,
    nombre: data.nombre,
    email: data.email,
    rol: rol as NombreRol,
    idProfesional: profesional?.id_profesional ?? null,
  };
}

/**
 * Igual que `usuarioActual()` pero lanza si no hay sesion.
 *
 * Se usa en las paginas del panel, donde llegar sin sesion es un error de
 * enrutamiento: el middleware deberia haber redirigido antes.
 */
export async function exigirSesion(): Promise<UsuarioSesion> {
  const usuario = await usuarioActual();
  if (!usuario) {
    throw new Error('No hay una sesion activa.');
  }
  return usuario;
}
