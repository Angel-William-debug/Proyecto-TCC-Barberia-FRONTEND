/** Accion de servidor de usuarios y roles (CU-019). */
'use server';

import { actualizar, crearUsuario, exigirSesion } from '@barber-shop/api';

import { CORREO, Validacion, booleano, ejecutar, numero, texto } from './base';
import type { ResultadoAccion } from './base';

/** Alta de un usuario (CU-019, paso 1-8). Invita por correo; no fija contraseña (RN-047). */
export async function guardarUsuario(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const nombre = texto(datos, 'nombre');
  const email = texto(datos, 'email');
  const idRol = numero(datos, 'id_rol');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre completo del usuario.');
  v.exigir(CORREO.test(email), 'email', 'Ingrese un correo con el formato nombre@dominio.com');
  v.exigir(idRol !== null, 'id_rol', 'Elija un rol.');
  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/usuarios', () => crearUsuario({ nombre, email, idRol: idRol! }));
}

/** Cambio de rol o de estado (CU-019 A2, A3). No toca Auth: solo la ficha de `usuarios`. */
export async function actualizarUsuario(datos: FormData): Promise<ResultadoAccion> {
  await exigirSesion();

  const id = numero(datos, 'id_usuario');
  const idRol = numero(datos, 'id_rol');

  const v = new Validacion();
  v.exigir(id !== null, 'id_usuario', 'Falta el usuario.');
  v.exigir(idRol !== null, 'id_rol', 'Elija un rol.');
  if (v.hayErrores) return v.resultado;

  return ejecutar('/panel/usuarios', () =>
    actualizar('usuarios', id!, { id_rol: idRol, estado: booleano(datos, 'estado') }),
  );
}
