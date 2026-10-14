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
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  PRESENTACION_CITA,
  Paginacion,
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

import Link from 'next/link';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { BotonExportar } from '@/componentes/compartido/boton-exportar';
import { FormularioTurno } from '@/componentes/agenda/formulario-turno';
import { PanelCierreServicio } from '@/componentes/agenda/panel-cierre-servicio';
import { PanelDetalleCita } from '@/componentes/agenda/panel-detalle-cita';
import {
  CalendarioMes,
  CalendarioSemana,
  limitesMes,
  lunesDe,
  sumarDias,
} from '@/componentes/agenda/calendario-agenda';
import { FiltroFecha } from '@/componentes/agenda/filtro-fecha';
import {
  fecha as leerFecha,
  lista,
  paginarFilas,
  texto,
  type Parametros,
} from '@/lib/filtros';

export const metadata = { title: 'Agenda' };

const OPCIONES_ESTADO = ESTADOS_CITA.map((e) => ({
  valor: e,
  etiqueta: PRESENTACION_CITA[e].etiqueta,
}));
const ETIQUETAS_ESTADO = Object.fromEntries(
  ESTADOS_CITA.map((e) => [e, PRESENTACION_CITA[e].etiqueta]),
);

/**
 * CU-005 (registrar) y CU-006 (modificar y cancelar) — Agenda de turnos.
 *
 * Tres vistas (15/10/2026): Día -la tabla, con el detalle de cada turno y sus
 * acciones-, Semana y Mes (vistas 38 y 39 del anexo). La vista viaja en la URL
 * junto con la fecha y el barbero.
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
  const vista = params.vista === 'semana' || params.vista === 'mes' ? params.vista : 'dia';
  const rango =
    vista === 'semana'
      ? { desde: lunesDe(dia), hasta: sumarDias(lunesDe(dia), 6) }
      : vista === 'mes'
        ? limitesMes(dia)
        : { desde: dia, hasta: dia };
  const hoy = hoyEnAsuncion();

  /** Enlace a otra vista o fecha, conservando el barbero elegido. */
  const enlace = (cambios: { vista?: string; fecha?: string }) => {
    const p = new URLSearchParams();
    const v = cambios.vista ?? vista;
    if (v !== 'dia') p.set('vista', v);
    p.set('fecha', cambios.fecha ?? dia);
    if (barbero) p.set('barbero', barbero);
    return `/panel/agenda?${p.toString()}`;
  };

  const [barberos, citas, clientes, servicios] = await Promise.all([
    listarProfesionales().catch(() => []),
    listarAgenda({
      desde: rango.desde,
      hasta: rango.hasta,
      estados,
      idProfesional: barbero ? Number(barbero) : undefined,
      busqueda: texto(params, 'q'),
    }),
    // Sin filtro: el formulario necesita el catalogo completo, no lo que
    // quedo despues de filtrar la agenda.
    listarClientes({ porPagina: 500 }).catch(() => null),
    listarServicios().catch(() => []),
  ]);

  const facturado = citas
    .filter((c) => c.estado === 'completado')
    .reduce((suma, c) => suma + c.total, 0);

  const pagCitas = paginarFilas(citas, params);

  return (
    <>
      <EncabezadoVista
        titulo="Agenda"
        descripcion={
          vista === 'dia'
            ? fechaLarga(`${dia}T12:00:00`)
            : vista === 'semana'
              ? `Semana del ${fechaLarga(`${rango.desde}T12:00:00`)}`
              : 'Mes completo'
        }
        accion={
          <FormularioTurno
            clientes={clientes?.datos ?? []}
            servicios={servicios}
            profesionales={barberos}
            fecha={dia}
          />
        }
      />

      {/* Día, Semana o Mes. Enlaces y no pestañas de cliente: cambian la
          consulta del servidor y conservan la fecha y el barbero. */}
      <nav aria-label="Vista de la agenda" className="mb-6 flex flex-wrap items-center gap-3">
        <div className="border-borde-sutil bg-superficie inline-flex rounded-md border p-1">
          {(
            [
              ['dia', 'Día'],
              ['semana', 'Semana'],
              ['mes', 'Mes'],
            ] as const
          ).map(([v, etiqueta]) => (
            <Link
              key={v}
              href={enlace({ vista: v })}
              aria-current={vista === v ? 'page' : undefined}
              className={
                vista === v
                  ? 'text-cuerpo-sm inline-flex h-9 items-center rounded-sm bg-[var(--chip-marca-fondo)] px-4 font-medium text-[var(--chip-marca-texto)]'
                  : 'text-cuerpo-sm text-secundario hover:text-principal hover:bg-elevado inline-flex h-9 items-center rounded-sm px-4 font-medium'
              }
            >
              {etiqueta}
            </Link>
          ))}
        </div>
        {vista !== 'dia' && (
          <div className="flex items-center gap-2">
            <Link
              href={enlace({ fecha: vista === 'semana' ? sumarDias(rango.desde, -7) : sumarDias(`${dia.slice(0, 7)}-01`, -1) })}
              className="text-cuerpo-sm text-secundario hover:text-principal border-borde-control inline-flex h-9 items-center rounded-md border px-3"
            >
              ← {vista === 'semana' ? 'Semana anterior' : 'Mes anterior'}
            </Link>
            <Link
              href={enlace({ fecha: hoy })}
              className="text-cuerpo-sm text-secundario hover:text-principal border-borde-control inline-flex h-9 items-center rounded-md border px-3"
            >
              Hoy
            </Link>
            <Link
              href={enlace({ fecha: vista === 'semana' ? sumarDias(rango.desde, 7) : sumarDias(`${dia.slice(0, 7)}-01`, 32).slice(0, 8) + '01' })}
              className="text-cuerpo-sm text-secundario hover:text-principal border-borde-control inline-flex h-9 items-center rounded-md border px-3"
            >
              {vista === 'semana' ? 'Semana siguiente' : 'Mes siguiente'} →
            </Link>
          </div>
        )}
      </nav>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          [vista === 'dia' ? 'Turnos del día' : vista === 'semana' ? 'Turnos de la semana' : 'Turnos del mes', String(citas.length)],
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
        <BarraFiltros
          fijos={vista === 'dia' ? <FiltroFecha valor={dia} /> : undefined}
          busqueda={<CampoBusqueda placeholder="Cliente, teléfono o servicio" />}
          avanzados={
            <>
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
            </>
          }
          parametrosAvanzados={['barbero', 'estado']}
          // La agenda se filtra por "fecha" (un solo día), no por
          // "desde"/"hasta" como el resto de las pantallas — se los pasa
          // explícitos para que el reporte exporte el día que se está
          // viendo, no el mes entero.
          acciones={
            <BotonExportar tipo="agenda" searchParams={{ ...params, desde: rango.desde, hasta: rango.hasta }} />
          }
        />

        <FiltrosActivos
          total={citas.length}
          sustantivo={['turno', 'turnos']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ESTADO },
            barbero: {
              titulo: 'Barbero',
              valores: Object.fromEntries(
                barberos.map((b) => [String(b.id_profesional), b.nombre]),
              ),
            },
          }}
        />

        {vista === 'semana' && (
          <div className="p-4">
            <CalendarioSemana desde={rango.desde} citas={citas} hoy={hoy} barbero={barbero} />
          </div>
        )}
        {vista === 'mes' && (
          <div className="p-4">
            <CalendarioMes fecha={dia} citas={citas} hoy={hoy} barbero={barbero} />
          </div>
        )}

        {vista === 'dia' && (
        <>
        <Tabla titulo={`Turnos agendados para el ${dia}`}>
          <TablaEncabezado>
            <Th>Hora</Th>
            <Th>Cliente</Th>
            <Th>Servicios</Th>
            <Th>Barbero</Th>
            <Th>Duración</Th>
            <Th numerico>Total</Th>
            <Th>Estado</Th>
            <Th>
              <span className="solo-lectores">Acciones</span>
            </Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {citas.length === 0 ? (
              <TdCompleta colSpan={8}>
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
              pagCitas.filas.map((c) => (
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
                  <Td etiqueta="Acciones" className="text-right">
                    <span className="inline-flex items-center gap-1">
                      <PanelDetalleCita cita={c} />
                      {(c.estado === 'pendiente' ||
                        c.estado === 'confirmado' ||
                        c.estado === 'en_proceso') && (
                        <PanelCierreServicio idCita={c.id_cita} nombreCliente={c.cliente.nombre} />
                      )}
                    </span>
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
        <Paginacion {...pagCitas.paginacion} />
        </>
        )}
      </Tarjeta>
    </>
  );
}
