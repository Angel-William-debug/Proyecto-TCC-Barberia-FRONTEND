import {
  barberosPublicos,
  catalogoServicios,
  horariosPublicos,
  ocupacionBarberos,
  turnosDisponibles,
} from '@barber-shop/api';
import { ZONA_HORARIA } from '@barber-shop/ui';

import { CalendarioDisponibilidad } from '@/componentes/portal/calendario-disponibilidad';
import { FormularioReserva } from '@/componentes/portal/formulario-reserva';
import { PestanasVista } from '@/componentes/portal/pestanas-vista';

export const metadata = {
  title: 'Reservar un turno',
};

/**
 * Reserva de un turno desde el portal, en dos modos:
 *
 * - **Formulario** (el predeterminado): servicio, dia, barbero y hora. El
 *   servicio y la fecha viajan en la URL, asi que esta pantalla le pide a la
 *   base exactamente las franjas que corresponden. Ver `FormularioReserva`.
 * - **Calendario** (7/10/2026, pedido de la directora): el cliente elige
 *   barberos y ve en el mes cuando estan libres y cuando ocupados. Un tramo
 *   libre vuelve al formulario con el dia, el barbero y la hora puestos. Ver
 *   `CalendarioDisponibilidad`.
 */

/** Hoy en la zona de la barberia, como aaaa-MM-dd. */
function hoyLocal(): string {
  // `en-CA` da aaaa-MM-dd, que es el formato que espera `input type="date"`.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date());
}

/** Primer y ultimo dia de un aaaa-MM. */
function limitesDelMes(mes: string): [string, string] {
  const [a, m] = mes.split('-').map(Number) as [number, number];
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return [`${mes}-01`, `${mes}-${String(ultimo).padStart(2, '0')}`];
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

  const vista = leer('vista') === 'calendario' ? 'calendario' : 'formulario';
  const hoy = hoyLocal();

  // El barbero se puede elegir antes que el dia, asi que la lista se pide
  // siempre, no solo cuando ya hay franjas. Los horarios, para decir de que
  // hora a que hora se atiende.
  const [catalogo, barberos, horarios] = await Promise.all([
    catalogoServicios(),
    barberosPublicos(),
    horariosPublicos(),
  ]);

  let contenido: React.ReactNode;

  if (vista === 'calendario') {
    const mesUrl = leer('mes');
    const mes = mesUrl && /^\d{4}-\d{2}$/.test(mesUrl) ? mesUrl : hoy.slice(0, 7);
    const ids = (leer('barberos') ?? '')
      .split(',')
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);
    const [desde, hasta] = limitesDelMes(mes);
    const ocupacion = await ocupacionBarberos(desde, hasta, ids);

    contenido = (
      <CalendarioDisponibilidad
        barberos={barberos}
        horarios={horarios}
        ocupacion={ocupacion}
        hoy={hoy}
        ahora={new Date().toISOString()}
      />
    );
  } else {
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

    contenido = (
      <FormularioReserva
        servicios={catalogo}
        hoy={hoy}
        franjas={franjas}
        barberos={barberos}
        horarios={horarios}
      />
    );
  }

  return (
    <div className="mt-2">
      <h1 className="font-display text-principal text-display-sm font-semibold">
        Reservar un turno
      </h1>
      <p className="text-cuerpo text-secundario medida-lectura mt-2">
        {vista === 'calendario'
          ? 'Elija uno o más barberos y vea en el calendario cuándo están libres. Toque un horario libre para reservarlo.'
          : 'Elija qué se quiere hacer, el día y la hora. Cada horario dice de qué hora a qué hora es y cuántos lugares quedan.'}
      </p>

      <div className="mt-6">
        <PestanasVista
          etiqueta="Cómo reservar"
          opciones={[
            { valor: 'formulario', etiqueta: 'Formulario', icono: 'clipboard-list' },
            { valor: 'calendario', etiqueta: 'Calendario', icono: 'calendar-days' },
          ]}
        />
      </div>

      <div className="mt-6" role="tabpanel">
        {contenido}
      </div>
    </div>
  );
}
