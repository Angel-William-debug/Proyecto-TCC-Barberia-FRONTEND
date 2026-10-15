import Link from 'next/link';

import {
  comisionesPendientes,
  ingresosPorPeriodo,
  listarAgenda,
  listarAlertas,
  listarNotificaciones,
  listarPedidos,
  listarProductosConNivel,
  resumenKpis,
  serviciosMasSolicitados,
} from '@barber-shop/api';
import {
  ChipEstado,
  EstadoVacio,
  Indicador,
  PRESENTACION_CITA,
  Tarjeta,
  TarjetaEncabezado,
  ZONA_HORARIA,
  guaranies,
  hora,
  plural,
  porcentaje,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { GraficoIngresos } from '@/componentes/reportes/grafico-ingresos';

export const metadata = { title: 'Tablero' };

/**
 * Tablero del administrador (vista 77 del anexo, CU-024; 15/10/2026).
 *
 * La pantalla de inicio del administrador: en un vistazo, cómo va el mes,
 * qué pasa hoy y qué pide atención. Cada tarjeta lleva a la pantalla donde se
 * resuelve. Los números salen de las mismas funciones que Reportes, Agenda y
 * Notificaciones, así que no pueden contradecirse.
 */
export default async function PaginaTablero() {
  const ahora = new Date();
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(ahora);
  const mes = hoy.slice(0, 7);
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const ultimoDia = new Date(Date.UTC(a, m, 0)).getUTCDate();
  const desde = `${mes}-01`;
  const hasta = `${mes}-${String(ultimoDia).padStart(2, '0')}`;

  const [kpis, ingresos, agendaHoy, alertas, caidos, comisiones, pedidos, solicitados, productos] = await Promise.all([
    resumenKpis(desde, hasta),
    ingresosPorPeriodo().catch(() => []),
    listarAgenda({ desde: hoy, hasta: hoy }).catch(() => []),
    listarAlertas({ soloNoResueltas: true }).catch(() => []),
    listarNotificaciones({ soloPorAtender: true }).catch(() => []),
    comisionesPendientes().catch(() => []),
    listarPedidos({ estados: ['pedido'] }).catch(() => []),
    serviciosMasSolicitados(5).catch(() => []),
    listarProductosConNivel({}).catch(() => []),
  ]);
  // El mismo criterio que la cifra «En nivel crítico» de Inventario.
  const criticos = productos.filter((p) => p.nivel === 'sin_stock' || p.nivel === 'critico').length;

  const vigentesHoy = agendaHoy.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmado');
  const proximos = vigentesHoy.filter((c) => new Date(c.fecha_hora).getTime() >= ahora.getTime()).slice(0, 6);
  const porLiquidar = comisiones.reduce((n, c) => n + c.total_comision, 0);
  const atencion = alertas.length + caidos.length;
  const nombreMes = new Intl.DateTimeFormat('es-PY', { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${mes}-15T12:00:00Z`),
  );

  return (
    <>
      <EncabezadoVista titulo="Tablero" descripcion={`Cómo va ${nombreMes}, qué pasa hoy y qué pide atención`} />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador etiqueta="Ingresos del mes" valor={guaranies(kpis.total_ingresos)} icono="receipt" />
        <Indicador etiqueta="Servicios completados" valor={String(kpis.servicios_completados)} icono="sparkles" />
        <Indicador etiqueta="Clientes atendidos" valor={String(kpis.clientes_atendidos)} icono="user-round" />
        <Indicador etiqueta="Cancelaciones" valor={porcentaje(kpis.tasa_cancelacion)} icono="circle-x" />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Hoy"
            descripcion={plural(vigentesHoy.length, 'turno por atender', 'turnos por atender')}
            accion={
              <Link href="/panel/agenda" className="text-cuerpo-sm text-marca font-medium">
                Agenda
              </Link>
            }
          />
          {proximos.length === 0 ? (
            <EstadoVacio icono="calendar-days" titulo="No quedan turnos hoy" />
          ) : (
            <ul className="divide-borde-sutil divide-y px-4 pb-3 sm:px-6">
              {proximos.map((c) => (
                <li key={c.id_cita} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="text-cuerpo text-principal block truncate">{c.cliente.nombre}</span>
                    <span className="text-cuerpo-sm text-terciario tabular-nums">
                      {hora(c.fecha_hora)} a {hora(c.fechaHoraFin)}
                    </span>
                  </span>
                  <ChipEstado presentacion={PRESENTACION_CITA[c.estado]} />
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        <Tarjeta>
          <TarjetaEncabezado titulo="Pide atención" descripcion="Lo que alguien tiene que resolver" />
          <ul className="divide-borde-sutil divide-y px-4 pb-3 sm:px-6">
            {[
              {
                texto: plural(criticos, 'producto en nivel crítico', 'productos en nivel crítico'),
                href: '/panel/inventario',
                activo: criticos > 0,
              },
              {
                texto: plural(caidos.length, 'recordatorio que no salió', 'recordatorios que no salieron'),
                href: '/panel/notificaciones',
                activo: caidos.length > 0,
              },
              {
                texto: plural(pedidos.length, 'orden de compra esperando entrega', 'órdenes de compra esperando entrega'),
                href: '/panel/compras',
                activo: pedidos.length > 0,
              },
              {
                texto: `${guaranies(porLiquidar)} en comisiones por liquidar`,
                href: '/panel/comisiones',
                activo: porLiquidar > 0,
              },
            ].map((f) => (
              <li key={f.href}>
                <Link
                  href={f.href}
                  className="hover:text-marca text-cuerpo flex items-center justify-between gap-3 py-2.5"
                >
                  <span className={f.activo ? 'text-principal' : 'text-terciario'}>{f.texto}</span>
                  <span aria-hidden="true" className="text-terciario">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="text-cuerpo-sm text-terciario px-4 pb-4 sm:px-6">
            {atencion === 0 ? 'Nada urgente.' : plural(atencion, 'aviso en la bandeja', 'avisos en la bandeja')}
          </p>
        </Tarjeta>

        <Tarjeta>
          <TarjetaEncabezado
            titulo="Lo más pedido"
            descripcion="Servicios, desde el inicio"
            accion={
              <Link href="/panel/reportes" className="text-cuerpo-sm text-marca font-medium">
                Reportes
              </Link>
            }
          />
          {solicitados.length === 0 ? (
            <EstadoVacio icono="sparkles" titulo="Todavía no hay servicios realizados" />
          ) : (
            <ol className="px-4 pb-4 sm:px-6">
              {solicitados.map((s, i) => {
                const maximo = solicitados[0]!.veces_realizado || 1;
                return (
                  <li key={s.id_servicio} className="py-1.5">
                    <div className="text-cuerpo-sm flex justify-between gap-3">
                      <span className="text-principal">
                        {i + 1}. {s.nombre}
                      </span>
                      <span className="text-secundario tabular-nums">{s.veces_realizado}</span>
                    </div>
                    <div className="bg-elevado mt-1 h-1.5 rounded-full" aria-hidden="true">
                      <div
                        className="bg-marca h-1.5 rounded-full"
                        style={{ width: `${(s.veces_realizado / maximo) * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Tarjeta>
      </div>

      <Tarjeta>
        <TarjetaEncabezado titulo="Ingresos por mes" descripcion="Cobros pagados y parciales" />
        {ingresos.length === 0 ? (
          <EstadoVacio icono="chart-column" titulo="Todavía no hay ingresos registrados" />
        ) : (
          <GraficoIngresos datos={ingresos} />
        )}
      </Tarjeta>
    </>
  );
}
