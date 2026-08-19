import Link from 'next/link';

import { listarFacturas } from '@barber-shop/api';
import { ESTADOS_FACTURA } from '@barber-shop/tipos';
import {
  BarraFiltros,
  BotonIcono,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  RangoFechas,
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
  guaranies,
  identificador,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { comunes, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Facturas' };

const ETIQUETA_ESTADO: Record<string, string> = { emitida: 'Emitida', anulada: 'Anulada' };
const OPCIONES_ESTADO = ESTADOS_FACTURA.map((e) => ({ valor: e, etiqueta: ETIQUETA_ESTADO[e]! }));

/**
 * CU-025 (anexo) — comprobantes internos de venta.
 *
 * Se emiten desde un cobro ya pagado (botón "Facturar" en `/panel/cobros`).
 * Sin validez fiscal: no reemplazan una factura legal ante la SET.
 */
export default async function PaginaFacturas({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const filtro = comunes(params);

  const facturas = await listarFacturas(filtro);
  const totalEmitido = facturas
    .filter((f) => f.estado === 'emitida')
    .reduce((suma, f) => suma + f.total, 0);

  return (
    <>
      <EncabezadoVista
        titulo="Facturas"
        descripcion="Comprobantes internos de venta, sin validez fiscal"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        {[
          ['Facturas emitidas', String(facturas.filter((f) => f.estado === 'emitida').length)],
          ['Total facturado', guaranies(totalEmitido)],
        ].map(([etiqueta, valor]) => (
          <Tarjeta key={etiqueta} className="p-4">
            <p className="text-titulillo text-terciario font-semibold tracking-[0.08em] uppercase">
              {etiqueta}
            </p>
            <p className="font-display text-principal text-display-lg mt-2 tabular-nums">
              {valor}
            </p>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta>
        <BarraFiltros>
          <CampoBusqueda placeholder="Nombre del cliente" />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ESTADO} />
          <RangoFechas etiqueta="Fecha de emisión" />
        </BarraFiltros>

        <FiltrosActivos
          total={facturas.length}
          sustantivo={['factura', 'facturas']}
          etiquetas={{
            q: { titulo: 'Cliente' },
            estado: { titulo: 'Estado', valores: ETIQUETA_ESTADO },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Facturas emitidas">
          <TablaEncabezado>
            <Th>N.o</Th>
            <Th>Cliente</Th>
            <Th>Turno</Th>
            <Th>Fecha de emisión</Th>
            <Th numerico>Total</Th>
            <Th>Estado</Th>
            <Th>
              <span className="solo-lectores">Acciones</span>
            </Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {facturas.length === 0 ? (
              <TdCompleta colSpan={7}>
                <EstadoVacio
                  icono="file-text"
                  titulo="No se encontraron facturas"
                  descripcion="Emita una desde un cobro pagado en la pantalla de Cobros."
                />
              </TdCompleta>
            ) : (
              facturas.map((f) => (
                <Tr key={f.id_factura} interactiva>
                  <Td className="font-mono" etiqueta="N.o">
                    {String(f.id_factura).padStart(6, '0')}
                  </Td>
                  <Td className="font-medium" etiqueta="Cliente">
                    {f.nombre_cliente}
                  </Td>
                  <Td className="text-secundario" etiqueta="Turno">
                    {identificador(f.id_cita)}
                  </Td>
                  <Td className="text-secundario" etiqueta="Fecha de emisión">
                    {fechaHora(f.fecha_emision)}
                  </Td>
                  <Td numerico etiqueta="Total">
                    {guaranies(f.total)}
                  </Td>
                  <Td etiqueta="Estado">
                    <ChipEstado
                      presentacion={
                        f.estado === 'emitida'
                          ? { etiqueta: 'Emitida', tono: 'exito', icono: 'circle-check' }
                          : { etiqueta: 'Anulada', tono: 'peligro', icono: 'ban' }
                      }
                    />
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <Link href={`/panel/facturas/${f.id_factura}/pdf`} target="_blank">
                      <BotonIcono icono="download" etiqueta={`Descargar factura ${f.id_factura}`} variante="terciario" tamano="sm" />
                    </Link>
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
