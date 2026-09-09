/**
 * Acciones de servidor de Clientes (CU-002).
 *
 * Valida lo que el formulario puede comprobar barato -campos vacios, formatos,
 * rangos- y deja el resto a la base. Las reglas de negocio duras no se duplican
 * aca: si el precio no puede ser negativo, eso lo dice un CHECK, y
 * `traducirError` convierte el rechazo en un mensaje legible.
 */
'use server';

import { actualizar, crear } from '@barber-shop/api';

import { CORREO, Validacion, booleano, ejecutar, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

export async function guardarCliente(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_cliente');
  const nombre = texto(datos, 'nombre');
  const telefono = texto(datos, 'telefono');
  const email = textoOpcional(datos, 'email');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre completo del cliente.');
  v.exigir(telefono.replace(/\D/g, '').length >= 6, 'telefono', 'Ingrese un teléfono de al menos seis dígitos.');
  v.exigir(!email || CORREO.test(email), 'email', 'Ingrese un correo con el formato nombre@dominio.com');
  if (v.hayErrores) return v.resultado;

  const fila = {
    nombre,
    telefono,
    email,
    direccion: textoOpcional(datos, 'direccion'),
    fecha_nacimiento: textoOpcional(datos, 'fecha_nacimiento'),
    notas_internas: textoOpcional(datos, 'notas_internas'),
    estado: booleano(datos, 'estado'),
  };

  return ejecutar('/panel/clientes', () =>
    id ? actualizar('clientes', id, fila) : crear('clientes', fila),
  );
}
