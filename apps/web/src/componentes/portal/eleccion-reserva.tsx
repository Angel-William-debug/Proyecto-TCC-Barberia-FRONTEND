'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId } from 'react';

import type { VistaPublicoServicio } from '@barber-shop/tipos';
import { Icono, cn, duracion, guaranies, plural } from '@barber-shop/ui';

/**
 * Los dos primeros pasos de la reserva: que servicios y que dia.
 *
 * EL ESTADO VIVE EN LA URL, igual que los filtros de las tablas del panel
 * (regla 3 del proyecto, seccion 9.9 del sistema de diseno). Aca rinde todavia
 * mas que alla: la lista de horarios libres depende de los servicios elegidos
 * -de su duracion sumada- y del dia, y con los dos en la URL el componente de
 * servidor puede pedirle a la base exactamente las franjas que corresponden.
 * Ademas, el boton Atras deshace la eleccion y el enlace se puede compartir.
 *
 * Los servicios van en un solo parametro separado por comas -`servicio=1,3`-,
 * que es la misma convencion que usa `estado` en las tablas del panel.
 *
 * SE PUEDE ELEGIR MAS DE UNO
 *
 * Quien viene por corte y barba pide un turno, no dos. Cada servicio que se
 * agrega suma su duracion y su precio, y esa duracion total es la que decide
 * que franjas se ofrecen: un turno de 75 minutos no entra donde entraba uno
 * de 30.
 */
export function EleccionReserva({
  servicios,
  hoy,
}: {
  servicios: VistaPublicoServicio[];
  /** aaaa-MM-dd de hoy en la zona de la barberia, calculado en el servidor. */
  hoy: string;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const idFecha = useId();

  const elegidos = (params.get('servicio') ?? '')
    .split(',')
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);

  const fechaElegida = params.get('fecha') ?? '';

  function aplicar(cambios: Record<string, string>) {
    const siguientes = new URLSearchParams(params.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguientes.set(clave, valor);
      else siguientes.delete(clave);
    }
    const consulta = siguientes.toString();
    router.push(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
  }

  function alternar(id: number) {
    const siguiente = elegidos.includes(id)
      ? elegidos.filter((n) => n !== id)
      : [...elegidos, id];
    aplicar({ servicio: siguiente.join(',') });
  }

  const seleccionados = elegidos
    .map((id) => servicios.find((s) => s.id_servicio === id))
    .filter((s): s is VistaPublicoServicio => Boolean(s));

  const duracionTotal = seleccionados.reduce((n, s) => n + s.duracion_min, 0);
  const precioTotal = seleccionados.reduce((n, s) => n + s.precio_base, 0);

  return (
    <div className="border-borde-sutil bg-superficie rounded-lg border p-4 sm:p-5">
      <fieldset>
        <legend className="text-etiqueta text-secundario font-medium">
          ¿Qué se quiere hacer?
        </legend>
        <p className="text-cuerpo-sm text-terciario mt-1">
          Puede elegir más de uno; se atienden seguidos en el mismo turno.
        </p>

        <ul className="mt-3 flex flex-col gap-2">
          {servicios.map((s) => {
            const activo = elegidos.includes(s.id_servicio);
            return (
              <li key={s.id_servicio}>
                {/* Casilla nativa y no un boton con `aria-pressed`: es una
                    seleccion multiple, y la casilla es lo que un lector de
                    pantalla anuncia como tal. Se oculta visualmente y el
                    recuadro entero hace de etiqueta. */}
                <label
                  className={cn(
                    'flex min-h-[56px] cursor-pointer items-center gap-3 rounded-md border px-4 py-3 transition-colors',
                    'focus-within:border-marca',
                    activo
                      ? 'border-marca bg-[var(--chip-marca-fondo)]'
                      : 'border-borde-sutil bg-fondo hover:border-borde-control',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={() => alternar(s.id_servicio)}
                    className="sr-only"
                  />
                  <Icono
                    nombre={activo ? 'circle-check' : 'circle-dashed'}
                    tamano="md"
                    className={activo ? 'text-marca' : 'text-terciario'}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-cuerpo text-principal block font-medium">
                      {s.nombre}
                    </span>
                    <span className="text-cuerpo-sm text-terciario block">
                      {duracion(s.duracion_min)} · {s.categoria}
                    </span>
                  </span>
                  <span className="text-cuerpo text-secundario shrink-0 tabular-nums">
                    {guaranies(s.precio_base)}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {seleccionados.length > 0 && (
        <p className="border-borde-sutil text-cuerpo text-principal mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <span className="text-secundario text-cuerpo-sm">
            {plural(seleccionados.length, 'servicio elegido', 'servicios elegidos')} ·{' '}
            {duracion(duracionTotal)}
          </span>
          <span className="font-semibold tabular-nums">{guaranies(precioTotal)}</span>
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <label htmlFor={idFecha} className="text-etiqueta text-secundario font-medium">
          ¿Qué día?
        </label>
        <input
          id={idFecha}
          type="date"
          value={fechaElegida}
          // `min` evita el caso mas comun de error antes de que ocurra: el
          // disparador `trg_cita_validar` rechaza una cita en el pasado, y
          // ofrecer una fecha que la base va a rechazar es un mal formulario.
          min={hoy}
          onChange={(e) => aplicar({ fecha: e.target.value })}
          className={cn(
            'bg-fondo border-borde-control text-principal',
            'text-cuerpo h-11 w-full rounded-md border px-3 sm:max-w-xs',
          )}
        />
      </div>
    </div>
  );
}
