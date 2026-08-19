import Link from 'next/link';

import { listarClientes } from '@barber-shop/api';
import {
  BarraFiltros,
  Boton,
  BotonIcono,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  RangoFechas,
  SelectorMultiple,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  Td,
  TdCompleta,
  Th,
  Tr,
  fechaCorta,
  plural,
  telefono as formatoTelefono,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { BotonBorrar } from '@/componentes/formularios/boton-borrar';
import { FormularioCliente } from '@/componentes/formularios/formulario-cliente';
import {
  ETIQUETAS_ACTIVO,
  OPCIONES_ACTIVO,
  comunes,
  pagina as leerPagina,
  type Parametros,
} from '@/lib/filtros';

export const metadata = { title: 'Clientes' };

/**
 * CU-002 — Gestion de clientes. Vista de listado.
 *
 * Es un componente de servidor: la consulta corre en el servidor, con la
 * sesion del usuario, y al navegador solo llega el HTML. Eso evita exponer la
 * forma de la consulta y elimina el parpadeo de carga en la primera visita.
 */
export default async function PaginaClientes({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const filtro = { ...comunes(params), pagina: leerPagina(params) };

  const resultado = await listarClientes(filtro);

  return (
    <>
      <EncabezadoVista
        titulo="Clientes"
        descripcion={plural(resultado.total, 'cliente', 'clientes')}
        accion={<FormularioCliente />}
      />

      <Tarjeta>
        <BarraFiltros>
          <CampoBusqueda placeholder="Nombre, teléfono o correo" />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ACTIVO} />
          <RangoFechas etiqueta="Fecha de registro" />
        </BarraFiltros>

        <FiltrosActivos
          total={resultado.total}
          sustantivo={['cliente', 'clientes']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ACTIVO },
            desde: { titulo: 'Desde' },
            hasta: { titulo: 'Hasta' },
          }}
        />

        <Tabla
          titulo={`Listado de clientes, página ${resultado.pagina} de ${resultado.totalPaginas}`}
        >
          <TablaEncabezado>
            <Th>Nombre</Th>
            <Th>Teléfono</Th>
            <Th>Correo</Th>
            <Th>Registrado</Th>
            <Th>Estado</Th>
            <Th><span className="solo-lectores">Acciones</span></Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {resultado.datos.length === 0 ? (
              <TdCompleta colSpan={6}>
                <EstadoVacio
                  icono="user-round"
                  titulo="No se encontraron coincidencias"
                  descripcion="Ningún cliente cumple con los filtros aplicados. Pruebe quitando alguno."
                />
              </TdCompleta>
            ) : (
              resultado.datos.map((c) => (
                <Tr key={c.id_cliente} interactiva>
                  <Td className="font-medium" etiqueta="Nombre">{c.nombre}</Td>
                  <Td className="font-mono" etiqueta="Teléfono">{formatoTelefono(c.telefono)}</Td>
                  <Td className="text-secundario" etiqueta="Correo">{c.email ?? '—'}</Td>
                  <Td className="text-secundario" etiqueta="Registrado">{fechaCorta(c.fecha_registro)}</Td>
                  <Td etiqueta="Estado">
                    <ChipEstado
                      presentacion={
                        c.estado
                          ? { etiqueta: 'Activo', tono: 'exito', icono: 'circle-check' }
                          : { etiqueta: 'Inactivo', tono: 'neutro', icono: 'ban' }
                      }
                    />
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/panel/clientes/${c.id_cliente}`}>
                        <BotonIcono
                          icono="chevron-right"
                          etiqueta={`Ver perfil de ${c.nombre}`}
                          variante="terciario"
                          tamano="sm"
                        />
                      </Link>
                      <FormularioCliente cliente={c} />
                      <BotonBorrar tabla="clientes" id={c.id_cliente} nombre={c.nombre} />
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>

        {resultado.totalPaginas > 1 && (
          <div className="border-borde-sutil flex items-center justify-between border-t px-4 py-3">
            <p className="text-cuerpo-sm text-terciario">
              Página {resultado.pagina} de {resultado.totalPaginas}
            </p>
            <div className="flex gap-2">
              <Boton
                variante="secundario"
                tamano="sm"
                icono="chevron-left"
                disabled={resultado.pagina <= 1}
              >
                Anterior
              </Boton>
              <Boton
                variante="secundario"
                tamano="sm"
                iconoDerecha="chevron-right"
                disabled={resultado.pagina >= resultado.totalPaginas}
              >
                Siguiente
              </Boton>
            </div>
          </div>
        )}
      </Tarjeta>
    </>
  );
}
