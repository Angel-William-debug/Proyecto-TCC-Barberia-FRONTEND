'use client';

import { useState } from 'react';

import type { CategoriaServicio, Servicio } from '@barber-shop/tipos';
import {
  Boton, BotonIcono, Campo, CampoArea, CampoSelector, FilaCampos, GrupoCampos, Interruptor,
} from '@barber-shop/ui';

import { guardarServicio } from '@/acciones/entidades';
import { PanelFormulario } from './panel-formulario';

/** CU-003 — alta y edicion del catalogo de servicios. */
export function FormularioServicio({
  servicio,
  categorias,
}: {
  servicio?: Servicio;
  categorias: CategoriaServicio[];
}) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(servicio);

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar ${servicio!.nombre}`}
          variante="terciario"
          tamano="sm"
          onClick={() => setAbierto(true)}
        />
      ) : (
        <Boton variante="primario" icono="plus" onClick={() => setAbierto(true)}>
          Nuevo servicio
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? 'Editar servicio' : 'Nuevo servicio'}
        descripcion="La duración define cuánto ocupa el turno en la agenda."
        accion={guardarServicio}
        textoGuardar={editando ? 'Guardar cambios' : 'Crear servicio'}
      >
        {(errores) => (
          <>
            {editando && <input type="hidden" name="id_servicio" value={servicio!.id_servicio} />}

            <GrupoCampos titulo="Identificación">
              <Campo
                etiqueta="Nombre del servicio"
                name="nombre"
                defaultValue={servicio?.nombre}
                placeholder="Corte clásico"
                error={errores.nombre}
                required
              />
              <CampoSelector
                etiqueta="Categoría"
                name="id_categoria"
                defaultValue={servicio?.id_categoria ?? ''}
                opciones={categorias.map((c) => ({ valor: c.id_categoria, etiqueta: c.nombre }))}
                marcador="Elija una categoría"
                error={errores.id_categoria}
                required
              />
              <CampoArea
                etiqueta="Descripción"
                name="descripcion"
                defaultValue={servicio?.descripcion ?? ''}
                placeholder="Corte a tijera y máquina, con lavado"
              />
            </GrupoCampos>

            <GrupoCampos titulo="Duración y precio">
              <FilaCampos>
                <Campo
                  etiqueta="Duración"
                  name="duracion_min"
                  type="number"
                  min={1}
                  defaultValue={servicio?.duracion_min ?? ''}
                  sufijo="min"
                  error={errores.duracion_min}
                  required
                />
                <Campo
                  etiqueta="Precio base"
                  name="precio_base"
                  inputMode="numeric"
                  defaultValue={servicio?.precio_base ?? ''}
                  sufijo="Gs."
                  error={errores.precio_base}
                  required
                />
              </FilaCampos>
              <Interruptor
                name="estado"
                etiqueta="Servicio activo"
                descripcion="Uno inactivo no se ofrece al agendar, pero sigue en el historial."
                defaultChecked={servicio ? servicio.estado : true}
              />
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
