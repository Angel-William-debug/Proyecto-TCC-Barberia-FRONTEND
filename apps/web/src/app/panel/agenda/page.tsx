import {
  listarAgenda,
  listarClientes,
  listarProfesionales,
  listarServicios,
} from '@barber-shop/api';
import { ESTADOS_CITA, type EstadoCita } from '@barber-shop/tipos';
import {
  BarraFiltros,
  Boton,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  PRESENTACION_CITA,
  SelectorFiltro,
  SelectorMultiple,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  Td,
  TdCompleta,
  Th,
  Tr,
  duracion,
  fechaLarga,
  guaranies,
  hora,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';
import { FormularioTurno } from '@/componentes/formularios/formulario-turno';
import { FiltroFecha } from '@/componentes/navegacion/filtro-fecha';
import { fecha as leerFecha, lista, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Agenda' };

const OPCIONES_ESTADO = ESTADOS_CITA.map((e) => ({
  valor: e,
  etiqueta: PRESENTACION_CITA[e].etiqueta,
}));
const ETIQUETAS_ESTADO = Object.fromEntries(
  ESTADOS_CITA.map((e) => [e, PRESENTACION_CITA[e].etiqueta]),
);

/**
 * CU-006 — Agenda de turnos. Vista diaria.
 *
 * La fecha viaja en la URL para que un día concreto se pueda compartir por
 * enlace. Sin parámetro, se muestra el día de hoy en hora de Asunción.
 */
function hoyEnAsuncion(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()); // en-CA produce directamente aaaa-MM-dd
}

export default async function PaginaAgenda({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const dia = leerFecha(params, 'fecha') ?? hoyEnAsuncion();
  const estados = lista(params, 'estado') as EstadoCita[] | undefined;
  const barbero = texto(params, 'barbero');

  const [barberos, citas, clientes, servicios] = await Promise.all([
    listarProfesionales().catch(() => []),
    listarAgenda({
      desde: dia,
      hasta: dia,
      estados,
      idProfesional: barbero ? Number(barbero) : undefined,
    }),
    // Sin filtro: el formulario necesita el catalogo completo, no lo que
    // quedo despues de filtrar la agenda.
    listarClientes({ porPagina: 500 }).catch(() => null),
    listarServicios().catch(() => []),
  ]);

  const facturado = citas
    .filter((c) => c.estado === 'completado')
    .reduce((suma, c) => suma + c.total, 0);

  return (
    <>
      <EncabezadoVista
        titulo="Agenda"
        descripcion={fechaLarga(`${dia}T12:00:00`)}
        accion={
          <FormularioTurno
            clientes={clientes?.datos ?? []}
            servicios={servicios}
            profesionales={barberos}
            fecha={dia}
          />
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Turnos del día', String(citas.length)],
          ['Completados', String(citas.filter((c) => c.estado === 'completado').length)],
          ['Facturado', guaranies(facturado)],
        ].map(([etiqueta, valor]) => (
          <Tarjeta key={etiqueta} className="p-4">
            <p className="text-titulillo text-terciario font-semibold tracking-[0.08em] uppercase">
              {etiqueta}
            </p>
            <p className="font-display text-principal text-display-lg mt-2 tabular-nums">
              {valor}
            </p>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta>
        <BarraFiltros>
          <FiltroFecha valor={dia} />
          <SelectorFiltro
            nombre="barbero"
            etiqueta="Barbero"
            textoTodos="Todos los barberos"
            opciones={barberos.map((b) => ({
              valor: String(b.id_profesional),
              etiqueta: b.nombre,
            }))}
          />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ESTADO} />
        </BarraFiltros>

        <FiltrosActivos
          total={citas.length}
          sustantivo={['turno', 'turnos']}
          etiquetas={{
            estado: { titulo: 'Estado', valores: ETIQUETAS_ESTADO },
            barbero: {
              titulo: 'Barbero',
              valores: Object.fromEntries(
                barberos.map((b) => [String(b.id_profesional), b.nombre]),
              ),
            },
          }}
        />

        <Tabla titulo={`Turnos agendados para el ${dia}`}>
          <TablaEncabezado>
            <Th>Hora</Th>
            <Th>Cliente</Th>
            <Th>Servicios</Th>
            <Th>Barbero</Th>
            <Th>Duración</Th>
            <Th numerico>Total</Th>
            <Th>Estado</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {citas.length === 0 ? (
              <TdCompleta colSpan={7}>
                <EstadoVacio
                  icono="calendar-days"
                  titulo="No hay turnos para mostrar"
                  descripcion="No hay turnos ese día, o ninguno cumple con los filtros aplicados."
                  accion={
                    <Boton variante="primario" icono="plus">
                      Nuevo turno
                    </Boton>
                  }
                />
              </TdCompleta>
            ) : (
              citas.map((c) => (
                <Tr key={c.id_cita} interactiva>
                  <Td className="font-mono font-medium" etiqueta="Hora">{hora(c.fecha_hora)}</Td>
                  <Td className="font-medium" etiqueta="Cliente">{c.cliente.nombre}</Td>
                  <Td className="text-secundario" etiqueta="Servicios">
                    {c.servicios.map((s) => s.servicio.nombre).join(', ')}
                  </Td>
                  <Td className="text-secundario" etiqueta="Barbero">
                    {[...new Set(c.servicios.map((s) => s.profesional.nombre))].join(', ')}
                  </Td>
                  <Td className="text-secundario" etiqueta="Duración">{duracion(c.duracionTotalMin)}</Td>
                  <Td numerico etiqueta="Total">{guaranies(c.total)}</Td>
                  <Td etiqueta="Estado">
                    <ChipEstado presentacion={PRESENTACION_CITA[c.estado]} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>
    </>
  );
}
