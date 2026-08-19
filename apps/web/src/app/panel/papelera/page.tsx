import { listarBorrados } from '@barber-shop/api';
import type { TablaEscribible } from '@barber-shop/api';
import {
  BarraFiltros,
  EstadoVacio,
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
import { BotonRestaurar } from '@/componentes/formularios/boton-restaurar';
import { texto, type Parametros } from '@/lib/filtros';

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
  'usuarios',
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
  usuarios: 'Usuarios',
};

const OPCIONES_TABLA = TABLAS_PAPELERA.map((t) => ({ valor: t, etiqueta: ETIQUETA_TABLA[t] }));

function esTablaPapelera(valor: string): valor is (typeof TABLAS_PAPELERA)[number] {
  return (TABLAS_PAPELERA as readonly string[]).includes(valor);
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
  const tablaParametro = texto(params, 'tabla') ?? '';
  const tabla = esTablaPapelera(tablaParametro) ? tablaParametro : 'clientes';

  const registros = await listarBorrados(tabla);

  return (
    <>
      <EncabezadoVista
        titulo="Papelera"
        descripcion="Registros borrados, uno por catálogo. Se pueden restaurar salvo que su valor único ya lo tenga otro."
      />

      <Tarjeta>
        <BarraFiltros>
          <SelectorFiltro nombre="tabla" etiqueta="Catálogo" opciones={OPCIONES_TABLA} textoTodos="Clientes" />
        </BarraFiltros>

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
              registros.map((r) => (
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

        <p className="text-cuerpo-sm text-terciario mt-4 px-1">
          {plural(registros.length, 'registro borrado', 'registros borrados')} en este catálogo.
        </p>
      </Tarjeta>
    </>
  );
}
