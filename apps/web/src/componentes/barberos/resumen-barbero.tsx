import Link from 'next/link';

import { miDia } from '@barber-shop/api';
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
  fechaCorta,
  guaranies,
  hora,
  plural,
} from '@barber-shop/ui';

/**
 * El tablero de un barbero: agenda de hoy, servicios de 30 días y comisiones.
 *
 * Lo usan dos pantallas: «Mi día» (el barbero mirándose a sí mismo, vistas
 * 101 a 103) y el perfil del barbero que abre el administrador desde
 * Barberos (vista 36, 15/10/2026). Mismos datos, distinto «mi».
 */
export async function ResumenBarbero({
  idProfesional,
  hoy,
  propio,
}: {
  idProfesional: number;
  hoy: string;
  propio: boolean;
}) {
  // La recepcionista ve Barberos pero no las comisiones (RLS): en vez de
  // romper la pantalla, se avisa.
  const datos = await miDia(idProfesional, hoy).catch(() => null);
  if (!datos) {
    return (
      <Tarjeta className="p-2">
        <EstadoVacio
          icono="shield-check"
          titulo="No se pudo cargar el resumen"
          descripcion="Su rol no alcanza a ver la agenda y las comisiones de este barbero."
        />
      </Tarjeta>
    );
  }
  const pendientesHoy = datos.agendaHoy.filter((c) => c.estado === 'pendiente' || c.estado === 'confirmado');
  const proximo = pendientesHoy.find((c) => new Date(c.fecha_hora).getTime() >= Date.now());
  const cobradoMes = datos.servicios.reduce((n, s) => n + s.cobrado, 0);

  return (
    <>
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
          titulo={propio ? 'Mi agenda de hoy' : 'Agenda de hoy'}
          descripcion="Turnos de hoy, con inicio y fin."
          accion={
            <Link href={`/panel/agenda?barbero=${idProfesional}`} className="text-cuerpo-sm text-marca font-medium">
              Ver en la agenda
            </Link>
          }
        />
        {datos.agendaHoy.length === 0 ? (
          <EstadoVacio icono="calendar-days" titulo="Hoy no tiene turnos" descripcion="Cuando el mostrador agende uno, aparece acá." />
        ) : (
          <Tabla titulo="Agenda de hoy">
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
                      .filter((s) => s.profesional.id_profesional === idProfesional)
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
          <TarjetaEncabezado titulo={propio ? 'Mis servicios realizados' : 'Servicios realizados'} descripcion="Los últimos 30 días." />
          {datos.servicios.length === 0 ? (
            <EstadoVacio icono="scissors" titulo="Sin servicios en los últimos 30 días" />
          ) : (
            <Tabla titulo="Servicios realizados">
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
            titulo={propio ? 'Mis comisiones pendientes' : 'Comisiones pendientes'}
            descripcion="Lo que la barbería todavía no liquidó."
            accion={
              <Link href="/panel/comisiones" className="text-cuerpo-sm text-marca font-medium">
                Ver todas
              </Link>
            }
          />
          {datos.comisionesPendientes.length === 0 ? (
            <EstadoVacio icono="hand-coins" titulo="Sin comisiones pendientes" />
          ) : (
            <Tabla titulo="Comisiones pendientes">
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
