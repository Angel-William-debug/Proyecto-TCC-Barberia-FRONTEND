/** Acciones de servidor del inventario: receta (CU-003), categorías (CU-010) y alertas (CU-022). */
'use server';

import {
  actualizarCategoriaProducto,
  actualizarLineaReceta,
  actualizarProducto,
  crearCategoriaProducto,
  crearLineaReceta,
  crearProducto,
  exigirSesion,
  listarAlertas,
  listarRecetaServicio,
  marcarAlertaResuelta,
} from '@barber-shop/api';
import type { AlertaDeLista, RecetaLinea } from '@barber-shop/tipos';

import { Validacion, booleano, ejecutar, numero, texto, textoOpcional } from './base';
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

  const entrada = {
    idServicio: idServicio!,
    idProducto: idProducto!,
    cantidadEstandar: cantidad!,
    unidadUso: textoOpcional(datos, 'unidad_uso'),
  };

  return ejecutar('/panel/servicios', () =>
    id ? actualizarLineaReceta(id, entrada) : crearLineaReceta(entrada),
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

  const entrada = {
    nombre,
    descripcion: textoOpcional(datos, 'descripcion'),
  };

  return ejecutar('/panel/inventario', () =>
    id ? actualizarCategoriaProducto(id, entrada) : crearCategoriaProducto(entrada),
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

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

export async function guardarProducto(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_producto');
  const nombre = texto(datos, 'nombre');
  const categoria = numero(datos, 'id_categoria_p');
  const precio = numero(datos, 'precio_unitario');
  const minimo = numero(datos, 'stock_minimo');
  const maximo = numero(datos, 'stock_maximo');
  const cantidadUsoEstandar = numero(datos, 'cantidad_uso_estandar');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre del producto.');
  v.exigir(categoria !== null, 'id_categoria_p', 'Elija una categoría.');
  v.exigir(precio !== null && precio >= 0, 'precio_unitario', 'El precio no puede ser negativo.');
  v.exigir(minimo !== null && minimo >= 0, 'stock_minimo', 'El stock mínimo no puede ser negativo.');
  v.exigir(
    maximo === null || (minimo !== null && maximo >= minimo),
    'stock_maximo',
    'El stock máximo debe ser mayor o igual al mínimo.',
  );
  v.exigir(
    cantidadUsoEstandar === null || cantidadUsoEstandar > 0,
    'cantidad_uso_estandar',
    'La equivalencia debe ser mayor a cero.',
  );
  if (v.hayErrores) return v.resultado;

  const entrada = {
    nombre,
    idCategoria: categoria!,
    descripcion: textoOpcional(datos, 'descripcion'),
    unidadMedida: textoOpcional(datos, 'unidad_medida'),
    unidadUso: textoOpcional(datos, 'unidad_uso'),
    cantidadUsoEstandar,
    precioUnitario: precio!,
    stockMinimo: minimo!,
    stockMaximo: maximo,
    estado: booleano(datos, 'estado'),
  };

  // El stock actual no se edita desde este formulario, y tampoco se puede fijar
  // al dar de alta: eso lo garantiza `crearProducto`, no esta accion.
  return ejecutar('/panel/inventario', () =>
    id ? actualizarProducto(id, entrada) : crearProducto(entrada),
  );
}
