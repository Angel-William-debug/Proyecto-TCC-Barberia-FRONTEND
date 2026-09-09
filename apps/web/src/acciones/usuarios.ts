/** Accion de servidor de usuarios y roles (CU-019). */
'use server';

import { actualizarUsuario, crearUsuario, exigirSesion } from '@barber-shop/api';

import { CORREO, Validacion, booleano, ejecutar, numero, texto } from './base';
import type { ResultadoAccion } from './base';

/**
 * Alta de un usuario (CU-019, paso 1-8).
 *
 * Crea la cuenta con una contrasena inicial que fija el Administrador. Antes
 * mandaba una invitacion por correo; el porque del cambio esta en
 * `apps/api/src/modulos/usuarios.ts`.
 *
 * La contrasena NO se lee con `texto()`: esa funcion recorta los espacios de
 * los extremos, y una contrasena que empieza o termina con un espacio es una
 * contrasena valida. Recortarla guardaria una distinta de la que el
 * Administrador escribio y le dictaria a la persona.
 */
export async function guardarUsuario(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const nombre = texto(datos, 'nombre');
  const email = texto(datos, 'email');
  const idRol = numero(datos, 'id_rol');
  const password = String(datos.get('password') ?? '');
  const repetir = String(datos.get('repetir') ?? '');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre completo del usuario.');
  v.exigir(CORREO.test(email), 'email', 'Ingrese un correo con el formato nombre@dominio.com');
  v.exigir(idRol !== null, 'id_rol', 'Elija un rol.');
  // Los mismos ocho caracteres que exige el registro del portal, para que la
  // regla sea una sola en todo el sistema.
  v.exigir(
    password.length >= 8,
    'password',
    'La contraseña debe tener al menos 8 caracteres.',
  );
  v.exigir(password === repetir, 'repetir', 'Las dos contraseñas no coinciden.');
  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/usuarios', () =>
    crearUsuario({ nombre, email, idRol: idRol!, password }),
  );
}

/** Cambio de rol o de estado (CU-019 A2, A3). No toca Auth: solo la ficha de `usuarios`. */
export async function guardarCambiosUsuario(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const id = numero(datos, 'id_usuario');
  const idRol = numero(datos, 'id_rol');

  const v = new Validacion();
  v.exigir(id !== null, 'id_usuario', 'Falta el usuario.');
  v.exigir(idRol !== null, 'id_rol', 'Elija un rol.');
  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/usuarios', () =>
    actualizarUsuario(id!, { idRol: idRol!, estado: booleano(datos, 'estado') }),
  );
}
