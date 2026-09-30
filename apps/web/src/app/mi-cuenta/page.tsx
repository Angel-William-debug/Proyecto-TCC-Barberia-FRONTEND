import Link from 'next/link';

import { misTurnos } from '@barber-shop/api';
import { Boton, EstadoVacio, Icono, ZONA_HORARIA } from '@barber-shop/ui';

import { CalendarioTurnos } from '@/componentes/portal/calendario-turnos';
import { PestanasVista } from '@/componentes/portal/pestanas-vista';
import { TarjetaTurno } from '@/componentes/portal/tarjeta-turno';

export const metadata = {
  title: 'Mis turnos',
};

/**
 * La pantalla que ve el cliente al entrar, en dos modos.
 *
 * - **Calendario** (el predeterminado): el mes en grilla con TODOS sus
 *   turnos -los que vienen, los completados, los cancelados-, cada uno con
 *   el color de su estado. Tocar un dia muestra el detalle. Lo pidio la
 *   directora: ver los turnos en el tiempo, no solo en una lista.
 * - **Tarjetas**: la lista de lo que viene, que es lo que el cliente abre
 *   el portal para confirmar. El historial tiene su propia seccion.
 */
export default async function MisTurnos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const vista = params.vista === 'tarjetas' ? 'tarjetas' : 'calendario';

  const { proximos, pasados } = await misTurnos();

  // `en-CA` da aaaa-MM-dd. Hoy en la zona de la barberia, no en la del servidor.
  const hoy = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-principal text-display-sm font-semibold">
          Mis turnos
        </h1>

        <Link href="/mi-cuenta/reservar">
          <Boton variante="primario" icono="calendar-days">
            Reservar un turno
          </Boton>
        </Link>
      </div>

      <div className="mt-6">
        <PestanasVista
          etiqueta="Cómo ver los turnos"
          opciones={[
            { valor: 'calendario', etiqueta: 'Calendario', icono: 'calendar-days' },
            { valor: 'tarjetas', etiqueta: 'Tarjetas', icono: 'clipboard-list' },
          ]}
        />
      </div>

      <div className="mt-6" role="tabpanel">
        {vista === 'calendario' ? (
          <CalendarioTurnos
            turnos={[...pasados, ...proximos]}
            proximo={proximos[0] ?? null}
            hoy={hoy}
          />
        ) : proximos.length === 0 ? (
          <div className="border-borde-sutil bg-superficie rounded-lg border p-2">
            <EstadoVacio
              icono="calendar-days"
              titulo="No tiene turnos reservados"
              descripcion="Elija el servicio que quiere y le mostramos los horarios libres de esta semana."
              accion={
                <Link href="/mi-cuenta/reservar">
                  <Boton variante="primario">Reservar un turno</Boton>
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <p className="text-cuerpo-sm text-terciario flex items-center gap-1.5">
              <Icono nombre="circle-check" tamano="xs" />
              {proximos.length === 1
                ? 'Tiene un turno reservado'
                : `Tiene ${proximos.length} turnos reservados`}
            </p>

            <ul className="mt-3 flex flex-col gap-4">
              {proximos.map((t) => (
                <li key={t.idCita}>
                  <TarjetaTurno turno={t} />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
