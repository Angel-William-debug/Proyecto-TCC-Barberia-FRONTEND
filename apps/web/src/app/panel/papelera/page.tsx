import { exigirSesion, listarBorrados } from '@barber-shop/api';
import type { TablaEscribible } from '@barber-shop/api';
import {
  BarraFiltros,
  CampoBusqueda,
  EstadoVacio,
  FiltrosActivos,
  Paginacion,
  RangoFechas,
  SelectorFiltro,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  Td,
  TdCompleta,
  Th,
  Tr,
  fechaHora,
  plural,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { BotonRestaurar } from '@/componentes/compartido/boton-restaurar';
import { comunes, paginarFilas, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Papelera' };

/** Las once tablas escribibles admiten borrado lógico salvo estas tres, que no tienen lista propia. */
const TABLAS_PAPELERA = [
  'clientes',
  'servicios',
  'profesionales',
  'productos',
  'proveedores',
  'categorias_servicio',
  'categorias_producto',
  'metodos_pago',
] as const satisfies readonly TablaEscribible[];

const ETIQUETA_TABLA: Record<(typeof TABLAS_PAPELERA)[number], string> = {
  clientes: 'Clientes',
  servicios: 'Servicios',
  profesionales: 'Barberos',
  productos: 'Productos',
  proveedores: 'Proveedores',
  categorias_servicio: 'Categorías de servicio',
  categorias_producto: 'Categorías de producto',
  metodos_pago: 'Métodos de pago',
};

type TablaPapelera = (typeof TABLAS_PAPELERA)[number];

/**
 * Lo que cada rol puede restaurar.
 *
 * Restaurar es escribir, y la recepcionista solo escribe clientes y
 * productos (RLS): los demas catalogos los modifica el administrador. Antes
 * veia los nueve y en la mayoria el boton fallaba o no hacia nada.
 *
 * «Usuarios» salio de la lista el 18/11/2026: ninguna pantalla borra un
 * usuario -se lo desactiva, para conservar su historial-, asi que ese
 * catalogo estaba siempre vacio.
 */
const TABLAS_RECEPCION: readonly TablaPapelera[] = ['clientes', 'productos'];

function tablasPara(esAdministrador: boolean): readonly TablaPapelera[] {
  return esAdministrador ? TABLAS_PAPELERA : TABLAS_RECEPCION;
}

/**
 * Papelera: lo que se borró lógicamente y todavía se puede restaurar.
 *
 * `borrarLogico()` y `restaurar()` existen en `apps/api` desde antes de esta
 * sesión, pero ninguna pantalla los llamaba: se podía dar de alta y editar
 * todo, pero no borrar. Esta pantalla y el botón de borrar en cada catálogo
 * cierran ese ciclo.
 */
export default async function PaginaPapelera({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const usuario = await exigirSesion();
  const permitidas = tablasPara(usuario.rol === 'administrador');
  const opciones = permitidas.map((t) => ({ valor: t, etiqueta: ETIQUETA_TABLA[t] }));

  const tablaParametro = texto(params, 'tabla') ?? '';
  const tabla = permitidas.find((t) => t === tablaParametro) ?? 'clientes';

  const { busqueda, desde, hasta } = comunes(params);
  const registros = await listarBorrados(tabla, { busqueda, desde, hasta });

  const pagRegistros = paginarFilas(registros, params);

  return (
    <>
      <EncabezadoVista
        titulo="Papelera"
        descripcion="Registros borrados, uno por catálogo. Se pueden restaurar salvo que su valor único ya lo tenga otro."
      />

      <Tarjeta>
        <BarraFiltros
          fijos={<SelectorFiltro nombre="tabla" etiqueta="Catálogo" opciones={opciones} textoTodos="Clientes" />}
          busqueda={<CampoBusqueda placeholder="Nombre" />}
          fecha={<RangoFechas etiqueta="Fecha de borrado" />}
        />

        <FiltrosActivos
          total={registros.length}
          sustantivo={['registro', 'registros']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla titulo={`Registros borrados de ${ETIQUETA_TABLA[tabla]}`}>
          <TablaEncabezado>
            <Th>Nombre</Th>
            <Th>Borrado el</Th>
            <Th>
              <span className="solo-lectores">Acciones</span>
            </Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {registros.length === 0 ? (
              <TdCompleta colSpan={3}>
                <EstadoVacio
                  icono="trash-2"
                  titulo="La papelera está vacía"
                  descripcion={`No hay registros borrados en ${ETIQUETA_TABLA[tabla]}.`}
                />
              </TdCompleta>
            ) : (
              pagRegistros.filas.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-medium" etiqueta="Nombre">
                    {r.nombre}
                  </Td>
                  <Td className="text-secundario" etiqueta="Borrado el">
                    {r.deletedAt ? fechaHora(r.deletedAt) : '—'}
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <BotonRestaurar tabla={tabla} id={r.id} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
        <Paginacion {...pagRegistros.paginacion} />

        <p className="text-cuerpo-sm text-terciario mt-4 px-1">
          {plural(registros.length, 'registro borrado', 'registros borrados')} en este catálogo.
        </p>
      </Tarjeta>
    </>
  );
}
