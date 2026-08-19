import { listarProfesionales } from '@barber-shop/api';
import {
  BarraFiltros,
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
  iniciales,
  plural,
  porcentaje,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { BotonBorrar } from '@/componentes/formularios/boton-borrar';
import { FormularioBarbero } from '@/componentes/formularios/formulario-barbero';
import {
  ETIQUETAS_ACTIVO,
  OPCIONES_ACTIVO,
  comunes,
  texto,
  type Parametros,
} from '@/lib/filtros';

export const metadata = { title: 'Barberos' };

/** Tipos de contratación de `profesionales.tipo`. */
const TIPOS = [
  { valor: 'barbero', etiqueta: 'Barbero' },
  { valor: 'barbero senior', etiqueta: 'Barbero senior' },
  { valor: 'especialista', etiqueta: 'Especialista' },
  { valor: 'externo', etiqueta: 'Externo' },
];

/**
 * CU-004 — Gestión de profesionales.
 *
 * La tabla de la base se llama `profesionales` y así permanece: renombrarla
 * exigiría una migración sin beneficio funcional. Pero en pantalla el usuario
 * lee «Barbero», porque el rubro es barbería (sección 13.3 del diseño).
 */
export default async function PaginaBarberos({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const filtro = { ...comunes(params), tipo: texto(params, 'tipo') };

  const barberos = await listarProfesionales(filtro);

  return (
    <>
      <EncabezadoVista
        titulo="Barberos"
        descripcion={`${plural(
          barberos.filter((b) => b.estado).length,
          'barbero activo',
          'barberos activos',
        )}`}
        accion={<FormularioBarbero />}
      />

      <Tarjeta>
        <BarraFiltros>
          <CampoBusqueda placeholder="Nombre o especialidad" />
          <SelectorFiltro
            nombre="tipo"
            etiqueta="Tipo"
            textoTodos="Todos los tipos"
            opciones={TIPOS}
          />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ACTIVO} />
        </BarraFiltros>

        <FiltrosActivos
          total={barberos.length}
          sustantivo={['barbero', 'barberos']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            tipo: {
              titulo: 'Tipo',
              valores: Object.fromEntries(TIPOS.map((t) => [t.valor, t.etiqueta])),
            },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ACTIVO },
          }}
        />

        <Tabla titulo="Barberos registrados en el sistema">
          <TablaEncabezado>
            <Th>Barbero</Th>
            <Th>Especialidad</Th>
            <Th>Tipo</Th>
            <Th numerico>Comisión</Th>
            <Th>Estado</Th>
            <Th><span className="solo-lectores">Acciones</span></Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {barberos.length === 0 ? (
              <TdCompleta colSpan={6}>
                <EstadoVacio
                  icono="scissors"
                  titulo="No se encontraron barberos"
                  descripcion="Ningún barbero cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              barberos.map((b) => (
                <Tr key={b.id_profesional} interactiva>
                  <Td etiqueta="Barbero">
                    <span className="flex items-center gap-3">
                      <span
                        className="bg-elevado text-marca text-etiqueta flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold"
                        aria-hidden="true"
                      >
                        {iniciales(b.nombre)}
                      </span>
                      <span className="font-medium">{b.nombre}</span>
                    </span>
                  </Td>
                  <Td className="text-secundario" etiqueta="Especialidad">{b.especialidad ?? '—'}</Td>
                  <Td className="text-secundario" etiqueta="Tipo">{b.tipo ?? '—'}</Td>
                  <Td numerico etiqueta="Comisión">{porcentaje(b.porcentaje_com)}</Td>
                  <Td etiqueta="Estado">
                    <ChipEstado
                      presentacion={
                        b.estado
                          ? { etiqueta: 'Activo', tono: 'exito', icono: 'circle-check' }
                          : { etiqueta: 'Inactivo', tono: 'neutro', icono: 'ban' }
                      }
                    />
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <div className="flex justify-end gap-1">
                      <FormularioBarbero barbero={b} />
                      <BotonBorrar tabla="profesionales" id={b.id_profesional} nombre={b.nombre} />
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
