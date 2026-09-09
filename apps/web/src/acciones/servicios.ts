/**
 * Acciones de servidor de Servicios (CU-003).
 *
 * Valida lo que el formulario puede comprobar barato -campos vacios, formatos,
 * rangos- y deja el resto a la base. Las reglas de negocio duras no se duplican
 * aca: si el precio no puede ser negativo, eso lo dice un CHECK, y
 * `traducirError` convierte el rechazo en un mensaje legible.
 */
'use server';

import { actualizar, crear } from '@barber-shop/api';

import { Validacion, booleano, ejecutar, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

export async function guardarServicio(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_servicio');
  const nombre = texto(datos, 'nombre');
  const categoria = numero(datos, 'id_categoria');
  const duracion = numero(datos, 'duracion_min');
  const precio = numero(datos, 'precio_base');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre del servicio.');
  v.exigir(categoria !== null, 'id_categoria', 'Elija una categoría.');
  v.exigir(duracion !== null && duracion > 0, 'duracion_min', 'La duración debe ser mayor a cero.');
  v.exigir(precio !== null && precio >= 0, 'precio_base', 'El precio no puede ser negativo.');
  if (v.hayErrores) return v.resultado;

  const fila = {
    nombre,
    id_categoria: categoria,
    descripcion: textoOpcional(datos, 'descripcion'),
    duracion_min: duracion,
    precio_base: precio,
    estado: booleano(datos, 'estado'),
  };

  return ejecutar('/panel/servicios', () =>
    id ? actualizar('servicios', id, fila) : crear('servicios', fila),
  );
}
