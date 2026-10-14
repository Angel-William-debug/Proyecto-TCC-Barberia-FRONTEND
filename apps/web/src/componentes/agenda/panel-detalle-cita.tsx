'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';

import type { CitaCompleta } from '@barber-shop/tipos';
import {
  AvisoFormulario,
  Boton,
  BotonIcono,
  Campo,
  CampoArea,
  ChipEstado,
  GrupoCampos,
  PRESENTACION_CITA,
  PanelLateral,
  ZONA_HORARIA,
  duracion,
  fechaLarga,
  guaranies,
  hora,
  mayusculaInicial,
} from '@barber-shop/ui';

import { cambiarEstadoTurno, cancelarTurno, reprogramarTurno } from '@/acciones/agenda';

/**
 * El detalle de un turno y lo que se puede hacer con él (vistas 44, 45 y 46
 * del anexo, CU-006; 15/10/2026).
 *
 * Antes la agenda del panel solo agendaba y completaba: no había forma de ver
 * un turno entero, ni de cambiarle la hora, ni de cancelarlo. Desde la fila se
 * abre este panel con todo el turno -cliente, servicios uno detrás del otro con
 * su barbero, observaciones, motivo si se canceló- y, si sigue vigente:
 *
 *   - Confirmar (pendiente → confirmado).
 *   - Reprogramar: día, hora y observaciones. La base rechaza el pasado, fuera
 *     de horario o encima de otro turno del mismo barbero.
 *   - Cancelar con motivo, obligatorio (CU-006 4b).
 *   - Marcar «No asistió», solo si la hora ya pasó.
 *
 * Completar sigue en su propio botón de la fila (`PanelCierreServicio`),
 * porque abre el registro de insumos.
 */

type Modo = 'ver' | 'reprogramar' | 'cancelar';

const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA });

export function PanelDetalleCita({ cita }: { cita: CitaCompleta }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<Modo>('ver');
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ocupado, iniciar] = useTransition();

  const vigente = cita.estado === 'pendiente' || cita.estado === 'confirmado';
  const yaPaso = new Date(cita.fecha_hora).getTime() < Date.now();

  function cerrar() {
    setAbierto(false);
    setModo('ver');
    setError(null);
    setErrores({});
  }

  function correr(accion: () => Promise<{ ok: boolean; error?: string; campos?: Record<string, string> }>) {
    setError(null);
    setErrores({});
    iniciar(async () => {
      const r = await accion();
      if (!r.ok) {
        setError(r.error ?? 'No se pudo guardar.');
        setErrores(r.campos ?? {});
        return;
      }
      cerrar();
      router.refresh();
    });
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    datos.set('id_cita', String(cita.id_cita));
    correr(() => (modo === 'reprogramar' ? reprogramarTurno(datos) : cancelarTurno(datos)));
  }

  // Los servicios uno detrás del otro, como los atiende la barbería.
  let minuto = 0;
  const lineas = cita.servicios.map((s) => {
    const inicio = new Date(new Date(cita.fecha_hora).getTime() + minuto * 60_000).toISOString();
    minuto += s.duracion_min;
    return { ...s, inicio };
  });

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver el turno de ${cita.cliente.nombre}`}
        variante="terciario"
        tamano="sm"
        onClick={() => setAbierto(true)}
      />

      <PanelLateral
        abierto={abierto}
        onCerrar={cerrar}
        titulo={
          modo === 'reprogramar' ? 'Reprogramar turno' : modo === 'cancelar' ? 'Cancelar turno' : 'Turno'
        }
        descripcion={`${cita.cliente.nombre} · ${mayusculaInicial(fechaLarga(cita.fecha_hora))}`}
        pie={
          modo === 'ver' ? (
            <div className="flex w-full flex-wrap justify-end gap-2">
              {vigente && yaPaso && (
                <Boton
                  variante="secundario"
                  cargando={ocupado}
                  onClick={() => correr(() => cambiarEstadoTurno(cita.id_cita, 'no_asistio'))}
                >
                  No asistió
                </Boton>
              )}
              {vigente && (
                <Boton variante="secundario" onClick={() => setModo('cancelar')}>
                  Cancelar turno
                </Boton>
              )}
              {vigente && !yaPaso && (
                <Boton variante="secundario" onClick={() => setModo('reprogramar')}>
                  Reprogramar
                </Boton>
              )}
              {cita.estado === 'pendiente' && (
                <Boton
                  variante="primario"
                  cargando={ocupado}
                  onClick={() => correr(() => cambiarEstadoTurno(cita.id_cita, 'confirmado'))}
                >
                  Confirmar
                </Boton>
              )}
            </div>
          ) : (
            <div className="flex w-full justify-end gap-2">
              <Boton variante="secundario" onClick={() => setModo('ver')} disabled={ocupado}>
                Volver
              </Boton>
              <Boton
                type="submit"
                form={`form-cita-${cita.id_cita}`}
                variante={modo === 'cancelar' ? 'peligro' : 'primario'}
                cargando={ocupado}
              >
                {modo === 'cancelar' ? 'Cancelar el turno' : 'Guardar el cambio'}
              </Boton>
            </div>
          )
        }
      >
        <div className="flex flex-col gap-6">
          {error && <AvisoFormulario mensaje={error} />}

          {modo === 'ver' && (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <ChipEstado presentacion={PRESENTACION_CITA[cita.estado]} />
                <span className="text-cuerpo text-principal tabular-nums">
                  {hora(cita.fecha_hora)} a {hora(cita.fechaHoraFin)} · {duracion(cita.duracionTotalMin)}
                </span>
              </div>

              <GrupoCampos titulo="Cliente">
                <p className="text-cuerpo text-principal font-medium">{cita.cliente.nombre}</p>
                {cita.cliente.telefono && (
                  <a href={`tel:${cita.cliente.telefono}`} className="text-cuerpo-sm text-marca">
                    {cita.cliente.telefono}
                  </a>
                )}
              </GrupoCampos>

              <GrupoCampos titulo="Servicios">
                <ul className="divide-borde-sutil divide-y">
                  {lineas.map((s) => (
                    <li key={s.id_detalle} className="flex items-start justify-between gap-3 py-2">
                      <div>
                        <p className="text-cuerpo text-principal">{s.servicio.nombre}</p>
                        <p className="text-cuerpo-sm text-terciario tabular-nums">
                          {hora(s.inicio)} · {duracion(s.duracion_min)} · {s.profesional.nombre}
                        </p>
                      </div>
                      <span className="text-cuerpo text-principal tabular-nums">{guaranies(s.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-cuerpo text-principal mt-2 text-right font-semibold tabular-nums">
                  Total {guaranies(cita.total)}
                </p>
              </GrupoCampos>

              {cita.observaciones && (
                <GrupoCampos titulo="Observaciones">
                  <p className="text-cuerpo-sm text-secundario">{cita.observaciones}</p>
                </GrupoCampos>
              )}

              {cita.estado === 'cancelado' && (
                <GrupoCampos titulo="Motivo de la cancelación">
                  <p className="text-cuerpo-sm text-secundario">
                    {cita.motivo_cancelacion ?? 'Lo canceló el cliente desde el portal o la app.'}
                  </p>
                </GrupoCampos>
              )}
            </>
          )}

          {modo !== 'ver' && (
            <form id={`form-cita-${cita.id_cita}`} onSubmit={enviar} noValidate className="flex flex-col gap-5">
              {modo === 'reprogramar' ? (
                <>
                  <p className="text-cuerpo-sm text-secundario">
                    Elija el día y la hora nuevos. Si el barbero ya tiene otro turno en ese momento, o la
                    barbería no atiende, se le avisa. Al cliente con cuenta le llega un aviso del cambio.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Campo
                      etiqueta="Día"
                      name="fecha"
                      type="date"
                      defaultValue={fmtDia.format(new Date(cita.fecha_hora))}
                      error={errores.fecha}
                      required
                    />
                    <Campo
                      etiqueta="Hora"
                      name="hora"
                      type="time"
                      step={900}
                      defaultValue={hora(cita.fecha_hora)}
                      error={errores.hora}
                      required
                    />
                  </div>
                  <CampoArea
                    etiqueta="Observaciones"
                    name="observaciones"
                    rows={2}
                    defaultValue={cita.observaciones ?? ''}
                  />
                </>
              ) : (
                <>
                  <p className="text-cuerpo-sm text-secundario">
                    El turno de {cita.cliente.nombre} del {fechaLarga(cita.fecha_hora)} a las {hora(cita.fecha_hora)}{' '}
                    queda cancelado y el horario libre. No se puede deshacer.
                  </p>
                  <CampoArea
                    etiqueta="Motivo"
                    name="motivo"
                    rows={3}
                    placeholder="Por ejemplo: el cliente avisó que no puede venir."
                    ayuda="Queda guardado en el turno."
                    error={errores.motivo}
                    required
                  />
                </>
              )}
            </form>
          )}
        </div>
      </PanelLateral>
    </>
  );
}
