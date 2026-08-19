import Link from 'next/link';
import { notFound } from 'next/navigation';

import { listarHistorialCliente, listarRecomendaciones, obtenerCliente } from '@barber-shop/api';
import {
  BotonIcono,
  EstadoVacio,
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
  plural,
  telefono as formatoTelefono,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { TarjetaRecomendaciones } from '@/componentes/formularios/tarjeta-recomendaciones';

export const metadata = { title: 'Perfil del cliente' };

/**
 * CU-012 — historial completo del cliente, con CU-013 (recomendaciones) al
 * costado. El documento describe la recomendación como algo que se pide
 * desde el perfil del cliente; esta pantalla es ese prerequisito.
 */
export default async function PaginaPerfilCliente({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idCliente = Number(id);
  if (!Number.isFinite(idCliente)) notFound();

  const cliente = await obtenerCliente(idCliente);
  if (!cliente) notFound();

  const [historial, recomendaciones] = await Promise.all([
    listarHistorialCliente(idCliente),
    listarRecomendaciones(idCliente).catch(() => []),
  ]);

  const totalGastado = historial.reduce((suma, h) => suma + h.costo_cobrado, 0);

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
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Visitas', String(historial.length)],
          ['Total gastado', guaranies(totalGastado)],
          [
            'Última visita',
            historial[0] ? fechaCorta(historial[0].fecha_realizacion) : '—',
          ],
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

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Historial de servicios"
            descripcion={plural(historial.length, 'servicio realizado', 'servicios realizados')}
          />
          <Tabla titulo={`Historial de ${cliente.nombre}`}>
            <TablaEncabezado>
              <Th>Fecha</Th>
              <Th>Servicio</Th>
              <Th>Barbero</Th>
              <Th numerico>Costo</Th>
            </TablaEncabezado>
            <TablaCuerpo>
              {historial.length === 0 ? (
                <TdCompleta colSpan={4}>
                  <EstadoVacio
                    icono="user-round"
                    titulo="Sin servicios registrados"
                    descripcion="Este cliente todavía no tiene turnos completados."
                  />
                </TdCompleta>
              ) : (
                historial.map((h, i) => (
                  <Tr key={i}>
                    <Td className="text-secundario" etiqueta="Fecha">
                      {fechaCorta(h.fecha_realizacion)}
                    </Td>
                    <Td className="font-medium" etiqueta="Servicio">
                      {h.nombre_servicio}
                    </Td>
                    <Td className="text-secundario" etiqueta="Barbero">
                      {h.nombre_profesional}
                    </Td>
                    <Td numerico etiqueta="Costo">
                      {guaranies(h.costo_cobrado)}
                    </Td>
                  </Tr>
                ))
              )}
            </TablaCuerpo>
          </Tabla>
        </Tarjeta>

        <TarjetaRecomendaciones idCliente={idCliente} iniciales={recomendaciones} />
      </div>
    </>
  );
}
