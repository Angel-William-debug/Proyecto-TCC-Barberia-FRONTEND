import {
  CRITERIOS_RANKING,
  TITULOS_CRITERIO,
  rankingBarberos,
  type CriterioRanking,
} from '@barber-shop/api';
import {
  BarraFiltros,
  EstadoVacio,
  Icono,
  RangoFechas,
  SelectorFiltro,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Td,
  Th,
  Tr,
  cn,
  duracion,
  fechaCorta,
  guaranies,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { comunes, texto, type Parametros } from '@/lib/filtros';

export const metadata = {
  title: 'Ranking de barberos',
};

/**
 * Ranking del equipo.
 *
 * POR VOLUMEN, NO POR VALORACION, y la pantalla lo dice en voz alta en lugar
 * de dejarlo implicito. La Direccion lo pidio «segun las valoraciones o
 * volumen de atencion»; no hay tabla de valoraciones en el sistema, asi que
 * se implementa lo segundo. Presentar la facturacion como si fuera una
 * puntuacion del cliente seria atribuirle al cliente una opinion que nunca
 * dio.
 */
function esCriterio(valor: string | undefined): valor is CriterioRanking {
  return !!valor && (CRITERIOS_RANKING as readonly string[]).includes(valor);
}

export default async function Ranking({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const { desde, hasta } = comunes(params);

  const bruto = texto(params, 'criterio');
  const criterio: CriterioRanking = esCriterio(bruto) ? bruto : 'servicios';

  const filas = await rankingBarberos({ criterio, desde, hasta });

  const destacado = (f: (typeof filas)[number]) => f.posicion === 1 && f.serviciosRealizados > 0;

  return (
    <>
      <EncabezadoVista
        titulo="Ranking de barberos"
        descripcion="Desempeño del equipo, ordenado por el criterio que se elija."
      />

      <BarraFiltros>
        <SelectorFiltro
          nombre="criterio"
          etiqueta="Ordenar por"
          opciones={CRITERIOS_RANKING.map((c) => ({ valor: c, etiqueta: TITULOS_CRITERIO[c] }))}
          textoTodos="Servicios realizados"
        />
        <RangoFechas />
      </BarraFiltros>

      {/* Se avisa lo que el filtro de fechas alcanza y lo que no. Un filtro que
          solo afecta a una columna y no lo dice es peor que no tenerlo: el
          usuario lee el resto de los numeros como si estuvieran filtrados. */}
      <p className="text-cuerpo-sm text-terciario mt-4 flex items-start gap-2">
        <Icono nombre="circle-alert" tamano="sm" className="mt-0.5 shrink-0" />
        <span className="medida-lectura">
          El rango de fechas afecta solo a las horas ocupadas, que es la única columna con
          fecha propia. Servicios, facturación y ticket promedio son del histórico completo.
          El orden es por volumen de atención, no por valoración del cliente: el sistema
          todavía no registra valoraciones.
        </span>
      </p>

      {filas.length === 0 ? (
        <div className="mt-6">
          <EstadoVacio
            icono="trophy"
            titulo="Todavía no hay barberos cargados"
            descripcion="El ranking se arma con los servicios realizados. Cargue el equipo desde Barberos."
          />
        </div>
      ) : (
        <div className="mt-6">
          <Tabla titulo="Ranking de barberos por desempeño">
            <TablaEncabezado>
              <Tr>
                <Th className="w-16">#</Th>
                <Th>Barbero</Th>
                <Th numerico>Servicios</Th>
                <Th numerico>Clientes</Th>
                <Th numerico>Facturado</Th>
                <Th numerico>Ticket promedio</Th>
                <Th numerico>Horas ocupadas</Th>
                <Th>Último servicio</Th>
              </Tr>
            </TablaEncabezado>

            <TablaCuerpo>
              {filas.map((f) => (
                <Tr key={f.idProfesional}>
                  <Td etiqueta="Posición">
                    <span
                      className={cn(
                        'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 font-semibold tabular-nums',
                        destacado(f)
                          ? 'bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]'
                          : 'bg-elevado text-secundario',
                      )}
                    >
                      {f.posicion}
                    </span>
                  </Td>

                  <Td etiqueta="Barbero">
                    <span className="text-principal font-medium">{f.nombre}</span>
                    {f.especialidad && (
                      <span className="text-cuerpo-sm text-terciario block">
                        {f.especialidad}
                      </span>
                    )}
                  </Td>

                  <Td etiqueta="Servicios" numerico>
                    {f.serviciosRealizados}
                  </Td>
                  <Td etiqueta="Clientes" numerico>
                    {f.clientesDistintos}
                  </Td>
                  <Td etiqueta="Facturado" numerico>
                    {guaranies(f.facturado)}
                  </Td>
                  <Td etiqueta="Ticket promedio" numerico>
                    {f.ticketPromedio ? guaranies(f.ticketPromedio) : '—'}
                  </Td>
                  <Td etiqueta="Horas ocupadas" numerico>
                    {f.minutosOcupados ? duracion(f.minutosOcupados) : '—'}
                  </Td>
                  <Td etiqueta="Último servicio">
                    {f.ultimoServicio ? fechaCorta(f.ultimoServicio) : 'Sin servicios'}
                  </Td>
                </Tr>
              ))}
            </TablaCuerpo>
          </Tabla>
        </div>
      )}
    </>
  );
}
