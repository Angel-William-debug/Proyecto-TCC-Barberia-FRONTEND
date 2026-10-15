import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  listarPagosCliente,
  listarRecomendaciones,
  listarVisitasCliente,
  obtenerCliente,
  MODO_DEMO,
} from '@barber-shop/api';
import type { EstadoCobro } from '@barber-shop/tipos';
import {
  Boton,
  BotonIcono,
  ChipEstado,
  EstadoVacio,
  Icono,
  PRESENTACION_COBRO,
  Paginacion,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaEncabezado,
  Td,
  TdCompleta,
  Th,
  Tr,
  cantidad,
  fechaCorta,
  guaranies,
  plural,
  telefono as formatoTelefono,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { FormularioCliente } from '@/componentes/clientes/formulario-cliente';
import { TarjetaRecomendaciones } from '@/componentes/clientes/tarjeta-recomendaciones';
import { paginarFilas, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Perfil del cliente' };

/**
 * CU-012 — historial completo del cliente, con CU-013 (recomendaciones) al
 * costado. El documento describe la recomendación como algo que se pide
 * desde el perfil del cliente; esta pantalla es ese prerequisito.
 *
 * Desde el 15/10/2026 cada visita se despliega con sus observaciones y los
 * productos que se usaron (vistas 21 y 22), y el perfil suma los pagos del
 * cliente (23) y sus notas internas (24), que solo ve el personal.
 */
export default async function PaginaPerfilCliente({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Parametros>;
}) {
  const { id } = await params;
  const consulta = await searchParams;
  const idCliente = Number(id);
  if (!Number.isFinite(idCliente)) notFound();

  const cliente = await obtenerCliente(idCliente);
  if (!cliente) notFound();

  const [visitas, pagos, recomendaciones] = await Promise.all([
    listarVisitasCliente(idCliente),
    listarPagosCliente(idCliente).catch(() => []),
    listarRecomendaciones(idCliente).catch(() => []),
  ]);

  const pagVisitas = paginarFilas(visitas, consulta);
  const pagPagos = paginarFilas(pagos, consulta, 'pagina_pagos');
  const totalGastado = visitas.reduce((suma, h) => suma + h.costo_cobrado, 0);
  const totalPagado = pagos.filter((p) => p.estado === 'pagado').reduce((suma, p) => suma + p.monto, 0);

  return (
    <>
      <div className="mb-2">
        <Link href="/panel/clientes" className="inline-flex">
          <BotonIcono icono="chevron-left" etiqueta="Volver a clientes" variante="terciario" tamano="sm" />
        </Link>
      </div>

      <EncabezadoVista
        titulo={cliente.nombre}
        descripcion={`${formatoTelefono(cliente.telefono)}${cliente.email ? ` · ${cliente.email}` : ''}`}
        accion={
          !MODO_DEMO && (
            <Link href={`/panel/clientes/${idCliente}/pdf`} target="_blank">
              <Boton variante="secundario" icono="download">
                Exportar PDF
              </Boton>
            </Link>
          )
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          ['Visitas', String(visitas.length)],
          ['Total gastado', guaranies(totalGastado)],
          ['Pagado', guaranies(totalPagado)],
          ['Última visita', visitas[0] ? fechaCorta(visitas[0].fecha_realizacion) : '—'],
        ].map(([etiqueta, valor]) => (
          <Tarjeta key={etiqueta} className="p-4">
            <p className="text-titulillo text-terciario font-semibold tracking-[0.08em] uppercase">
              {etiqueta}
            </p>
            <p className="font-display text-principal text-display-lg mt-2 tabular-nums">{valor}</p>
          </Tarjeta>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <Tarjeta>
            <TarjetaEncabezado
              titulo="Historial de servicios"
              descripcion={`${plural(visitas.length, 'servicio realizado', 'servicios realizados')} · toque uno para ver el detalle`}
            />
            {visitas.length === 0 ? (
              <EstadoVacio
                icono="user-round"
                titulo="Sin servicios registrados"
                descripcion="Este cliente todavía no tiene turnos completados."
              />
            ) : (
              <ul className="divide-borde-sutil divide-y px-4 sm:px-6">
                {pagVisitas.filas.map((v) => (
                  <li key={v.id_historial}>
                    <details className="group py-3">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-3">
                          <Icono
                            nombre="chevron-right"
                            tamano="xs"
                            className="text-terciario transition-transform group-open:rotate-90"
                          />
                          <span className="min-w-0">
                            <span className="text-cuerpo text-principal block font-medium">{v.nombre_servicio}</span>
                            <span className="text-cuerpo-sm text-terciario block">
                              {fechaCorta(v.fecha_realizacion)} · {v.nombre_profesional}
                            </span>
                          </span>
                        </span>
                        <span className="text-cuerpo text-principal tabular-nums">{guaranies(v.costo_cobrado)}</span>
                      </summary>
                      <div className="text-cuerpo-sm mt-3 ml-7 flex flex-col gap-3">
                        <div>
                          <p className="text-titulillo text-terciario uppercase">Observaciones</p>
                          <p className="text-secundario">{v.observaciones ?? 'Sin observaciones.'}</p>
                        </div>
                        <div>
                          <p className="text-titulillo text-terciario uppercase">Productos usados</p>
                          {v.productos.length === 0 ? (
                            <p className="text-secundario">No se registraron productos.</p>
                          ) : (
                            <ul className="text-secundario">
                              {v.productos.map((p, i) => (
                                <li key={i} className="tabular-nums">
                                  {p.nombre}: {cantidad(p.cantidad)} {p.unidad ?? ''}
                                  {p.excepcion && (
                                    <span className="text-advertencia"> (con stock insuficiente)</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </details>
                  </li>
                ))}
              </ul>
            )}
            <Paginacion {...pagVisitas.paginacion} />
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado titulo="Pagos" descripcion="Cobros de sus turnos" />
            <Tabla titulo={`Pagos de ${cliente.nombre}`}>
              <TablaEncabezado>
                <Th>Turno</Th>
                <Th>Pagado el</Th>
                <Th>Método</Th>
                <Th numerico>Monto</Th>
                <Th>Estado</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {pagos.length === 0 ? (
                  <TdCompleta colSpan={5}>
                    <EstadoVacio
                      icono="receipt"
                      titulo="Sin pagos"
                      descripcion="Todavía no se le cobró ningún turno."
                    />
                  </TdCompleta>
                ) : (
                  pagPagos.filas.map((p) => (
                    <Tr key={p.id_cobro}>
                      <Td className="text-secundario" etiqueta="Turno">
                        {p.fecha_turno ? fechaCorta(p.fecha_turno) : '—'}
                      </Td>
                      <Td className="text-secundario" etiqueta="Pagado el">
                        {p.fecha_pago ? fechaCorta(p.fecha_pago) : '—'}
                      </Td>
                      <Td etiqueta="Método">{p.metodo}</Td>
                      <Td numerico etiqueta="Monto">{guaranies(p.monto)}</Td>
                      <Td etiqueta="Estado">
                        {PRESENTACION_COBRO[p.estado as EstadoCobro] ? (
                          <ChipEstado presentacion={PRESENTACION_COBRO[p.estado as EstadoCobro]} />
                        ) : (
                          p.estado
                        )}
                      </Td>
                    </Tr>
                  ))
                )}
              </TablaCuerpo>
            </Tabla>
            <Paginacion {...pagPagos.paginacion} />
          </Tarjeta>
        </div>

        <div className="flex flex-col gap-6">
          <Tarjeta>
            <TarjetaEncabezado
              titulo="Notas internas"
              descripcion="Solo las ve el personal, nunca el cliente"
              accion={!MODO_DEMO && <FormularioCliente cliente={cliente} />}
            />
            <p className="text-cuerpo-sm text-secundario px-4 pb-5 whitespace-pre-line sm:px-6">
              {cliente.notas_internas ?? 'Sin notas. Use el lápiz para agregar alergias, preferencias o lo que convenga recordar.'}
            </p>
          </Tarjeta>

          <TarjetaRecomendaciones idCliente={idCliente} iniciales={recomendaciones} />
        </div>
      </div>
    </>
  );
}
