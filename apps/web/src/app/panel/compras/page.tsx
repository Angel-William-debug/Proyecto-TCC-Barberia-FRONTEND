import { listarPedidos, listarProductosConNivel, listarProveedores } from '@barber-shop/api';
import { ESTADOS_PEDIDO } from '@barber-shop/tipos';
import {
  BarraFiltros,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  PRESENTACION_PEDIDO,
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
  fechaCorta,
  guaranies,
  plural,
  identificador,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { FormularioOrden } from '@/componentes/formularios/formulario-orden';
import { FormularioProveedor } from '@/componentes/formularios/formulario-proveedor';
import { comunes, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Compras' };

const OPCIONES_ESTADO = ESTADOS_PEDIDO.map((e) => ({
  valor: e,
  etiqueta: PRESENTACION_PEDIDO[e].etiqueta,
}));
const ETIQUETAS_ESTADO = Object.fromEntries(
  ESTADOS_PEDIDO.map((e) => [e, PRESENTACION_PEDIDO[e].etiqueta]),
);

/**
 * Módulo 6 — Órdenes de compra y proveedores.
 *
 * Dos tablas en una vista: los parámetros de la segunda llevan el prefijo
 * `prov_`, según la convención de la sección 9.9 del sistema de diseño.
 *
 * Solo se puede pagar una orden ya recibida (RN-028), regla que hace cumplir
 * un disparador de la base, no esta pantalla.
 */
export default async function PaginaCompras({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const base = comunes(params);

  const [pedidos, proveedoresTodos, proveedores, productos] = await Promise.all([
    listarPedidos({ ...base, proveedor: texto(params, 'proveedor') }),
    listarProveedores(),
    listarProveedores({ busqueda: texto(params, 'prov_q') }),
    listarProductosConNivel({}),
  ]);

  // Fecha del servidor, no del navegador: el formulario la propone como
  // predeterminada y la barberia opera en una sola zona horaria.
  const hoy = new Date().toISOString().slice(0, 10);

  const enCurso = pedidos.filter((p) => p.estado === 'pedido' || p.estado === 'recibido');
  const comprometido = enCurso.reduce((suma, p) => suma + p.total, 0);

  return (
    <>
      <EncabezadoVista
        titulo="Compras"
        descripcion={`${plural(enCurso.length, 'orden en curso', 'órdenes en curso')} · ${guaranies(
          comprometido,
        )} comprometidos`}
        accion={
          <FormularioOrden
            proveedores={proveedoresTodos}
            productos={productos.map((p) => ({
              id_producto: p.id_producto,
              nombre: p.nombre,
              precio_unitario: p.precio_unitario,
            }))}
            fechaHoy={hoy}
          />
        }
      />

      <Tarjeta className="mb-6">
        <TarjetaEncabezado titulo="Órdenes de compra" />

        <BarraFiltros>
          <CampoBusqueda placeholder="Nombre del proveedor" />
          <SelectorFiltro
            nombre="proveedor"
            etiqueta="Proveedor"
            textoTodos="Todos los proveedores"
            opciones={proveedoresTodos.map((p) => ({ valor: p.nombre, etiqueta: p.nombre }))}
          />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ESTADO} />
          <RangoFechas etiqueta="Fecha del pedido" />
        </BarraFiltros>

        <FiltrosActivos
          total={pedidos.length}
          sustantivo={['orden', 'órdenes']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            proveedor: { titulo: 'Proveedor' },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ESTADO },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo="Órdenes de compra a proveedores">
          <TablaEncabezado>
            <Th>Orden</Th>
            <Th>Proveedor</Th>
            <Th>Fecha del pedido</Th>
            <Th>Recepción</Th>
            <Th numerico>Ítems</Th>
            <Th numerico>Total</Th>
            <Th>Estado</Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {pedidos.length === 0 ? (
              <TdCompleta colSpan={7}>
                <EstadoVacio
                  icono="clipboard-list"
                  titulo="No se encontraron órdenes"
                  descripcion="Ninguna orden cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              pedidos.map((p) => (
                <Tr key={p.id_pedido} interactiva>
                  <Td className="font-mono" etiqueta="Orden">{identificador(p.id_pedido)}</Td>
                  <Td className="font-medium" etiqueta="Proveedor">{p.nombre_proveedor}</Td>
                  <Td className="text-secundario" etiqueta="Fecha del pedido">{fechaCorta(p.fecha_pedido)}</Td>
                  <Td className="text-secundario" etiqueta="Recepción">
                    {p.fecha_recepcion ? fechaCorta(p.fecha_recepcion) : '—'}
                  </Td>
                  <Td numerico etiqueta="Ítems">{p.cantidad_items}</Td>
                  <Td numerico etiqueta="Total">{guaranies(p.total)}</Td>
                  <Td etiqueta="Estado">
                    <ChipEstado presentacion={PRESENTACION_PEDIDO[p.estado]} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>

      <Tarjeta>
        <TarjetaEncabezado
          titulo="Proveedores"
          accion={<FormularioProveedor />}
        />

        <BarraFiltros>
          <CampoBusqueda nombre="prov_q" placeholder="Nombre, correo o teléfono" />
        </BarraFiltros>

        <FiltrosActivos
          total={proveedores.length}
          sustantivo={['proveedor', 'proveedores']}
          etiquetas={{ prov_q: { titulo: 'Búsqueda' } }}
        />

        <Tabla titulo="Proveedores registrados">
          <TablaEncabezado>
            <Th>Proveedor</Th>
            <Th>Teléfono</Th>
            <Th>Correo</Th>
            <Th>Dirección</Th>
            <Th><span className="solo-lectores">Acciones</span></Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {proveedores.length === 0 ? (
              <TdCompleta colSpan={5}>
                <EstadoVacio
                  icono="truck"
                  titulo="No se encontraron proveedores"
                  descripcion="Ningún proveedor cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              proveedores.map((p) => (
                <Tr key={p.id_proveedor} interactiva>
                  <Td className="font-medium" etiqueta="Proveedor">{p.nombre}</Td>
                  <Td className="font-mono" etiqueta="Teléfono">{p.telefono ?? '—'}</Td>
                  <Td className="text-secundario" etiqueta="Correo">{p.email ?? '—'}</Td>
                  <Td className="text-secundario" etiqueta="Dirección">{p.direccion ?? '—'}</Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <FormularioProveedor proveedor={p} />
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
