'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useId } from 'react';

import type { VistaPublicoServicio } from '@barber-shop/tipos';
import { cn, duracion, guaranies } from '@barber-shop/ui';

/**
 * Los dos primeros pasos de la reserva: que servicio y que dia.
 *
 * EL ESTADO VIVE EN LA URL, igual que los filtros de las tablas del panel
 * (regla 3 del proyecto, seccion 9.9 del sistema de diseno). Aca rinde todavia
 * mas que alla: la lista de horarios libres depende del servicio y del dia, y
 * con los dos en la URL el componente de servidor puede pedirle a la base
 * exactamente las franjas que corresponden, en vez de traerlas todas y
 * descartar en el navegador. Ademas, el boton Atras deshace la eleccion y el
 * enlace se puede compartir.
 *
 * Los dos controles son `select` e `input type="date"` nativos. En el telefono
 * abren la rueda y el calendario del sistema, que es justamente donde este
 * portal se va a usar.
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
  const idServicio = useId();
  const idFecha = useId();

  const servicioElegido = params.get('servicio') ?? '';
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

  const clases = cn(
    'bg-fondo border-borde-control text-principal',
    'text-cuerpo h-11 w-full rounded-md border px-3',
  );

  return (
    <div className="border-borde-sutil bg-superficie rounded-lg border p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor={idServicio} className="text-etiqueta text-secundario font-medium">
            ¿Qué se quiere hacer?
          </label>
          <select
            id={idServicio}
            value={servicioElegido}
            onChange={(e) => aplicar({ servicio: e.target.value })}
            className={clases}
          >
            <option value="">Elija un servicio</option>
            {servicios.map((s) => (
              <option key={s.id_servicio} value={String(s.id_servicio)}>
                {s.nombre} — {duracion(s.duracion_min)} — {guaranies(s.precio_base)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
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
            className={clases}
          />
        </div>
      </div>
    </div>
  );
}
