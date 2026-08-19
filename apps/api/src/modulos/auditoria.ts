/**
 * Auditoria: el registro de quien hizo que. Transversal, sin CU propio en el
 * documento v4 -CU-019 es "Gestionar Usuarios y Roles", un caso distinto.
 *
 * Es de solo lectura por diseno. La escriben los disparadores de la base, no
 * la aplicacion: una bitacora que la aplicacion pueda editar no sirve como
 * bitacora.
 */

import type { AuditoriaDeLista } from '@barber-shop/tipos';

import { AUDITORIA_DEMO } from '../demo/datos-operacion';
import { MODO_DEMO } from '../demo/modo';
import { clienteServidor } from '../supabase/cliente-servidor';
import { traducirError } from '../errores';
import { coincideEstado, coincideTexto, entreFechas, type FiltroTabla } from '../compartido/filtros';
import { uno } from '../compartido/relaciones';

export interface FiltroAuditoria extends FiltroTabla {
  /** Nombre de la tabla afectada. */
  tabla?: string;
  /** `INSERT`, `UPDATE` o `DELETE`. */
  acciones?: string[];
}

/**
 * Registro de auditoría. Solo el administrador puede leerlo: así lo fijan las
 * políticas RLS, de modo que para cualquier otro rol esta consulta devuelve
 * una lista vacía en lugar de un error.
 */
export async function listarAuditoria(
  filtro: FiltroAuditoria = {},
): Promise<AuditoriaDeLista[]> {
  const filtrar = (filas: AuditoriaDeLista[]) =>
    filas.filter(
      (r) =>
        coincideTexto([r.nombre_usuario, r.detalle, r.tabla_afectada], filtro.busqueda) &&
        coincideEstado(r.accion, filtro.acciones) &&
        (!filtro.tabla || r.tabla_afectada === filtro.tabla) &&
        entreFechas(r.fecha_accion, filtro.desde, filtro.hasta),
    );

  if (MODO_DEMO) return filtrar(AUDITORIA_DEMO);

  const supabase = await clienteServidor();

  let consulta = supabase
    .from('auditoria')
    .select('id_auditoria, tabla_afectada, accion, registro_id, detalle, fecha_accion, usuarios ( nombre )')
    .order('fecha_accion', { ascending: false })
    .limit(200);

  if (filtro.acciones?.length) consulta = consulta.in('accion', filtro.acciones);
  if (filtro.tabla) consulta = consulta.eq('tabla_afectada', filtro.tabla);
  if (filtro.desde) consulta = consulta.gte('fecha_accion', `${filtro.desde}T00:00:00`);
  if (filtro.hasta) consulta = consulta.lte('fecha_accion', `${filtro.hasta}T23:59:59`);

  const { data, error } = await consulta;
  if (error) throw traducirError(error);

  return filtrar(
    (data ?? []).map((f) => ({
      id_auditoria: f.id_auditoria,
      nombre_usuario: uno<{ nombre: string }>(f.usuarios)?.nombre ?? null,
      tabla_afectada: f.tabla_afectada,
      accion: f.accion,
      registro_id: f.registro_id,
      detalle: f.detalle,
      fecha_accion: f.fecha_accion,
    })),
  );
}
