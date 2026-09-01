import Link from 'next/link';

import { misTurnos } from '@barber-shop/api';
import { Boton, EstadoVacio, Icono } from '@barber-shop/ui';

import { TarjetaTurno } from '@/componentes/portal/tarjeta-turno';

export const metadata = {
  title: 'Mis turnos',
};

/**
 * La pantalla que ve el cliente al entrar.
 *
 * Muestra lo que viene, no lo que paso: quien abre el portal casi siempre lo
 * hace para confirmar a que hora es su turno de esta semana. El historial
 * tiene su propia seccion.
 */
export default async function MisTurnos() {
  const { proximos } = await misTurnos();

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

      {proximos.length === 0 ? (
        <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
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
          <p className="text-cuerpo-sm text-terciario mt-6 flex items-center gap-1.5">
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
  );
}
