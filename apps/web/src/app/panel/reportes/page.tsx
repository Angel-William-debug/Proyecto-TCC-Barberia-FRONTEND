import {
  comisionesPendientes,
  ingresosPorPeriodo,
  resumenKpis,
  stockCritico,
} from '@barber-shop/api';
import {
  Boton,
  Indicador,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaEncabezado,
  Td,
  Th,
  Tr,
  cantidad,
  guaranies,
  porcentaje,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';

export const metadata = { title: 'Reportes' };

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/**
 * Módulo 7 — Reportes.
 *
 * Los agregados los calcula la base: `fn_generar_resumen_kpis` y las vistas
 * SQL. Traer miles de filas al servidor para sumarlas aquí sería más lento y
 * daría resultados distintos según quién consulte.
 */
export default async function PaginaReportes() {
  const hoy = new Date();
  const desde = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
  const hasta = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-28`;

  const [kpis, ingresos, criticos, comisiones] = await Promise.all([
    resumenKpis(desde, hasta),
    ingresosPorPeriodo(),
    stockCritico(),
    comisionesPendientes(),
  ]);

  const mayorIngreso = Math.max(...ingresos.map((i) => i.total_ingresos), 1);

  return (
    <>
      <EncabezadoVista
        titulo="Reportes"
        descripcion="Indicadores del período en curso"
        accion={
          <Boton variante="secundario" icono="download">
            Exportar
          </Boton>
        }
      />

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
                {/* Barra simple con un div: para cuatro series no hace falta
                    una biblioteca de gráficos completa. */}
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
    </>
  );
}
