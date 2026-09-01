import type { TurnoDelCliente } from '@barber-shop/tipos';
import {
  ChipEstado,
  Icono,
  PRESENTACION_CITA,
  duracion,
  fechaLarga,
  guaranies,
  hora,
} from '@barber-shop/ui';

import { BotonCancelarTurno } from './boton-cancelar-turno';

/**
 * Un turno, tal como lo ve el cliente.
 *
 * Una tarjeta y no una fila de tabla. En el panel el mismo dato va en tabla
 * porque la recepcionista compara veinte turnos entre si; aca el cliente mira
 * el suyo, y lo que necesita saber -cuando, con quien, cuanto dura, cuanto
 * sale- entra completo de un vistazo sin desplazarse de lado.
 *
 * LA DURACION VA ARRIBA, NO ABAJO
 *
 * «Cuanto me va a llevar» es la pregunta que el mostrador contesta de memoria
 * y que el portal tiene que contestar solo. Por eso la hora de inicio y la de
 * fin se muestran juntas, con la duracion al lado, y no escondidas entre los
 * detalles del servicio.
 */
export function TarjetaTurno({ turno }: { turno: TurnoDelCliente }) {
  return (
    <article className="border-borde-sutil bg-superficie rounded-lg border p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
        </div>

        <ChipEstado presentacion={PRESENTACION_CITA[turno.estado]} />
      </div>

      <ul className="border-borde-sutil mt-4 flex flex-col gap-3 border-t pt-4">
        {turno.servicios.map((s, i) => (
          <li key={`${s.idServicio}-${i}`} className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-cuerpo text-principal font-medium">{s.nombre}</p>
              <p className="text-cuerpo-sm text-terciario mt-0.5 flex items-center gap-1.5">
                <Icono nombre="scissors" tamano="xs" />
                {s.barbero}
              </p>
            </div>
            <p className="text-cuerpo-sm text-secundario shrink-0 tabular-nums">
              {guaranies(s.precio)}
            </p>
          </li>
        ))}
      </ul>

      <div className="border-borde-sutil mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <p className="text-cuerpo-sm text-terciario flex items-center gap-1.5">
          <Icono nombre="clock" tamano="xs" />
          Toma unos {duracion(turno.duracionTotalMin)}
        </p>

        <p className="text-cuerpo text-principal font-semibold tabular-nums">
          {guaranies(turno.total)}
        </p>
      </div>

      {turno.cancelable && (
        <div className="mt-4 flex justify-end">
          <BotonCancelarTurno idCita={turno.idCita} />
        </div>
      )}
    </article>
  );
}
