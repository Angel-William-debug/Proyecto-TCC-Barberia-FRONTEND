/**
 * Alta, edicion, borrado logico y restauracion.
 *
 * Las cuatro operaciones son identicas salvo por la tabla y el nombre de su
 * clave primaria, asi que van una vez y no seis. Escribir `crearServicio`,
 * `crearProducto`, `crearProveedor`... produciria seis copias del mismo
 * `insert` que se van separando con el tiempo.
 *
 * Lo que SI es especifico de cada entidad -que campos exige, como se validan-
 * vive en las acciones de servidor de `apps/web/src/acciones`, que es donde
 * corresponde: es una regla del formulario, no del acceso a datos.
 *
 * Las reglas de negocio duras no estan aca ni alla: las hace cumplir la base
 * con sus 38 restricciones y 19 disparadores, y `errores.ts` traduce el
 * rechazo. Duplicarlas en el frontend solo garantizaria que algun dia las dos
 * versiones difieran.
 */

import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { ErrorAplicacion, traducirError } from '../errores';

/** Tablas que admiten escritura desde un formulario. */
export type TablaEscribible =
  | 'clientes'
  | 'servicios'
  | 'profesionales'
  | 'productos'
  | 'proveedores'
  | 'categorias_servicio'
  | 'categorias_producto'
  | 'metodos_pago';

/** Nombre de la clave primaria de cada tabla. */
export const CLAVE_PRIMARIA: Record<TablaEscribible, string> = {
  clientes: 'id_cliente',
  servicios: 'id_servicio',
  profesionales: 'id_profesional',
  productos: 'id_producto',
  proveedores: 'id_proveedor',
  categorias_servicio: 'id_categoria',
  categorias_producto: 'id_categoria_p',
  metodos_pago: 'id_metodo',
};

/**
 * En modo demostracion no hay base donde escribir.
 *
 * Se exporta porque las escrituras que no pasan por `crear`/`actualizar`
 * -la liquidacion de comisiones, el alta de un turno con su detalle- necesitan
 * exactamente el mismo guardia. Sin el, esas funciones intentarian abrir un
 * cliente de Supabase que en modo demostracion no tiene credenciales, y el
 * usuario recibiria un error de conexion en lugar de la explicacion real.
 */
export function rechazarSiEsDemo() {
  if (MODO_DEMO) {
    throw new ErrorAplicacion(
      'El modo demostración es de solo lectura. Para guardar, configure la conexión ' +
        'con la base de datos y ponga NEXT_PUBLIC_MODO_DEMO en false.',
    );
  }
}

/** Alta. Devuelve el identificador del registro creado. */
export async function crear(tabla: TablaEscribible, datos: Record<string, unknown>): Promise<number> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();
  const pk = CLAVE_PRIMARIA[tabla];

  const { data, error } = await supabase.from(tabla).insert(datos).select(pk).single();

  if (error) throw traducirError(error);

  // El `select` recibe el nombre de la columna como variable, asi que Supabase
  // no puede inferir la forma de la fila y la tipa como error. Se pasa por
  // `unknown` a proposito: aca sabemos lo que devuelve y el tipado generico es
  // el precio de no repetir esta funcion ocho veces.
  return (data as unknown as Record<string, number>)[pk]!;
}

/**
 * Edicion parcial.
 *
 * `updated_at` no se envia nunca: lo pone el disparador de la base. Mandarlo
 * desde aca permitiria que un reloj mal puesto en la computadora del usuario
 * quedara guardado como fecha de modificacion.
 */
export async function actualizar(
  tabla: TablaEscribible,
  id: number,
  cambios: Record<string, unknown>,
): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { error } = await supabase
    .from(tabla)
    .update(cambios)
    .eq(CLAVE_PRIMARIA[tabla], id)
    .eq('deleted', false);

  if (error) throw traducirError(error);
}

/**
 * Borrado logico. Distinto de desactivar: ver la nota de `clientes.ts`.
 *
 * `deleted_at` lo completa el disparador; aca solo se marca la bandera y se
 * deja constancia de quien lo hizo.
 */
export async function borrarLogico(
  tabla: TablaEscribible,
  id: number,
  idUsuario: number,
): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { error } = await supabase
    .from(tabla)
    .update({ deleted: true, deleted_user_id: idUsuario })
    .eq(CLAVE_PRIMARIA[tabla], id);

  if (error) throw traducirError(error);
}

/**
 * Restauracion.
 *
 * PUEDE FALLAR, y el fallo es correcto: si mientras el registro estuvo borrado
 * otro tomo su valor unico -el correo de un cliente, el nombre de un servicio
 * dentro de su categoria- restaurarlo dejaria dos vigentes iguales, y el
 * indice unico parcial lo rechaza. `traducirError` convierte ese rechazo en un
 * mensaje que nombra el caso.
 */
export async function restaurar(tabla: TablaEscribible, id: number): Promise<void> {
  rechazarSiEsDemo();

  const supabase = await clienteServidor();

  const { error } = await supabase
    .from(tabla)
    .update({ deleted: false })
    .eq(CLAVE_PRIMARIA[tabla], id);

  if (error) throw traducirError(error);
}
