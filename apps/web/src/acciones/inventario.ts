/** Acciones de servidor del inventario: receta (CU-003), categorías (CU-010) y alertas (CU-022). */
'use server';

import {
  actualizar,
  crear,
  exigirSesion,
  listarAlertas,
  listarRecetaServicio,
  marcarAlertaResuelta,
} from '@barber-shop/api';
import type { AlertaDeLista, RecetaLinea } from '@barber-shop/tipos';

import { Validacion, ejecutar, numero, texto, textoOpcional } from './base';
import type { ResultadoAccion } from './base';

// ---------------------------------------------------------------------------
// Receta del servicio — CU-003. Que productos y en que cantidad consume cada
// servicio; se propone al cerrar el turno (CU-011).
// ---------------------------------------------------------------------------

export async function obtenerReceta(idServicio: number): Promise<RecetaLinea[]> {
  return listarRecetaServicio(idServicio);
}

export async function guardarLineaReceta(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_servicio_producto');
  const idServicio = numero(datos, 'id_servicio');
  const idProducto = numero(datos, 'id_producto');
  const cantidad = numero(datos, 'cantidad_estandar');

  const v = new Validacion();
  v.exigir(idServicio !== null, 'id_servicio', 'Falta el servicio.');
  v.exigir(idProducto !== null, 'id_producto', 'Elija un producto.');
  v.exigir(cantidad !== null && cantidad > 0, 'cantidad_estandar', 'La cantidad debe ser mayor a cero.');
  if (v.hayErrores) return v.resultado;

  const fila = {
    id_servicio: idServicio,
    id_producto: idProducto,
    cantidad_estandar: cantidad,
    unidad_uso: textoOpcional(datos, 'unidad_uso'),
    estado: true,
  };

  return ejecutar('/panel/servicios', () =>
    id ? actualizar('servicio_producto', id, fila) : crear('servicio_producto', fila),
  );
}

// ---------------------------------------------------------------------------
// Categorias de producto — CU-010. Alta rapida desde Inventario.
// ---------------------------------------------------------------------------

export async function guardarCategoriaProducto(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_categoria_p');
  const nombre = texto(datos, 'nombre');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre de la categoría.');
  if (v.hayErrores) return v.resultado;

  const fila = {
    nombre,
    descripcion: textoOpcional(datos, 'descripcion'),
    estado: true,
  };

  return ejecutar('/panel/inventario', () =>
    id ? actualizar('categorias_producto', id, fila) : crear('categorias_producto', fila),
  );
}

// ---------------------------------------------------------------------------
// Alertas de stock — CU-022.
// ---------------------------------------------------------------------------

export async function obtenerAlertas(soloNoResueltas: boolean): Promise<AlertaDeLista[]> {
  return listarAlertas({ soloNoResueltas });
}

export async function resolverAlerta(idAlerta: number): Promise<ResultadoAccion> {
  await exigirSesion();
  return ejecutar('/panel/inventario', () => marcarAlertaResuelta(idAlerta));
}
