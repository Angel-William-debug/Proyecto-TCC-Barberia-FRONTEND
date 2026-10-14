import Link from 'next/link';

import { miDia, usuarioActual } from '@barber-shop/api';
import {
  ChipEstado,
  EstadoVacio,
  Indicador,
  PRESENTACION_CITA,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaEncabezado,
  Td,
  Th,
  Tr,
  ZONA_HORARIA,
  fechaCorta,
  guaranies,
  hora,
  plural,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';

export const metadata = { title: 'Mi día' };

/**
 * «Mi día», el panel del barbero (vistas 101 a 103 del anexo, 14/10/2026).
 *
 * Lo que un barbero viene a mirar, en una pantalla y en el orden en que lo
 * pregunta: a quién atiende hoy (101), qué hizo este mes (102) y cuánto le
 * deben (103). La vista 104, la agenda de un barbero, ya estaba: es la Agenda
 * con el filtro «Barbero».
 *
 * Solo lectura: el barbero no agenda, no cobra ni liquida. Para eso está el
 * mostrador.
 */
export default async function PaginaMiDia() {
  const sesion = await usuarioActual();
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());

  if (!sesion?.idProfesional) {
    return (
      <>
        <EncabezadoVista titulo="Mi día" />
        <Tarjeta className="p-2">
          <EstadoVacio
            icono="scissors"
            titulo="Su cuenta no tiene una ficha de barbero"
            descripcion="Pídale al administrador que la vincule desde Usuarios y roles."
          />
        </Tarjeta>
      </>
    );
  }

  const datos = await miDia(sesion.idProfesional, hoy);
  const pendientesHoy = datos.agendaHoy.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmado');
  const proximo = pendientesHoy.find((c) => new Date(c.fecha_hora).getTime() >= Date.now());
  const cobradoMes = datos.servicios.reduce((n, s) => n + s.cobrado, 0);

  return (
    <>
      <EncabezadoVista
        titulo={`Hola, ${sesion.nombre.split(' ')[0]}`}
        descripcion="Su agenda de hoy, lo que atendió en los últimos 30 días y sus comisiones."
      />

      {/* -------------------------------------------------------- cifras */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta="Turnos de hoy"
          valor={String(datos.agendaHoy.length)}
          icono="calendar-days"
          contexto={proximo ? `Próximo a las ${hora(proximo.fecha_hora)}` : 'Sin más turnos hoy'}
        />
        <Indicador
          etiqueta="Servicios, 30 días"
          valor={String(datos.servicios.length)}
          icono="scissors"
          contexto={`${guaranies(cobradoMes)} cobrados`}
        />
        <Indicador
          etiqueta="Comisión pendiente"
          valor={guaranies(datos.totalPendiente)}
          icono="hand-coins"
          contexto={plural(datos.comisionesPendientes.length, 'servicio por liquidar', 'servicios por liquidar')}
        />
        <Indicador
          etiqueta="Liquidado, 30 días"
          valor={guaranies(datos.liquidadoMes)}
          icono="check-check"
        />
      </div>

      {/* ------------------------------------------------ 101. agenda de hoy */}
      <Tarjeta className="mb-6">
        <TarjetaEncabezado
          titulo="Mi agenda de hoy"
          descripcion="Sus turnos, con inicio y fin."
          accion={
            <Link href={`/panel/agenda?barbero=${sesion.idProfesional}`} className="text-cuerpo-sm text-marca font-medium">
              Ver en la agenda
            </Link>
          }
        />
        {datos.agendaHoy.length === 0 ? (
          <EstadoVacio icono="calendar-days" titulo="Hoy no tiene turnos" descripcion="Cuando el mostrador le agende uno, aparece acá." />
        ) : (
          <Tabla titulo="Mi agenda de hoy">
            <TablaEncabezado>
              <Th>Hora</Th>
              <Th>Cliente</Th>
              <Th>Servicios</Th>
              <Th>Estado</Th>
            </TablaEncabezado>
            <TablaCuerpo>
              {datos.agendaHoy.map((c) => (
                <Tr key={c.id_cita}>
                  <Td etiqueta="Hora">
                    <span className="tabular-nums">
                      {hora(c.fecha_hora)} a {hora(c.fechaHoraFin)}
                    </span>
                  </Td>
                  <Td etiqueta="Cliente">
                    <span className="text-principal font-medium">{c.cliente.nombre}</span>
                  </Td>
                  <Td etiqueta="Servicios">
                    {c.servicios
                      .filter((s) => s.profesional.id_profesional === sesion.idProfesional)
                      .map((s) => s.servicio.nombre)
                      .join(', ')}
                  </Td>
                  <Td etiqueta="Estado">
                    <ChipEstado presentacion={PRESENTACION_CITA[c.estado]} />
                  </Td>
                </Tr>
              ))}
            </TablaCuerpo>
          </Tabla>
        )}
      </Tarjeta>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* ---------------------------------- 102. servicios realizados */}
        <Tarjeta>
          <TarjetaEncabezado titulo="Mis servicios realizados" descripcion="Los últimos 30 días." />
          {datos.servicios.length === 0 ? (
            <EstadoVacio icono="scissors" titulo="Sin servicios en los últimos 30 días" />
          ) : (
            <Tabla titulo="Mis servicios realizados">
              <TablaEncabezado>
                <Th>Fecha</Th>
                <Th>Servicio</Th>
                <Th>Cliente</Th>
                <Th numerico>Cobrado</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {datos.servicios.slice(0, 15).map((s, i) => (
                  <Tr key={`${s.fecha}-${i}`}>
                    <Td etiqueta="Fecha">{fechaCorta(s.fecha)}</Td>
                    <Td etiqueta="Servicio">{s.servicio}</Td>
                    <Td etiqueta="Cliente">{s.cliente}</Td>
                    <Td etiqueta="Cobrado" numerico>
                      {guaranies(s.cobrado)}
                    </Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          )}
        </Tarjeta>

        {/* -------------------------------------------- 103. comisiones */}
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Mis comisiones pendientes"
            descripcion="Lo que la barbería todavía no le liquidó."
            accion={
              <Link href="/panel/comisiones" className="text-cuerpo-sm text-marca font-medium">
                Ver todas
              </Link>
            }
          />
          {datos.comisionesPendientes.length === 0 ? (
            <EstadoVacio icono="hand-coins" titulo="No tiene comisiones pendientes" />
          ) : (
            <Tabla titulo="Mis comisiones pendientes">
              <TablaEncabezado>
                <Th>Fecha</Th>
                <Th>Servicio</Th>
                <Th numerico>Comisión</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {datos.comisionesPendientes.slice(0, 15).map((c) => (
                  <Tr key={c.id_pago_prof}>
                    <Td etiqueta="Fecha">{fechaCorta(c.fecha_realizacion)}</Td>
                    <Td etiqueta="Servicio">{c.nombre_servicio}</Td>
                    <Td etiqueta="Comisión" numerico>
                      {guaranies(c.monto)}
                    </Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          )}
        </Tarjeta>
      </div>
    </>
  );
}
