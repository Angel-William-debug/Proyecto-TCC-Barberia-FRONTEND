import { listarCategoriasServicio, listarServicios } from '@barber-shop/api';
import {
  BarraFiltros,
  Boton,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
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
  guaranies,
  plural,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';
import {
  ETIQUETAS_ACTIVO,
  OPCIONES_ACTIVO,
  comunes,
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

  const [servicios, categorias] = await Promise.all([
    listarServicios(filtro),
    listarCategoriasServicio().catch(() => []),
  ]);

  const nombreCategoria = new Map(categorias.map((c) => [c.id_categoria, c.nombre]));

  return (
    <>
      <EncabezadoVista
        titulo="Servicios"
        descripcion={`${plural(servicios.length, 'servicio', 'servicios')} en el catálogo`}
        accion={
          <Boton variante="primario" icono="plus">
            Nuevo servicio
          </Boton>
        }
      />

      <Tarjeta>
        <BarraFiltros>
          <CampoBusqueda placeholder="Nombre o descripción" />
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
        </BarraFiltros>

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
          }}
        />

        <Tabla titulo="Catálogo de servicios de la barbería">
          <TablaEncabezado>
            <Th>Servicio</Th>
            <Th>Categoría</Th>
            <Th>Duración</Th>
            <Th numerico>Precio base</Th>
            <Th>Estado</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {servicios.length === 0 ? (
              <TdCompleta colSpan={5}>
                <EstadoVacio
                  icono="sparkles"
                  titulo="No se encontraron servicios"
                  descripcion="Ningún servicio cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              servicios.map((s) => (
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
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>
    </>
  );
}
