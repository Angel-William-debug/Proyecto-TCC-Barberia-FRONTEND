import Link from 'next/link';

import {
  listarAlertas,
  listarNotificaciones,
  listarRecordatoriosProgramados,
} from '@barber-shop/api';
import {
  BarraFiltros,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  Icono,
  Paginacion,
  RangoFechas,
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
  cantidad,
  fechaHora,
  plural,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { PanelDetalleNotificacion } from '@/componentes/notificaciones/panel-detalle-notificacion';
import {
  ETIQUETA_TIPO,
  PRESENTACION_ENVIO,
  etiquetaTipo,
  presentacionEnvio,
} from '@/componentes/notificaciones/presentacion';
import { comunes, lista, paginarFilas, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Notificaciones' };

const OPCIONES_ESTADO = Object.entries(PRESENTACION_ENVIO).map(([valor, p]) => ({ valor, etiqueta: p.etiqueta }));
const ETIQUETAS_ESTADO = Object.fromEntries(OPCIONES_ESTADO.map((o) => [o.valor, o.etiqueta]));
const OPCIONES_TIPO = Object.entries(ETIQUETA_TIPO).map(([valor, etiqueta]) => ({ valor, etiqueta }));

/**
 * Notificaciones (vistas 86, 87, 95 y 100 del anexo; 15/10/2026).
 *
 * Tres tarjetas, de lo urgente a lo histórico:
 *
 *   1. Bandeja (95): lo que pide que alguien haga algo. Alertas de stock sin
 *      resolver y recordatorios que no salieron para turnos que todavía no
 *      pasaron. La campanita del encabezado cuenta esto mismo.
 *   2. Próximos recordatorios (100): los turnos de la semana y cuándo sale el
 *      recordatorio de cada uno.
 *   3. Historial (86): todo lo que se mandó, con su detalle y el reintento (87).
 */
export default async function PaginaNotificaciones({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const base = comunes(params);

  const [historial, porAtender, alertas, cola] = await Promise.all([
    listarNotificaciones({ ...base, estados: lista(params, 'estado'), tipos: lista(params, 'tipo') }),
    listarNotificaciones({ soloPorAtender: true }).catch(() => []),
    listarAlertas({ soloNoResueltas: true }).catch(() => []),
    listarRecordatoriosProgramados().catch(() => []),
  ]);

  const enBandeja = alertas.length + porAtender.length;
  const pag = paginarFilas(historial, params);

  return (
    <>
      <EncabezadoVista
        titulo="Notificaciones"
        descripcion={
          enBandeja > 0
            ? `${plural(enBandeja, 'asunto pide', 'asuntos piden')} atención`
            : 'Nada pendiente de atender'
        }
      />

      <Tarjeta className="mb-6">
        <TarjetaEncabezado titulo="Bandeja" descripcion="Lo que necesita que alguien haga algo" />
        {enBandeja === 0 ? (
          <EstadoVacio
            icono="inbox"
            titulo="Bandeja vacía"
            descripcion="No hay alertas de stock sin resolver ni recordatorios que no hayan salido."
          />
        ) : (
          <ul className="divide-borde-sutil divide-y px-4 pb-2 sm:px-6">
            {porAtender.map((n) => (
              <li key={`n-${n.id_notificacion}`} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Icono nombre="mail" tamano="sm" className="text-peligro mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-cuerpo text-principal">
                      El recordatorio de {n.nombre_cliente ?? 'un cliente'}{' '}
                      {n.estado_envio === 'sin_email' ? 'no salió: no tiene correo' : 'no se pudo enviar'}
                    </p>
                    <p className="text-cuerpo-sm text-terciario">
                      Turno del {n.fecha_turno ? fechaHora(n.fecha_turno) : '—'} ·{' '}
                      {plural(n.intentos, 'intento', 'intentos')}
                    </p>
                  </div>
                </div>
                <PanelDetalleNotificacion notificacion={n} />
              </li>
            ))}
            {alertas.map((a) => (
              <li key={`a-${a.id_alerta}`} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Icono nombre="triangle-alert" tamano="sm" className="text-advertencia mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-cuerpo text-principal">{a.nombre_producto} llegó al mínimo</p>
                    <p className="text-cuerpo-sm text-terciario tabular-nums">
                      Quedan {cantidad(a.stock_actual)} · mínimo {cantidad(a.stock_minimo)} · desde el{' '}
                      {fechaHora(a.fecha_alerta)}
                    </p>
                  </div>
                </div>
                <Link href="/panel/inventario" className="text-cuerpo-sm text-marca shrink-0">
                  Ir a inventario
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>

      <Tarjeta className="mb-6">
        <TarjetaEncabezado
          titulo="Próximos recordatorios"
          descripcion="Turnos de los próximos siete días y cuándo sale el correo de cada uno"
        />
        <Tabla titulo="Recordatorios programados">
          <TablaEncabezado>
            <Th>Turno</Th>
            <Th>Cliente</Th>
            <Th>Correo</Th>
            <Th>Sale a partir de</Th>
            <Th>Estado</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {cola.length === 0 ? (
              <TdCompleta colSpan={5}>
                <EstadoVacio
                  icono="calendar-days"
                  titulo="Sin turnos en la semana"
                  descripcion="Cuando haya turnos pendientes o confirmados, aparecen acá con su recordatorio."
                />
              </TdCompleta>
            ) : (
              cola.map((r) => {
                const estado = !r.email && !r.estado_envio ? 'sin_email' : r.estado_envio;
                return (
                  <Tr key={r.id_cita}>
                    <Td className="tabular-nums" etiqueta="Turno">{fechaHora(r.fecha_hora)}</Td>
                    <Td className="font-medium" etiqueta="Cliente">{r.nombre_cliente}</Td>
                    <Td className="text-secundario" etiqueta="Correo">{r.email ?? '—'}</Td>
                    <Td className="text-secundario tabular-nums" etiqueta="Sale a partir de">
                      {new Date(r.sale_a_partir_de).getTime() <= Date.now()
                        ? 'En la próxima pasada'
                        : fechaHora(r.sale_a_partir_de)}
                    </Td>
                    <Td etiqueta="Estado">
                      {estado ? (
                        <ChipEstado presentacion={presentacionEnvio(estado)} />
                      ) : (
                        <ChipEstado presentacion={{ etiqueta: 'Programado', tono: 'neutro', icono: 'clock' }} />
                      )}
                    </Td>
                  </Tr>
                );
              })
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado
          titulo="Historial de envíos"
          descripcion="Recordatorios por correo y avisos a la app del cliente"
        />

        <BarraFiltros
          busqueda={<CampoBusqueda placeholder="Cliente, correo o mensaje" />}
          fecha={<RangoFechas etiqueta="Fecha" />}
          avanzados={
            <>
              <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ESTADO} />
              <SelectorMultiple nombre="tipo" etiqueta="Tipo" opciones={OPCIONES_TIPO} />
            </>
          }
          parametrosAvanzados={['estado', 'tipo']}
        />

        <FiltrosActivos
          total={historial.length}
          sustantivo={['notificación', 'notificaciones']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ESTADO },
            tipo: { titulo: 'Tipo', valores: ETIQUETA_TIPO },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Notificaciones enviadas">
          <TablaEncabezado>
            <Th>Fecha</Th>
            <Th>Tipo</Th>
            <Th>Cliente</Th>
            <Th>Destino</Th>
            <Th numerico>Intentos</Th>
            <Th>Estado</Th>
            <Th><span className="solo-lectores">Acciones</span></Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {historial.length === 0 ? (
              <TdCompleta colSpan={7}>
                <EstadoVacio
                  icono="bell"
                  titulo="No se encontraron notificaciones"
                  descripcion="Ninguna notificación cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              pag.filas.map((n) => (
                <Tr key={n.id_notificacion}>
                  <Td className="text-secundario tabular-nums" etiqueta="Fecha">
                    {fechaHora(n.fecha_envio ?? n.created_at)}
                  </Td>
                  <Td etiqueta="Tipo">{etiquetaTipo(n.tipo)}</Td>
                  <Td className="font-medium" etiqueta="Cliente">{n.nombre_cliente ?? '—'}</Td>
                  <Td className="text-secundario" etiqueta="Destino">{n.email_destino ?? '—'}</Td>
                  <Td numerico etiqueta="Intentos">{n.intentos}</Td>
                  <Td etiqueta="Estado">
                    <ChipEstado presentacion={presentacionEnvio(n.estado_envio)} />
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <PanelDetalleNotificacion notificacion={n} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
        <Paginacion {...pag.paginacion} />
      </Tarjeta>
    </>
  );
}
