'use client';

import { useId, useState } from 'react';

import type { TurnoDelCliente } from '@barber-shop/tipos';
import {
  ChipEstado,
  Icono,
  PRESENTACION_CITA,
  cn,
  duracion,
  fechaHora,
  fechaLarga,
  guaranies,
  hora,
  plural,
} from '@barber-shop/ui';

import { BotonCancelarTurno } from './boton-cancelar-turno';

/**
 * Un turno, tal como lo ve el cliente.
 *
 * Una tarjeta y no una fila de tabla. En el panel el mismo dato va en tabla
 * porque la recepcionista compara veinte turnos entre si; aca el cliente mira
 * el suyo, y lo que necesita saber de un vistazo -cuando, cuanto dura, cuanto
 * sale- entra completo sin desplazarse de lado.
 *
 * PLEGADA MUESTRA LO QUE SE MIRA DE PASO; DESPLEGADA, EL DETALLE
 *
 * Quien abre el portal casi siempre viene a confirmar a que hora es su turno.
 * Esa pregunta se responde con la fecha, la hora y poco mas, y todo lo demas
 * -que servicios, con quien, cuanto dura cada uno, que anoto al reservar-
 * estorba mientras no se lo pida. Por eso el detalle esta ahi pero plegado, y
 * no en otra pantalla: abrirlo no cuesta una navegacion.
 *
 * La cabecera entera es el boton que despliega. Un triangulito de doce pixeles
 * seria un objetivo tactil por debajo del minimo de 44 px de la seccion 6.6.
 */
export function TarjetaTurno({ turno }: { turno: TurnoDelCliente }) {
  const [abierta, setAbierta] = useState(false);
  const idDetalle = useId();

  const barberos = [...new Set(turno.servicios.map((s) => s.barbero))].filter(Boolean);

  return (
    <article className="border-borde-sutil bg-superficie overflow-hidden rounded-lg border">
      <button
        type="button"
        onClick={() => setAbierta((v) => !v)}
        aria-expanded={abierta}
        aria-controls={idDetalle}
        className="hover:bg-elevado flex w-full items-start gap-4 p-4 text-left transition-colors sm:p-5"
      >
        <div className="min-w-0 flex-1">
          <p className="text-cuerpo-sm text-terciario capitalize">
            {fechaLarga(turno.fechaHora)}
          </p>

          <p className="font-display text-principal text-titulo-2 mt-1 font-semibold">
            {hora(turno.fechaHora)}
            <span className="text-secundario text-cuerpo font-normal">
              {' '}
              a {hora(turno.fechaHoraFin)}
            </span>
          </p>

          {/* Resumen de una linea: lo minimo para reconocer el turno sin
              abrirlo. Si hay varios servicios se cuentan en vez de listarlos,
              porque tres nombres completos no entran en el ancho del portal. */}
          <p className="text-cuerpo-sm text-secundario mt-2">
            {turno.servicios.length === 1
              ? turno.servicios[0]!.nombre
              : plural(turno.servicios.length, 'servicio', 'servicios')}
            {barberos.length === 1 && ` · ${barberos[0]}`}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <ChipEstado presentacion={PRESENTACION_CITA[turno.estado]} />
          <span className="text-cuerpo text-principal font-semibold tabular-nums">
            {guaranies(turno.total)}
          </span>
          <span className="text-terciario flex items-center gap-1">
            <span className="text-titulillo">{abierta ? 'Ocultar' : 'Ver detalle'}</span>
            <Icono
              nombre="chevron-down"
              tamano="sm"
              className={cn('transition-transform', abierta && 'rotate-180')}
            />
          </span>
        </div>
      </button>

      {/* `hidden` y no desmontar: el contenido queda en el marcado y el
          navegador lo encuentra al buscar en la pagina. */}
      <div id={idDetalle} hidden={!abierta} className="border-borde-sutil border-t">
        <ul className="divide-y divide-[var(--borde-sutil)]">
          {turno.servicios.map((s, i) => (
            <li
              key={`${s.idServicio}-${i}`}
              className="flex items-start justify-between gap-4 px-4 py-3 sm:px-5"
            >
              <div className="min-w-0">
                <p className="text-cuerpo text-principal font-medium">{s.nombre}</p>
                <p className="text-cuerpo-sm text-terciario mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <Icono nombre="scissors" tamano="xs" />
                    {s.barbero}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Icono nombre="clock" tamano="xs" />
                    {duracion(s.duracionMin)}
                  </span>
                </p>
              </div>
              <p className="text-cuerpo-sm text-secundario shrink-0 tabular-nums">
                {guaranies(s.precio)}
              </p>
            </li>
          ))}

          {turno.servicios.length === 0 && (
            <li className="text-cuerpo-sm text-terciario px-4 py-3 sm:px-5">
              Este turno no tiene servicios cargados. Consulte en la barbería.
            </li>
          )}
        </ul>

        <dl className="border-borde-sutil text-cuerpo-sm grid gap-x-6 gap-y-2 border-t px-4 py-4 sm:grid-cols-2 sm:px-5">
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-terciario">Duración total</dt>
            <dd className="text-principal sm:mt-0.5">{duracion(turno.duracionTotalMin)}</dd>
          </div>

          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-terciario">Reservado el</dt>
            <dd className="text-principal sm:mt-0.5">{fechaHora(turno.reservadoEn)}</dd>
          </div>

          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-terciario">Número de turno</dt>
            <dd className="text-principal tabular-nums sm:mt-0.5">N.º {turno.idCita}</dd>
          </div>

          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-terciario">Total</dt>
            <dd className="text-principal font-semibold tabular-nums sm:mt-0.5">
              {guaranies(turno.total)}
            </dd>
          </div>

          {turno.observaciones && (
            <div className="sm:col-span-2">
              <dt className="text-terciario">Lo que avisó al reservar</dt>
              <dd className="text-principal medida-lectura mt-0.5">{turno.observaciones}</dd>
            </div>
          )}
        </dl>

        {turno.cancelable && (
          <div className="border-borde-sutil flex justify-end border-t px-4 py-3 sm:px-5">
            <BotonCancelarTurno idCita={turno.idCita} />
          </div>
        )}
      </div>
    </article>
  );
}
