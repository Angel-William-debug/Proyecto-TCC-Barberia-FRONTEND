'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { NotificacionDeLista } from '@barber-shop/tipos';
import {
  AvisoFormulario,
  Boton,
  BotonIcono,
  ChipEstado,
  GrupoCampos,
  PanelLateral,
  ZONA_HORARIA,
  fechaHora,
  identificador,
} from '@barber-shop/ui';

import { reintentar } from '@/acciones/notificaciones';

import { etiquetaTipo, presentacionEnvio, sePuedeReintentar } from './presentacion';

const fmtDia = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA });

/**
 * Detalle de una notificación y su reintento (vista 87, RN-042; 15/10/2026).
 *
 * La función de recordatorios reintenta sola un correo que falló, hasta
 * `max_reintentos_notif` veces. Pasado eso -o si el cliente no tenía correo y
 * ya se lo cargaron- el recordatorio quedaba perdido. «Volver a intentar» lo
 * pone otra vez en cola, con los intentos en cero, y sale en la próxima pasada
 * (cada diez minutos) si el turno sigue por venir.
 */
export function PanelDetalleNotificacion({ notificacion: n }: { notificacion: NotificacionDeLista }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [ocupado, iniciar] = useTransition();

  const reintentable = sePuedeReintentar(n) && !listo;

  function volverAIntentar() {
    setError(null);
    iniciar(async () => {
      const r = await reintentar(n.id_notificacion);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setListo(true);
      router.refresh();
    });
  }

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver la notificación ${identificador(n.id_notificacion)}`}
        variante="terciario"
        tamano="sm"
        onClick={() => setAbierto(true)}
      />

      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={etiquetaTipo(n.tipo)}
        descripcion={n.nombre_cliente ?? 'Sin cliente'}
        pie={
          reintentable ? (
            <div className="flex w-full justify-end">
              <Boton variante="primario" icono="mail" cargando={ocupado} onClick={volverAIntentar}>
                Volver a intentar
              </Boton>
            </div>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-6">
          {error && <AvisoFormulario mensaje={error} />}
          {listo && (
            <p role="status" className="text-cuerpo-sm text-exito">
              Quedó en cola. Sale en la próxima pasada de los recordatorios, dentro de diez minutos como
              mucho.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <ChipEstado presentacion={presentacionEnvio(listo ? 'pendiente' : n.estado_envio)} />
            <span className="text-cuerpo-sm text-secundario">
              {n.intentos === 1 ? '1 intento' : `${n.intentos} intentos`}
              {n.proveedor && ` · ${n.proveedor === 'brevo' ? 'Correo (Brevo)' : n.proveedor}`}
            </span>
          </div>

          <GrupoCampos titulo="Envío">
            <dl className="text-cuerpo-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-terciario">Destino</dt>
              <dd className="text-principal break-all">{n.email_destino ?? 'Sin correo registrado'}</dd>
              <dt className="text-terciario">Creada</dt>
              <dd className="text-principal">{fechaHora(n.created_at)}</dd>
              <dt className="text-terciario">Enviada</dt>
              <dd className="text-principal">{n.fecha_envio ? fechaHora(n.fecha_envio) : '—'}</dd>
            </dl>
          </GrupoCampos>

          <GrupoCampos titulo={n.estado_envio === 'fallido' ? 'Error' : 'Mensaje'}>
            <p className="text-cuerpo-sm text-secundario break-words whitespace-pre-line">
              {n.mensaje ?? '—'}
            </p>
          </GrupoCampos>

          {n.id_cita !== null && (
            <GrupoCampos titulo="Turno">
              <p className="text-cuerpo-sm text-principal">
                {identificador(n.id_cita)}
                {n.fecha_turno && ` · ${fechaHora(n.fecha_turno)}`}
              </p>
              {n.fecha_turno && (
                <a
                  href={`/panel/agenda?fecha=${fmtDia.format(new Date(n.fecha_turno))}`}
                  className="text-cuerpo-sm text-marca"
                >
                  Ver en la agenda
                </a>
              )}
            </GrupoCampos>
          )}

          {!reintentable && !listo && n.tipo === 'recordatorio' && n.estado_envio !== 'enviado' && (
            <p className="text-cuerpo-sm text-terciario">
              El turno ya pasó o no está vigente: no tiene sentido reintentar el recordatorio.
            </p>
          )}
          {n.estado_envio === 'sin_email' && reintentable && (
            <p className="text-cuerpo-sm text-secundario">
              Cargue primero el correo en la ficha del cliente; si no, el reintento vuelve a quedar sin
              correo.
            </p>
          )}
        </div>
      </PanelLateral>
    </>
  );
}
