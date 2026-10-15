import { listarCategoriasServicio, listarProductosConNivel, listarServicios } from '@barber-shop/api';
import {
  BarraFiltros,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  Paginacion,
  RangoFechas,
  SelectorFiltro,
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
  duracion,
  guaranies,
  plural,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { BotonBorrar } from '@/componentes/compartido/boton-borrar';
import { BotonExportar } from '@/componentes/compartido/boton-exportar';
import { FormularioServicio } from '@/componentes/servicios/formulario-servicio';
import { FormularioCategoriaServicio } from '@/componentes/servicios/formulario-categoria-servicio';
import { PanelDetalleServicio } from '@/componentes/servicios/panel-detalle-servicio';
import { PanelReceta } from '@/componentes/servicios/panel-receta';
import {
  ETIQUETAS_ACTIVO,
  OPCIONES_ACTIVO,
  comunes,
  paginarFilas,
  texto,
  type Parametros,
} from '@/lib/filtros';

export const metadata = { title: 'Servicios' };

/** CU-003 — Catálogo de servicios. */
export default async function PaginaServicios({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const filtro = { ...comunes(params), categoria: texto(params, 'categoria') };

  const [servicios, categorias, productos] = await Promise.all([
    listarServicios(filtro),
    listarCategoriasServicio().catch(() => []),
    listarProductosConNivel().catch(() => []),
  ]);

  const nombreCategoria = new Map(categorias.map((c) => [c.id_categoria, c.nombre]));
  const productosActivos = productos
    .filter((p) => p.estado)
    .map((p) => ({ id_producto: p.id_producto, nombre: p.nombre }));

  const pagServicios = paginarFilas(servicios, params);
  const serviciosPorCategoria = new Map<number, number>();
  for (const s of servicios) {
    serviciosPorCategoria.set(s.id_categoria, (serviciosPorCategoria.get(s.id_categoria) ?? 0) + 1);
  }

  return (
    <>
      <EncabezadoVista
        titulo="Servicios"
        descripcion={`${plural(servicios.length, 'servicio', 'servicios')} en el catálogo`}
        accion={<FormularioServicio categorias={categorias} />}
      />

      <Tarjeta>
        <BarraFiltros
          busqueda={<CampoBusqueda placeholder="Nombre o descripción" />}
          fecha={<RangoFechas etiqueta="Fecha de alta" />}
          avanzados={
            <>
              <SelectorFiltro
                nombre="categoria"
                etiqueta="Categoría"
                textoTodos="Todas las categorías"
                opciones={categorias.map((c) => ({
                  valor: String(c.id_categoria),
                  etiqueta: c.nombre,
                }))}
              />
              <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ACTIVO} />
            </>
          }
          parametrosAvanzados={['categoria', 'estado']}
          acciones={<BotonExportar tipo="servicios" searchParams={params} />}
        />

        <FiltrosActivos
          total={servicios.length}
          sustantivo={['servicio', 'servicios']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            categoria: {
              titulo: 'Categoría',
              valores: Object.fromEntries(
                categorias.map((c) => [String(c.id_categoria), c.nombre]),
              ),
            },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ACTIVO },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Catálogo de servicios de la barbería">
          <TablaEncabezado>
            <Th>Servicio</Th>
            <Th>Categoría</Th>
            <Th>Duración</Th>
            <Th numerico>Precio base</Th>
            <Th>Estado</Th>
            <Th><span className="solo-lectores">Acciones</span></Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {servicios.length === 0 ? (
              <TdCompleta colSpan={6}>
                <EstadoVacio
                  icono="sparkles"
                  titulo="No se encontraron servicios"
                  descripcion="Ningún servicio cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              pagServicios.filas.map((s) => (
                <Tr key={s.id_servicio} interactiva>
                  <Td className="font-medium" etiqueta="Servicio">
                    {s.nombre}
                    {s.descripcion && (
                      <span className="text-cuerpo-sm text-terciario block font-normal">
                        {s.descripcion}
                      </span>
                    )}
                  </Td>
                  <Td className="text-secundario" etiqueta="Categoría">
                    {nombreCategoria.get(s.id_categoria) ?? `Categoría ${s.id_categoria}`}
                  </Td>
                  <Td className="text-secundario" etiqueta="Duración">{duracion(s.duracion_min)}</Td>
                  <Td numerico etiqueta="Precio base">{guaranies(s.precio_base)}</Td>
                  <Td etiqueta="Estado">
                    <ChipEstado
                      presentacion={
                        s.estado
                          ? { etiqueta: 'Activo', tono: 'exito', icono: 'circle-check' }
                          : { etiqueta: 'Inactivo', tono: 'neutro', icono: 'ban' }
                      }
                    />
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <div className="flex justify-end gap-1">
                      <PanelDetalleServicio
                        servicio={s}
                        categoria={nombreCategoria.get(s.id_categoria) ?? null}
                      />
                      <PanelReceta
                        idServicio={s.id_servicio}
                        nombreServicio={s.nombre}
                        productos={productosActivos}
                      />
                      <FormularioServicio servicio={s} categorias={categorias} />
                      <BotonBorrar tabla="servicios" id={s.id_servicio} nombre={s.nombre} />
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
        <Paginacion {...pagServicios.paginacion} />
      </Tarjeta>

      {/* Vistas 28 y 29: antes las categorías solo se cargaban desde la base. */}
      <Tarjeta className="mt-6">
        <TarjetaEncabezado
          titulo="Categorías de servicio"
          descripcion="Agrupan el catálogo en la reserva y en los reportes"
          accion={<FormularioCategoriaServicio />}
        />
        <Tabla titulo="Categorías de servicio">
          <TablaEncabezado>
            <Th>Categoría</Th>
            <Th>Descripción</Th>
            <Th numerico>Servicios</Th>
            <Th><span className="solo-lectores">Acciones</span></Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {categorias.length === 0 ? (
              <TdCompleta colSpan={4}>
                <EstadoVacio
                  icono="tag"
                  titulo="Sin categorías"
                  descripcion="Cree la primera para poder cargar servicios."
                />
              </TdCompleta>
            ) : (
              categorias.map((c) => (
                <Tr key={c.id_categoria}>
                  <Td className="font-medium" etiqueta="Categoría">{c.nombre}</Td>
                  <Td className="text-secundario" etiqueta="Descripción">{c.descripcion ?? '—'}</Td>
                  <Td numerico etiqueta="Servicios">{serviciosPorCategoria.get(c.id_categoria) ?? 0}</Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <div className="flex justify-end gap-1">
                      <FormularioCategoriaServicio categoria={c} />
                      <BotonBorrar tabla="categorias_servicio" id={c.id_categoria} nombre={c.nombre} />
                    </div>
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
