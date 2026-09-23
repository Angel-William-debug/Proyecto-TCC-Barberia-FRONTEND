import { barberosPublicos, catalogoServicios, turnosDisponibles } from '@barber-shop/api';
import { ZONA_HORARIA } from '@barber-shop/ui';

import { FormularioReserva } from '@/componentes/portal/formulario-reserva';

export const metadata = {
  title: 'Reservar un turno',
};

/**
 * Reserva de un turno desde el portal.
 *
 * El servicio y la fecha viajan en la URL, asi que esta pantalla puede pedirle
 * a la base exactamente las franjas que corresponden en lugar de traerlas
 * todas y filtrar en el navegador. Ver `FormularioReserva`.
 */

/** Hoy en la zona de la barberia, como aaaa-MM-dd. */
function hoyLocal(): string {
  // `en-CA` da aaaa-MM-dd, que es el formato que espera `input type="date"`.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());
}

export default async function Reservar({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const leer = (clave: string) => {
    const v = params[clave];
    return Array.isArray(v) ? v[0] : v;
  };

  // El barbero se puede elegir antes que el dia, asi que la lista se pide
  // siempre, no solo cuando ya hay franjas.
  const [catalogo, barberos] = await Promise.all([catalogoServicios(), barberosPublicos()]);

  // `servicio=1,3`: la misma convencion de valores multiples que usan las
  // tablas del panel. Se conserva el orden en que el cliente los fue eligiendo.
  const elegidos = (leer('servicio') ?? '')
    .split(',')
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);

  const fecha = leer('fecha') ?? '';

  const duracionTotal = elegidos
    .map((id) => catalogo.find((s) => s.id_servicio === id))
    .reduce((n, s) => n + (s?.duracion_min ?? 0), 0);

  // Las franjas solo se piden cuando hay al menos un servicio y una fecha: sin
  // eso no hay nada que calcular. Se pide por la duracion TOTAL, no por la de
  // cada servicio: un corte de 30 minutos entra en huecos donde un corte con
  // barba de 75 no. Y se piden llenas incluidas, para mostrarlas como tales.
  const franjas =
    duracionTotal > 0 && fecha
      ? await turnosDisponibles(fecha, duracionTotal, { incluirLlenas: true })
      : [];

  return (
    <div className="mt-2">
      <h1 className="font-display text-principal text-display-sm font-semibold">
        Reservar un turno
      </h1>
      <p className="text-cuerpo text-secundario medida-lectura mt-2">
        Elija qué se quiere hacer, el día y la hora. Cada horario dice cuántos lugares
        quedan, o si ya está lleno.
      </p>

      <div className="mt-6">
        <FormularioReserva
          servicios={catalogo}
          hoy={hoyLocal()}
          franjas={franjas}
          barberos={barberos}
        />
      </div>
    </div>
  );
}
