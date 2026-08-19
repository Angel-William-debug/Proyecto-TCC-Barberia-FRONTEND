'use server';

import { actualizar, borrarLogico, crear, exigirSesion, restaurar } from '@barber-shop/api';
import type { TablaEscribible } from '@barber-shop/api';

import {
  CORREO,
  Validacion,
  booleano,
  ejecutar,
  numero,
  texto,
  textoOpcional,
  type ResultadoAccion,
} from './base';

/**
 * Acciones de servidor de las entidades que se cargan desde un formulario.
 *
 * Cada una valida lo que el formulario puede comprobar barato -campos vacios,
 * formatos, rangos- y deja el resto a la base. Las reglas de negocio duras no
 * se duplican aca: si el precio no puede ser negativo, eso lo dice un CHECK, y
 * `traducirError` convierte el rechazo en un mensaje legible.
 *
 * El patron es siempre el mismo: leer, validar, escribir, revalidar la ruta
 * para que la tabla se actualice sola.
 */


// ---------------------------------------------------------------------------
// Clientes — CU-002
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Servicios — CU-003
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Barberos — CU-004. La tabla es `profesionales`; en pantalla se lee «Barbero».
// ---------------------------------------------------------------------------

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

  const fila = {
    nombre,
    especialidad: textoOpcional(datos, 'especialidad'),
    tipo: textoOpcional(datos, 'tipo'),
    porcentaje_com: comision,
    estado: booleano(datos, 'estado'),
  };

  return ejecutar('/panel/barberos', () =>
    id ? actualizar('profesionales', id, fila) : crear('profesionales', fila),
  );
}

// ---------------------------------------------------------------------------
// Productos — modulo 6
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

  const fila = {
    nombre,
    id_categoria_p: categoria,
    descripcion: textoOpcional(datos, 'descripcion'),
    unidad_medida: textoOpcional(datos, 'unidad_medida'),
    unidad_uso: textoOpcional(datos, 'unidad_uso'),
    cantidad_uso_estandar: cantidadUsoEstandar,
    precio_unitario: precio,
    stock_minimo: minimo,
    stock_maximo: maximo,
    estado: booleano(datos, 'estado'),
  };

  // El stock actual NO se edita desde este formulario: se mueve con entradas,
  // salidas y ajustes, que dejan su rastro en movimientos_inventario. Un campo
  // editable aca permitiria cambiar el stock sin dejar constancia de por que.
  return ejecutar('/panel/inventario', () =>
    id ? actualizar('productos', id, fila) : crear('productos', { ...fila, stock_actual: 0 }),
  );
}

// ---------------------------------------------------------------------------
// Proveedores — CU-016
// ---------------------------------------------------------------------------

export async function guardarProveedor(datos: FormData): Promise<ResultadoAccion> {
  const id = numero(datos, 'id_proveedor');
  const nombre = texto(datos, 'nombre');
  const email = textoOpcional(datos, 'email');

  const v = new Validacion();
  v.exigir(nombre.length >= 3, 'nombre', 'Ingrese el nombre del proveedor.');
  v.exigir(!email || CORREO.test(email), 'email', 'Ingrese un correo con el formato nombre@dominio.com');
  if (v.hayErrores) return v.resultado;

  const fila = {
    nombre,
    email,
    telefono: textoOpcional(datos, 'telefono'),
    direccion: textoOpcional(datos, 'direccion'),
    estado: booleano(datos, 'estado'),
  };

  return ejecutar('/panel/compras', () =>
    id ? actualizar('proveedores', id, fila) : crear('proveedores', fila),
  );
}

// ---------------------------------------------------------------------------
// Borrado y restauracion
// ---------------------------------------------------------------------------

/** Rutas que hay que revalidar al borrar o restaurar cada entidad. */
const RUTA: Record<TablaEscribible, string> = {
  clientes: '/panel/clientes',
  servicios: '/panel/servicios',
  profesionales: '/panel/barberos',
  productos: '/panel/inventario',
  proveedores: '/panel/compras',
  categorias_servicio: '/panel/servicios',
  categorias_producto: '/panel/inventario',
  metodos_pago: '/panel/configuracion',
  servicio_producto: '/panel/servicios',
  cobros_cliente: '/panel/cobros',
  facturas: '/panel/facturas',
  usuarios: '/panel/usuarios',
};

/**
 * Borrado logico. Deja constancia de quien lo hizo, por eso exige sesion.
 *
 * Distinto de desactivar: desactivar es un estado de negocio reversible
 * -«este servicio no se ofrece por ahora»-, borrar es una baja.
 */
export async function borrarRegistro(
  tabla: TablaEscribible,
  id: number,
): Promise<ResultadoAccion> {
  return ejecutar(RUTA[tabla], async () => {
    const usuario = await exigirSesion();
    await borrarLogico(tabla, id, usuario.idUsuario);
  });
}

/**
 * Restauracion.
 *
 * Puede fallar legitimamente: si mientras el registro estuvo borrado otro tomo
 * su valor unico, restaurarlo dejaria dos vigentes iguales. El mensaje que
 * devuelve `errores.ts` nombra ese caso, porque el registro que bloquea estuvo
 * invisible todo el tiempo y de otro modo nadie entiende el rechazo.
 */
export async function restaurarRegistro(
  tabla: TablaEscribible,
  id: number,
): Promise<ResultadoAccion> {
  return ejecutar(RUTA[tabla], () => restaurar(tabla, id));
}
