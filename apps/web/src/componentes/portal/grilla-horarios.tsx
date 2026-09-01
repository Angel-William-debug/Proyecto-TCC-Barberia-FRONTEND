'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { FranjaDisponible, VistaPublicoBarbero, VistaPublicoServicio } from '@barber-shop/tipos';
import { AvisoFormulario, Boton, CampoArea, Icono, cn, duracion, guaranies, hora, plural } from '@barber-shop/ui';

import { accionReservarTurno } from '@/acciones/portal';

/**
 * Los dos ultimos pasos: elegir horario y elegir barbero.
 *
 * POR QUE EL BARBERO SE ELIGE DESPUES DEL HORARIO
 *
 * Podria ser al reves -primero el barbero, despues su agenda- y seria peor
 * para el caso normal. La mayoria de la gente quiere cortarse el pelo el
 * sabado a la manana y le da igual quien la atienda; obligarla a elegir
 * barbero primero la fuerza a probar uno por uno hasta encontrar hueco. Quien
 * si tiene preferencia la aplica igual: cada franja dice quienes estan libres.
 *
 * CADA FRANJA MUESTRA CUANTOS LUGARES QUEDAN
 *
 * Ese numero es la capacidad concurrente de la barberia en esa hora: sale de
 * cuantos barberos activos estan libres, no de un cupo configurado. Con cuatro
 * barberos hay cuatro turnos en paralelo; si uno esta de licencia, tres. El
 * portal lo muestra tal cual lo devuelve `fn_turnos_disponibles`.
 */
export function GrillaHorarios({
  franjas,
  barberos,
  servicio,
}: {
  franjas: FranjaDisponible[];
  barberos: VistaPublicoBarbero[];
  servicio: VistaPublicoServicio;
}) {
  const router = useRouter();
  const [elegida, setElegida] = useState<FranjaDisponible | null>(null);
  const [idProfesional, setIdProfesional] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, iniciar] = useTransition();

  function elegirFranja(f: FranjaDisponible) {
    setElegida(f);
    setError(null);
    // Cambiar de horario invalida al barbero elegido: puede no estar libre en
    // el nuevo. Se preselecciona el primero disponible, que es lo que quiere
    // quien no tiene preferencia — la mayoria.
    setIdProfesional(f.ids_barberos[0] ?? null);
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!elegida || idProfesional == null) return;

    const datos = new FormData(evento.currentTarget);
    datos.set('fechaHora', elegida.inicio);
    datos.set('idServicio', String(servicio.id_servicio));
    datos.set('idProfesional', String(idProfesional));

    setError(null);
    iniciar(async () => {
      const r = await accionReservarTurno(datos);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push('/mi-cuenta');
    });
  }

  const libres = elegida
    ? barberos.filter((b) => elegida.ids_barberos.includes(b.id_profesional))
    : [];

  return (
    <form onSubmit={enviar} className="mt-6 flex flex-col gap-6" noValidate>
      {/* ------------------------------------------------------- horarios */}
      <section>
        <h2 className="text-titulo-3 text-principal font-semibold">Horarios libres</h2>
        <p className="text-cuerpo-sm text-terciario mt-1">
          {servicio.nombre} · {duracion(servicio.duracion_min)} · {guaranies(servicio.precio_base)}
        </p>

        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {franjas.map((f) => {
            const activa = elegida?.inicio === f.inicio;
            return (
              <li key={f.inicio}>
                <button
                  type="button"
                  onClick={() => elegirFranja(f)}
                  aria-pressed={activa}
                  className={cn(
                    'flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-md border px-1 py-2 transition-colors',
                    activa
                      ? 'border-marca bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]'
                      : 'border-borde-sutil bg-fondo text-principal hover:border-borde-control',
                  )}
                >
                  <span className="text-cuerpo font-semibold tabular-nums">
                    {hora(f.inicio)}
                  </span>
                  <span className="text-titulillo text-terciario">
                    {plural(f.barberos_disponibles, 'lugar', 'lugares')}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* -------------------------------------------------------- barbero */}
      {elegida && (
        <section className="border-borde-sutil border-t pt-6">
          <h2 className="text-titulo-3 text-principal font-semibold">¿Con quién?</h2>
          <p className="text-cuerpo-sm text-terciario mt-1">
            A las {hora(elegida.inicio)} {libres.length === 1 ? 'está libre' : 'están libres'}{' '}
            {plural(libres.length, 'barbero', 'barberos')}.
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {libres.map((b) => {
              const activo = idProfesional === b.id_profesional;
              return (
                <li key={b.id_profesional}>
                  <button
                    type="button"
                    onClick={() => setIdProfesional(b.id_profesional)}
                    aria-pressed={activo}
                    className={cn(
                      'flex min-h-[56px] w-full items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors',
                      activo
                        ? 'border-marca bg-[var(--chip-marca-fondo)]'
                        : 'border-borde-sutil bg-fondo hover:border-borde-control',
                    )}
                  >
                    <Icono
                      nombre={activo ? 'circle-check' : 'scissors'}
                      tamano="md"
                      className={activo ? 'text-marca' : 'text-terciario'}
                    />
                    <span className="min-w-0">
                      <span className="text-cuerpo text-principal block font-medium">
                        {b.nombre}
                      </span>
                      {b.especialidad && (
                        <span className="text-cuerpo-sm text-terciario block">
                          {b.especialidad}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            <CampoArea
              etiqueta="¿Algo que quiera avisar?"
              name="observaciones"
              rows={2}
              ayuda="Opcional. Por ejemplo, cómo prefiere el corte."
            />
          </div>

          {error && (
            <div className="mt-4">
              <AvisoFormulario mensaje={error} />
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Boton
              type="submit"
              variante="primario"
              tamano="lg"
              cargando={enviando}
              disabled={idProfesional == null}
            >
              Reservar {hora(elegida.inicio)}
            </Boton>
          </div>
        </section>
      )}
    </form>
  );
}
