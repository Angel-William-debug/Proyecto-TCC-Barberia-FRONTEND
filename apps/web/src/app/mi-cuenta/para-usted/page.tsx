import Link from 'next/link';

import { catalogoServicios, misRecomendaciones } from '@barber-shop/api';
import { Boton, EstadoVacio, Icono, duracion, fechaHora, guaranies, plural } from '@barber-shop/ui';

import { BotonMisRecomendaciones } from '@/componentes/portal/boton-mis-recomendaciones';

export const metadata = {
  title: 'Para usted',
};

/**
 * Recomendaciones del cliente (CU-013 desde el portal).
 *
 * El mismo motor que usa el panel -K-Means y filtrado colaborativo-, pero
 * pedido por el propio cliente. Cada servicio dice POR QUE se lo recomienda,
 * en palabras y no con el nombre del algoritmo, y lleva directo a reservarlo:
 * una recomendacion que obliga a buscar el servicio en otra pantalla es una
 * recomendacion que no se usa.
 *
 * Con menos de tres servicios en el historial (RN-009) todavia no se genera
 * nada, y la pantalla lo explica con cuanto le falta en vez de mostrarse
 * vacia.
 */
export default async function ParaUsted() {
  const [{ recomendaciones, visitas, minimo }, catalogo] = await Promise.all([
    misRecomendaciones(),
    catalogoServicios(),
  ]);

  const servicio = new Map(catalogo.map((s) => [s.id_servicio, s]));
  const generadas = recomendaciones[0]?.fecha_generacion;

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-principal text-display-sm font-semibold">Para usted</h1>
          <p className="text-cuerpo text-secundario medida-lectura mt-2">
            Servicios que todavía no probó y que le pueden gustar, según lo que eligen los
            clientes con gustos parecidos a los suyos.
          </p>
        </div>
        {visitas >= minimo && (
          <BotonMisRecomendaciones hayRecomendaciones={recomendaciones.length > 0} />
        )}
      </div>

      {visitas < minimo ? (
        <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
          <EstadoVacio
            icono="sparkles"
            titulo="Todavía lo estamos conociendo"
            descripcion={
              `Le recomendamos servicios cuando tenga al menos ${minimo} en su historial. ` +
              `Lleva ${plural(visitas, 'servicio', 'servicios')}.`
            }
            accion={
              <Link href="/mi-cuenta/reservar">
                <Boton variante="primario">Reservar un turno</Boton>
              </Link>
            }
          />
        </div>
      ) : recomendaciones.length === 0 ? (
        <div className="border-borde-sutil bg-superficie mt-6 rounded-lg border p-2">
          <EstadoVacio
            icono="sparkles"
            titulo="Todavía no generó sus recomendaciones"
            descripcion="Toque «Ver mis recomendaciones» y las calculamos con su historial."
          />
        </div>
      ) : (
        <>
          {generadas && (
            <p className="text-cuerpo-sm text-terciario mt-6">
              Actualizadas el {fechaHora(generadas)}
            </p>
          )}

          <ul className="mt-3 flex flex-col gap-4">
            {recomendaciones.map((r) => {
              const s = servicio.get(r.id_servicio);
              const coincidencia = Math.round(r.score_relevancia * 100);
              const porParecidos = r.algoritmo !== 'mas_pedidos_v1';

              return (
                <li
                  key={r.id_recomendacion}
                  className="border-borde-sutil bg-superficie flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:p-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-cuerpo text-principal font-semibold">{r.nombre_servicio}</p>
                    {s?.descripcion && (
                      <p className="text-cuerpo-sm text-secundario mt-1">{s.descripcion}</p>
                    )}
                    <p className="text-cuerpo-sm text-terciario mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {s && (
                        <>
                          <span className="flex items-center gap-1.5">
                            <Icono nombre="clock" tamano="xs" />
                            {duracion(s.duracion_min)}
                          </span>
                          <span className="tabular-nums">{guaranies(s.precio_base)}</span>
                        </>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Icono nombre={porParecidos ? 'user-round' : 'trending-up'} tamano="xs" />
                        {porParecidos
                          ? 'Lo eligen clientes con gustos parecidos a los suyos'
                          : 'De lo más pedido en la barbería'}
                      </span>
                    </p>

                    {/* Barra de coincidencia. El numero va en texto ademas de
                        la barra: el color y el largo solos no alcanzan. */}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="bg-elevado h-1.5 w-full max-w-48 overflow-hidden rounded-full">
                        <div className="bg-marca h-full rounded-full" style={{ width: `${coincidencia}%` }} />
                      </div>
                      <span className="text-titulillo text-terciario tabular-nums">
                        {coincidencia} % de coincidencia
                      </span>
                    </div>
                  </div>

                  <Link href={`/mi-cuenta/reservar?servicio=${r.id_servicio}`} className="shrink-0">
                    {/* Secundario: con varias recomendaciones habria varios botones
                        ambar, y el sistema admite una sola accion primaria por
                        pantalla (seccion 4.9). */}
                    <Boton variante="secundario" icono="calendar-days">
                      Reservar este
                    </Boton>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
