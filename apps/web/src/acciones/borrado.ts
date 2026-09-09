/**
 * Las dos acciones del borrado logico, para las ocho entidades que lo admiten.
 *
 * No van en el archivo de cada modulo porque son la MISMA operacion sobre
 * tablas distintas: `BotonBorrar` y `BotonRestaurar` las llaman con el nombre
 * de la tabla como dato. Repetirlas por modulo serian ocho copias de tres
 * lineas y ocho lugares donde olvidarse de exigir la sesion.
 */
'use server';

import { borrarLogico, exigirSesion, restaurar } from '@barber-shop/api';
import type { TablaEscribible } from '@barber-shop/api';

import { ejecutar } from './base';
import type { ResultadoAccion } from './base';

/** Rutas que hay que revalidar al borrar o restaurar cada entidad. */
const RUTA: Record<TablaEscribible, string> = {
  clientes: '/panel/clientes',
  servicios: '/panel/servicios',
  profesionales: '/panel/barberos',
  productos: '/panel/inventario',
  proveedores: '/panel/compras',
  categorias_servicio: '/panel/servicios',
  categorias_producto: '/panel/inventario',
  metodos_pago: '/panel/configuracion/metodos-pago',
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
