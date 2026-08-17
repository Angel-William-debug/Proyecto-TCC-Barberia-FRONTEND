import { listarCobros, listarMetodosPago } from '@barber-shop/api';
import { ESTADOS_COBRO } from '@barber-shop/tipos';
import {
  BarraFiltros,
  Boton,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  PRESENTACION_COBRO,
  RangoFechas,
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
  fechaHora,
  guaranies,
  identificador,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';
import { comunes, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Cobros' };

/** Opciones y etiquetas salen del mismo mapa que pinta los chips: una sola fuente. */
const OPCIONES_ESTADO = ESTADOS_COBRO.map((e) => ({
  valor: e,
  etiqueta: PRESENTACION_COBRO[e].etiqueta,
}));
const ETIQUETAS_ESTADO = Object.fromEntries(
  ESTADOS_COBRO.map((e) => [e, PRESENTACION_COBRO[e].etiqueta]),
);

/** CU-008 — Registro de cobros al cliente. */
export default async function PaginaCobros({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const filtro = { ...comunes(params), metodo: texto(params, 'metodo') };

  const [cobros, metodos] = await Promise.all([listarCobros(filtro), listarMetodosPago()]);

  const cobrado = cobros
    .filter((c) => c.estado === 'pagado' || c.estado === 'parcial')
    .reduce((suma, c) => suma + c.monto, 0);
  const pendiente = cobros
    .filter((c) => c.estado === 'pendiente')
    .reduce((suma, c) => suma + c.monto, 0);

  return (
    <>
      <EncabezadoVista
        titulo="Cobros"
        descripcion="Pagos registrados sobre turnos completados"
        accion={
          <Boton variante="primario" icono="plus">
            Registrar cobro
          </Boton>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Cobrado', guaranies(cobrado)],
          ['Pendiente de cobro', guaranies(pendiente)],
          ['Movimientos', String(cobros.length)],
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
          <CampoBusqueda placeholder="Nombre del cliente" />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ESTADO} />
          <SelectorFiltro
            nombre="metodo"
            etiqueta="Método de pago"
            textoTodos="Todos los métodos"
            opciones={metodos.map((m) => ({ valor: m.nombre, etiqueta: m.nombre }))}
          />
          <RangoFechas etiqueta="Fecha de pago" />
        </BarraFiltros>

        <FiltrosActivos
          total={cobros.length}
          sustantivo={['cobro', 'cobros']}
          etiquetas={{
            q: { titulo: 'Cliente' },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ESTADO },
            metodo: { titulo: 'Método' },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Cobros registrados">
          <TablaEncabezado>
            <Th>Turno</Th>
            <Th>Cliente</Th>
            <Th>Método de pago</Th>
            <Th>Fecha de pago</Th>
            <Th numerico>Monto</Th>
            <Th>Estado</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {cobros.length === 0 ? (
              <TdCompleta colSpan={6}>
                <EstadoVacio
                  icono="receipt"
                  titulo="No se encontraron cobros"
                  descripcion="Ningún cobro cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              cobros.map((c) => (
                <Tr key={c.id_cobro} interactiva>
                  <Td className="font-mono" etiqueta="Turno">{identificador(c.id_cita)}</Td>
                  <Td className="font-medium" etiqueta="Cliente">{c.nombre_cliente}</Td>
                  <Td className="text-secundario" etiqueta="Método de pago">{c.metodo_pago}</Td>
                  <Td className="text-secundario" etiqueta="Fecha de pago">
                    {c.fecha_pago ? fechaHora(c.fecha_pago) : '—'}
                  </Td>
                  <Td numerico etiqueta="Monto">{guaranies(c.monto)}</Td>
                  <Td etiqueta="Estado">
                    <ChipEstado presentacion={PRESENTACION_COBRO[c.estado]} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>

      <p className="text-cuerpo-sm text-terciario mt-4">
        Solo se puede registrar un cobro sobre una cita completada (RN-024), y un cobro parcial
        deja el saldo pendiente hasta completarse (RN-025).
      </p>
    </>
  );
}
