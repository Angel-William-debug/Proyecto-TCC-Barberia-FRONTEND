import { listarAuditoria } from '@barber-shop/api';
import { ACCIONES_AUDITORIA } from '@barber-shop/tipos';
import {
  BarraFiltros,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  RangoFechas,
  SelectorFiltro,
  SelectorMultiple,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  Td,
  TdCompleta,
  Th,
  Tr,
  fechaHora,
  identificador,
  type Presentacion,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';
import { comunes, lista, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Auditoría' };

const PRESENTACION_ACCION: Record<string, Presentacion> = {
  INSERT: { etiqueta: 'Alta', tono: 'exito', icono: 'plus' },
  UPDATE: { etiqueta: 'Modificación', tono: 'info', icono: 'pencil' },
  DELETE: { etiqueta: 'Baja', tono: 'peligro', icono: 'trash-2' },
};

const OPCIONES_ACCION = ACCIONES_AUDITORIA.map((a) => ({
  valor: a,
  etiqueta: PRESENTACION_ACCION[a]!.etiqueta,
}));
const ETIQUETAS_ACCION = Object.fromEntries(
  ACCIONES_AUDITORIA.map((a) => [a, PRESENTACION_ACCION[a]!.etiqueta]),
);

/** Las tablas que el disparador de auditoría registra. */
const TABLAS = [
  'citas',
  'clientes',
  'cobros_cliente',
  'pagos_profesional',
  'productos',
  'profesionales',
  'servicios',
  'usuarios',
].map((t) => ({ valor: t, etiqueta: t }));

/**
 * Registro de auditoría.
 *
 * Solo el administrador puede leerlo: así lo fijan las políticas RLS de la
 * base. Para cualquier otro rol la consulta devuelve una lista vacía, y esta
 * pantalla muestra el estado vacío en lugar de un error de permisos.
 */
export default async function PaginaAuditoria({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const base = comunes(params);
  const registros = await listarAuditoria({
    busqueda: base.busqueda,
    desde: base.desde,
    hasta: base.hasta,
    acciones: lista(params, 'accion'),
    tabla: texto(params, 'tabla'),
  });

  return (
    <>
      <EncabezadoVista
        titulo="Auditoría"
        descripcion="Quién cambió qué, y cuándo. Los últimos 100 movimientos."
      />

      <Tarjeta>
        <BarraFiltros>
          <CampoBusqueda placeholder="Usuario o detalle" />
          <SelectorFiltro
            nombre="tabla"
            etiqueta="Tabla"
            textoTodos="Todas las tablas"
            opciones={TABLAS}
          />
          <SelectorMultiple nombre="accion" etiqueta="Acción" opciones={OPCIONES_ACCION} />
          <RangoFechas etiqueta="Fecha" />
        </BarraFiltros>

        <FiltrosActivos
          total={registros.length}
          sustantivo={['movimiento', 'movimientos']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            tabla: { titulo: 'Tabla' },
            accion: { titulo: 'Acción', valores: ETIQUETAS_ACCION },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Registro de auditoría del sistema">
          <TablaEncabezado>
            <Th>Fecha</Th>
            <Th>Usuario</Th>
            <Th>Tabla</Th>
            <Th>Acción</Th>
            <Th>Registro</Th>
            <Th>Detalle</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {registros.length === 0 ? (
              <TdCompleta colSpan={6}>
                <EstadoVacio
                  icono="scroll-text"
                  titulo="No hay movimientos registrados"
                  descripcion="El registro se completa solo a medida que se usa el sistema. También puede estar vacío por los filtros aplicados, o si su rol no tiene permiso para consultarlo."
                />
              </TdCompleta>
            ) : (
              registros.map((r) => (
                <Tr key={r.id_auditoria}>
                  <Td className="text-secundario whitespace-nowrap" etiqueta="Fecha">
                    {fechaHora(r.fecha_accion)}
                  </Td>
                  <Td className="font-medium" etiqueta="Usuario">{r.nombre_usuario ?? 'Sistema'}</Td>
                  <Td className="text-secundario font-mono" etiqueta="Tabla">{r.tabla_afectada}</Td>
                  <Td etiqueta="Acción">
                    <ChipEstado
                      presentacion={
                        PRESENTACION_ACCION[r.accion] ?? {
                          etiqueta: r.accion,
                          tono: 'neutro',
                          icono: 'circle-alert',
                        }
                      }
                    />
                  </Td>
                  <Td className="font-mono" etiqueta="Registro">{identificador(r.registro_id)}</Td>
                  <Td className="text-secundario" etiqueta="Detalle">{r.detalle ?? '—'}</Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>
    </>
  );
}
