import { listarMovimientos, listarProductosConNivel } from '@barber-shop/api';
import { NIVELES_STOCK, TIPOS_MOVIMIENTO } from '@barber-shop/tipos';
import {
  BarraFiltros,
  Boton,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  Icono,
  PRESENTACION_STOCK,
  RangoFechas,
  SelectorMultiple,
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
  fechaHora,
  guaranies,
  plural,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';
import { comunes, fecha, lista, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Inventario' };

const OPCIONES_NIVEL = NIVELES_STOCK.map((n) => ({
  valor: n,
  etiqueta: PRESENTACION_STOCK[n].etiqueta,
}));
const ETIQUETAS_NIVEL = Object.fromEntries(
  NIVELES_STOCK.map((n) => [n, PRESENTACION_STOCK[n].etiqueta]),
);

const ETIQUETA_TIPO: Record<string, string> = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
};
const OPCIONES_TIPO = TIPOS_MOVIMIENTO.map((t) => ({
  valor: t,
  etiqueta: ETIQUETA_TIPO[t]!,
}));

/**
 * Módulo 6 — Inventario.
 *
 * Esta pantalla tiene DOS tablas, y cada una filtra por su cuenta. Para que
 * los parámetros no se pisen, los de la segunda llevan el prefijo `mov_`.
 * Es la convención del sistema cuando una vista muestra más de una tabla.
 *
 * El stock puede ser negativo: la restricción `CHECK stock_actual >= 0` se
 * eliminó para habilitar el flujo CU-007 A1, que permite completar un servicio
 * con stock insuficiente previa confirmación. La columna lo muestra tal cual,
 * sin recortar a cero.
 */
export default async function PaginaInventario({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const base = comunes(params);

  const [productos, movimientos] = await Promise.all([
    listarProductosConNivel({ busqueda: base.busqueda, niveles: lista(params, 'nivel') }),
    listarMovimientos({
      tipos: lista(params, 'mov_tipo'),
      desde: fecha(params, 'mov_desde'),
      hasta: fecha(params, 'mov_hasta'),
    }),
  ]);

  const criticos = productos.filter(
    (p) => p.nivel === 'sin_stock' || p.nivel === 'critico',
  ).length;
  const valorizado = productos.reduce(
    (suma, p) => suma + Math.max(0, p.stock_actual) * p.precio_unitario,
    0,
  );

  const iconoMovimiento = {
    entrada: 'trending-up',
    salida: 'trending-down',
    ajuste: 'arrow-left-right',
  } as const;

  return (
    <>
      <EncabezadoVista
        titulo="Inventario"
        descripcion={`${plural(productos.length, 'producto', 'productos')} en el catálogo`}
        accion={
          <Boton variante="primario" icono="plus">
            Registrar movimiento
          </Boton>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ['Productos', String(productos.length)],
          ['En nivel crítico', String(criticos)],
          ['Valorización', guaranies(valorizado)],
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

      {criticos > 0 && (
        <div
          role="status"
          className="border-peligro text-peligro text-cuerpo-sm mb-6 flex items-start gap-2 rounded-md border bg-[var(--chip-peligro-fondo)] p-3"
        >
          <Icono nombre="triangle-alert" tamano="sm" className="mt-0.5" />
          <span>
            {criticos} producto{criticos === 1 ? '' : 's'} en nivel crítico o sin stock. Conviene
            generar una orden de compra antes de que falte durante un servicio.
          </span>
        </div>
      )}

      <Tarjeta className="mb-6">
        <TarjetaEncabezado titulo="Productos" descripcion="Stock actual y nivel calculado" />

        <BarraFiltros>
          <CampoBusqueda placeholder="Nombre del producto" />
          <SelectorMultiple nombre="nivel" etiqueta="Nivel de stock" opciones={OPCIONES_NIVEL} />
        </BarraFiltros>

        <FiltrosActivos
          total={productos.length}
          sustantivo={['producto', 'productos']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            nivel: { titulo: 'Nivel', valores: ETIQUETAS_NIVEL },
          }}
        />

        <Tabla titulo="Productos del inventario con su nivel de stock">
          <TablaEncabezado>
            <Th>Producto</Th>
            <Th numerico>Stock actual</Th>
            <Th numerico>Mínimo</Th>
            <Th numerico>Precio unitario</Th>
            <Th>Nivel</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {productos.length === 0 ? (
              <TdCompleta colSpan={5}>
                <EstadoVacio
                  icono="package"
                  titulo="No se encontraron productos"
                  descripcion="Ningún producto cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              productos.map((p) => (
                <Tr key={p.id_producto} interactiva>
                  <Td className="font-medium" etiqueta="Producto">{p.nombre}</Td>
                  <Td numerico className={p.stock_actual <= 0 ? 'text-peligro font-medium' : ''} etiqueta="Stock actual">
                    {cantidad(p.stock_actual)}
                  </Td>
                  <Td numerico className="text-secundario" etiqueta="Mínimo">
                    {cantidad(p.stock_minimo)}
                  </Td>
                  <Td numerico etiqueta="Precio unitario">{guaranies(p.precio_unitario)}</Td>
                  <Td etiqueta="Nivel">
                    <ChipEstado presentacion={PRESENTACION_STOCK[p.nivel]} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado
          titulo="Movimientos"
          descripcion="Entradas por compra, salidas por consumo y ajustes manuales"
        />

        <BarraFiltros>
          <SelectorMultiple nombre="mov_tipo" etiqueta="Tipo" opciones={OPCIONES_TIPO} />
          <RangoFechas etiqueta="Fecha" nombreDesde="mov_desde" nombreHasta="mov_hasta" />
        </BarraFiltros>

        <FiltrosActivos
          total={movimientos.length}
          sustantivo={['movimiento', 'movimientos']}
          etiquetas={{
            mov_tipo: { titulo: 'Tipo', valores: ETIQUETA_TIPO },
            mov_desde: { titulo: 'Desde' },
            mov_hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Movimientos de inventario recientes">
          <TablaEncabezado>
            <Th>Fecha</Th>
            <Th>Producto</Th>
            <Th>Tipo</Th>
            <Th numerico>Cantidad</Th>
            <Th>Motivo</Th>
            <Th>Usuario</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {movimientos.length === 0 ? (
              <TdCompleta colSpan={6}>
                <EstadoVacio
                  icono="arrow-left-right"
                  titulo="No se encontraron movimientos"
                  descripcion="Ningún movimiento cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              movimientos.map((m) => (
                <Tr key={m.id_movimiento}>
                  <Td className="text-secundario" etiqueta="Fecha">{fechaHora(m.fecha)}</Td>
                  <Td className="font-medium" etiqueta="Producto">{m.nombre_producto}</Td>
                  <Td etiqueta="Tipo">
                    <span className="text-cuerpo-sm text-secundario inline-flex items-center gap-1.5">
                      <Icono nombre={iconoMovimiento[m.tipo]} tamano="xs" />
                      {ETIQUETA_TIPO[m.tipo]}
                    </span>
                  </Td>
                  <Td numerico etiqueta="Cantidad">{cantidad(m.cantidad)}</Td>
                  <Td className="text-secundario" etiqueta="Motivo">{m.motivo ?? '—'}</Td>
                  <Td className="text-secundario" etiqueta="Usuario">{m.nombre_usuario ?? '—'}</Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>
    </>
  );
}
