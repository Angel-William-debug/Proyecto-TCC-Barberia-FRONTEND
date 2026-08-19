import Link from 'next/link';

import {
  comisionesPendientes,
  ingresosPorPeriodo,
  previsualizarReporte,
  resumenKpis,
  stockCritico,
  TIPOS_REPORTE,
  TITULOS_TIPO_REPORTE,
} from '@barber-shop/api';
import type { TipoReporte } from '@barber-shop/api';
import {
  BarraFiltros,
  Boton,
  CampoBusqueda,
  EstadoVacio,
  Indicador,
  RangoFechas,
  SelectorFiltro,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaEncabezado,
  Td,
  TdCompleta,
  Th,
  Tr,
  cantidad,
  guaranies,
  porcentaje,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { fecha, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Reportes' };

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// El tipo "general" hace de opcion en blanco del selector (ver comentario
// junto a `SelectorFiltro` mas abajo): no aparece en la lista de opciones
// porque elegir "todos" -el valor vacio del selector- ya significa eso.
const OPCIONES_TIPO = TIPOS_REPORTE.filter((t) => t !== 'general').map((t) => ({
  valor: t,
  etiqueta: TITULOS_TIPO_REPORTE[t],
}));

function esTipoReporte(valor: string): valor is TipoReporte {
  return (TIPOS_REPORTE as readonly string[]).includes(valor);
}

/**
 * Módulo 7 — Reportes (CU-014).
 *
 * Dos secciones. Arriba, el resumen del período en curso: los agregados los
 * calcula la base (`fn_generar_resumen_kpis` y las vistas SQL), traerlos
 * enteros para sumarlos aquí sería más lento y daría resultados distintos
 * según quién consulte. Abajo, el generador: se elige un tipo de reporte, se
 * ve una vista previa y se exporta a Excel o PDF desde una ruta -no una
 * Server Action, que no puede empujar un archivo binario al navegador-.
 */
export default async function PaginaReportes({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const hoy = new Date();
  const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-28`;

  const tipoParametro = texto(params, 'tipo') ?? '';
  const tipo: TipoReporte = esTipoReporte(tipoParametro) ? tipoParametro : 'general';

  const filtroReporte = {
    desde: fecha(params, 'desde'),
    hasta: fecha(params, 'hasta'),
    busqueda: texto(params, 'q'),
  };

  const [kpis, ingresos, criticos, comisiones, previsualizacion] = await Promise.all([
    resumenKpis(desde, hasta),
    ingresosPorPeriodo(),
    stockCritico(),
    comisionesPendientes(),
    previsualizarReporte(tipo, filtroReporte),
  ]);

  const mayorIngreso = Math.max(...ingresos.map((i) => i.total_ingresos), 1);

  const queryExportar = new URLSearchParams();
  queryExportar.set('tipo', tipo);
  if (filtroReporte.desde) queryExportar.set('desde', filtroReporte.desde);
  if (filtroReporte.hasta) queryExportar.set('hasta', filtroReporte.hasta);
  if (filtroReporte.busqueda) queryExportar.set('q', filtroReporte.busqueda);

  return (
    <>
      <EncabezadoVista titulo="Reportes" descripcion="Indicadores del período en curso" />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          etiqueta="Ingresos del período"
          valor={guaranies(kpis.total_ingresos)}
          icono="receipt"
        />
        <Indicador
          etiqueta="Clientes atendidos"
          valor={String(kpis.clientes_atendidos)}
          icono="user-round"
        />
        <Indicador
          etiqueta="Servicios completados"
          valor={String(kpis.servicios_completados)}
          icono="sparkles"
        />
        <Indicador
          etiqueta="Tasa de cancelación"
          valor={porcentaje(kpis.tasa_cancelacion)}
          icono="circle-x"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Ingresos por mes"
            descripcion="Cobros pagados y parciales"
          />
          <div className="space-y-4 p-6">
            {ingresos.map((i) => (
              <div key={`${i.anio}-${i.mes}`}>
                <div className="mb-1.5 flex items-baseline justify-between gap-4">
                  <span className="text-cuerpo text-principal">
                    {MESES[i.mes - 1]} {i.anio}
                  </span>
                  <span className="text-cuerpo text-principal font-medium tabular-nums">
                    {guaranies(i.total_ingresos)}
                  </span>
                </div>
                <div className="bg-elevado h-2 w-full overflow-hidden rounded-full">
                  <div
                    className="bg-marca h-full rounded-full"
                    style={{ width: `${(i.total_ingresos / mayorIngreso) * 100}%` }}
                  />
                </div>
                <p className="text-cuerpo-sm text-terciario mt-1">
                  {i.cantidad_servicios} servicios · ticket promedio{' '}
                  {guaranies(i.ticket_promedio)}
                </p>
              </div>
            ))}
          </div>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <TarjetaEncabezado
              titulo="Stock crítico"
              descripcion="Productos en o por debajo del mínimo"
            />
            <Tabla titulo="Productos con stock crítico">
              <TablaEncabezado>
                <Th>Producto</Th>
                <Th numerico>Actual</Th>
                <Th numerico>Mínimo</Th>
                <Th numerico>Faltante</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {criticos.map((p) => (
                  <Tr key={p.id_producto}>
                    <Td className="font-medium" etiqueta="Producto">{p.nombre}</Td>
                    <Td numerico className="text-peligro" etiqueta="Actual">
                      {cantidad(p.stock_actual)}
                    </Td>
                    <Td numerico className="text-secundario" etiqueta="Mínimo">
                      {cantidad(p.stock_minimo)}
                    </Td>
                    <Td numerico etiqueta="Faltante">{cantidad(p.faltante)}</Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado
              titulo="Comisiones pendientes"
              descripcion={`${guaranies(kpis.comisiones_pendientes)} en total`}
            />
            <Tabla titulo="Comisiones pendientes por barbero">
              <TablaEncabezado>
                <Th>Barbero</Th>
                <Th numerico>Servicios</Th>
                <Th numerico>Total</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {comisiones.map((c) => (
                  <Tr key={c.id_profesional}>
                    <Td className="font-medium" etiqueta="Barbero">{c.nombre_profesional}</Td>
                    <Td numerico etiqueta="Servicios">{c.cantidad_servicios}</Td>
                    <Td numerico etiqueta="Total">{guaranies(c.total_comision)}</Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          </Tarjeta>
        </div>
      </div>

      <Tarjeta className="mt-6">
        <TarjetaEncabezado
          titulo="Generar reporte"
          descripcion="Clientes, proveedores, cobros, inventario, comisiones o el general de KPIs mensuales"
        />

        <BarraFiltros>
          <SelectorFiltro
            nombre="tipo"
            etiqueta="Tipo de reporte"
            textoTodos={TITULOS_TIPO_REPORTE.general}
            opciones={OPCIONES_TIPO}
          />
          <CampoBusqueda placeholder="Buscar dentro del reporte" />
          <RangoFechas etiqueta="Rango de fechas" />
        </BarraFiltros>

        <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2 pb-4">
          <p className="text-cuerpo-sm text-terciario">
            {previsualizacion.titulo}
            {previsualizacion.filas.length >= 50 && ' · vista previa limitada a 50 filas'}
          </p>
          <div className="flex gap-2">
            <Link href={`/panel/reportes/exportar?${queryExportar.toString()}&formato=excel`}>
              <Boton variante="secundario" icono="download">
                Excel
              </Boton>
            </Link>
            <Link href={`/panel/reportes/exportar?${queryExportar.toString()}&formato=pdf`}>
              <Boton variante="secundario" icono="download">
                PDF
              </Boton>
            </Link>
          </div>
        </div>

        <Tabla titulo={previsualizacion.titulo}>
          <TablaEncabezado>
            {previsualizacion.columnas.map((c) => (
              <Th key={c.clave} numerico={c.numerico}>
                {c.titulo}
              </Th>
            ))}
          </TablaEncabezado>
          <TablaCuerpo>
            {previsualizacion.filas.length === 0 ? (
              <TdCompleta colSpan={Math.max(1, previsualizacion.columnas.length)}>
                <EstadoVacio
                  icono="chart-column"
                  titulo="Sin datos para exportar"
                  descripcion="Ningún registro coincide con los filtros elegidos, o esta pantalla está en modo demostración."
                />
              </TdCompleta>
            ) : (
              previsualizacion.filas.map((fila, i) => (
                <Tr key={i}>
                  {previsualizacion.columnas.map((c) => (
                    <Td key={c.clave} numerico={c.numerico} etiqueta={c.titulo}>
                      {fila[c.clave]}
                    </Td>
                  ))}
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>
    </>
  );
}
