/**
 * Acciones de servidor de Barberos (CU-004).
 *
 * La tabla es `profesionales`; en pantalla se lee «Barbero» (13.3 del
 * sistema de diseno).
 *
 * Valida lo que el formulario puede comprobar barato -campos vacios, formatos,
 * rangos- y deja el resto a la base. Las reglas de negocio duras no se duplican
 * aca: si el precio no puede ser negativo, eso lo dice un CHECK, y
 * `traducirError` convierte el rechazo en un mensaje legible.
 */
'use server';

import { actualizarBarbero, crearBarbero } from '@barber-shop/api';

import { Validacion, booleano, ejecutar, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

export async function guardarBarbero(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_profesional');
  const nombre = texto(datos, 'nombre');
  const comision = numero(datos, 'porcentaje_com');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre completo del barbero.');
  v.exigir(
    comision !== null && comision >= 0 && comision <= 100,
    'porcentaje_com',
    'La comisión debe estar entre 0 y 100.',
  );
  if (v.hayErrores) return v.resultado;

  const entrada = {
    nombre,
    especialidad: textoOpcional(datos, 'especialidad'),
    tipo: textoOpcional(datos, 'tipo'),
    porcentajeComision: comision!,
    estado: booleano(datos, 'estado'),
  };

  return ejecutar('/panel/barberos', () =>
    id ? actualizarBarbero(id, entrada) : crearBarbero(entrada),
  );
}
