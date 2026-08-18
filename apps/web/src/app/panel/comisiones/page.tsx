import { comisionesPendientes, listarComisiones, listarProfesionales } from '@barber-shop/api';
import { ESTADOS_COMISION } from '@barber-shop/tipos';
import {
  BarraFiltros,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  PRESENTACION_COMISION,
  RangoFechas,
  SelectorFiltro,
  SelectorMultiple,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaEncabezado,
  Td,
  TdCompleta,
  Th,
  Tr,
  fechaCorta,
  guaranies,
  porcentaje,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';
import { PanelLiquidacion } from '@/componentes/formularios/panel-liquidacion';
import { comunes, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Comisiones' };

const OPCIONES_ESTADO = ESTADOS_COMISION.map((e) => ({
  valor: e,
  etiqueta: PRESENTACION_COMISION[e].etiqueta,
}));
const ETIQUETAS_ESTADO = Object.fromEntries(
  ESTADOS_COMISION.map((e) => [e, PRESENTACION_COMISION[e].etiqueta]),
);

/**
 * CU-009 — Liquidación de comisiones.
 *
 * La comisión se crea sola: cuando se cierra un servicio, un disparador de la
 * base la calcula sobre el porcentaje del barbero. Un pago liquidado no puede
 * modificarse ni revertirse (RN-027), por eso esas filas no ofrecen acciones.
 */
export default async function PaginaComisiones({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const filtro = { ...comunes(params), barbero: texto(params, 'barbero') };

  const [detalle, resumen, barberos] = await Promise.all([
    listarComisiones(filtro),
    comisionesPendientes().catch(() => []),
    listarProfesionales().catch(() => []),
  ]);

  const totalPendiente = detalle
    .filter((c) => c.estado === 'pendiente')
    .reduce((suma, c) => suma + c.monto, 0);

  return (
    <>
      <EncabezadoVista
        titulo="Comisiones"
        descripcion={`${guaranies(totalPendiente)} pendientes de liquidar`}
        accion={
          <PanelLiquidacion
            resumen={resumen.map((r) => ({
              nombre: r.nombre_profesional,
              idProfesional: r.id_profesional,
              servicios: r.cantidad_servicios,
              total: r.total_comision,
            }))}
          />
        }
      />

      {resumen.length > 0 && (
        <Tarjeta className="mb-6">
          <TarjetaEncabezado
            titulo="Resumen por barbero"
            descripcion="Solo comisiones todavía no liquidadas"
          />
          <Tabla titulo="Comisiones pendientes agrupadas por barbero">
            <TablaEncabezado>
              <Th>Barbero</Th>
              <Th numerico>Servicios</Th>
              <Th numerico>Total a liquidar</Th>
            </TablaEncabezado>
            <TablaCuerpo>
              {resumen.map((r) => (
                <Tr key={r.id_profesional}>
                  <Td className="font-medium" etiqueta="Barbero">{r.nombre_profesional}</Td>
                  <Td numerico etiqueta="Servicios">{r.cantidad_servicios}</Td>
                  <Td numerico className="font-medium" etiqueta="Total a liquidar">
                    {guaranies(r.total_comision)}
                  </Td>
                </Tr>
              ))}
            </TablaCuerpo>
          </Tabla>
        </Tarjeta>
      )}

      <Tarjeta>
        <TarjetaEncabezado titulo="Detalle" descripcion="Una fila por servicio realizado" />

        <BarraFiltros>
          <CampoBusqueda placeholder="Barbero o servicio" />
          <SelectorFiltro
            nombre="barbero"
            etiqueta="Barbero"
            textoTodos="Todos los barberos"
            opciones={barberos.map((b) => ({ valor: b.nombre, etiqueta: b.nombre }))}
          />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ESTADO} />
          <RangoFechas etiqueta="Fecha del servicio" />
        </BarraFiltros>

        <FiltrosActivos
          total={detalle.length}
          sustantivo={['comisión', 'comisiones']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            barbero: { titulo: 'Barbero' },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ESTADO },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Detalle de comisiones por servicio">
          <TablaEncabezado>
            <Th>Barbero</Th>
            <Th>Servicio</Th>
            <Th>Fecha</Th>
            <Th numerico>Cobrado</Th>
            <Th numerico>%</Th>
            <Th numerico>Comisión</Th>
            <Th>Estado</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {detalle.length === 0 ? (
              <TdCompleta colSpan={7}>
                <EstadoVacio
                  icono="hand-coins"
                  titulo="No se encontraron comisiones"
                  descripcion="Ninguna comisión cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              detalle.map((c) => (
                <Tr key={c.id_pago_prof} interactiva>
                  <Td className="font-medium" etiqueta="Barbero">{c.nombre_profesional}</Td>
                  <Td className="text-secundario" etiqueta="Servicio">{c.nombre_servicio}</Td>
                  <Td className="text-secundario" etiqueta="Fecha">{fechaCorta(c.fecha_realizacion)}</Td>
                  <Td numerico etiqueta="Cobrado">{guaranies(c.costo_cobrado)}</Td>
                  <Td numerico className="text-secundario" etiqueta="%">
                    {porcentaje(c.porcentaje)}
                  </Td>
                  <Td numerico className="font-medium" etiqueta="Comisión">
                    {guaranies(c.monto)}
                  </Td>
                  <Td etiqueta="Estado">
                    <ChipEstado presentacion={PRESENTACION_COMISION[c.estado]} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>
    </>
  );
}
