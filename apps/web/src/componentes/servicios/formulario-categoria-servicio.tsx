'use client';

import { useState } from 'react';

import type { CategoriaServicio } from '@barber-shop/tipos';
import { Boton, BotonIcono, Campo, CampoArea, GrupoCampos } from '@barber-shop/ui';

import { guardarCategoriaServicio } from '@/acciones/servicios';
import { PanelFormulario } from '@/componentes/compartido/panel-formulario';

/** CU-003 — alta y edición de una categoría de servicio, desde Servicios (vistas 28 y 29). */
export function FormularioCategoriaServicio({ categoria }: { categoria?: CategoriaServicio }) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(categoria);

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar ${categoria!.nombre}`}
          variante="secundario"
          tamano="sm"
          onClick={() => setAbierto(true)}
        />
      ) : (
        <Boton variante="secundario" icono="tag" tamano="sm" onClick={() => setAbierto(true)}>
          Nueva categoría
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        ancho="sm"
        titulo={editando ? 'Editar categoría de servicio' : 'Nueva categoría de servicio'}
        accion={guardarCategoriaServicio}
        textoGuardar={editando ? 'Guardar cambios' : 'Crear categoría'}
      >
        {(errores) => (
          <GrupoCampos titulo="Identificación">
            {editando && <input type="hidden" name="id_categoria" value={categoria!.id_categoria} />}
            <Campo
              etiqueta="Nombre"
              name="nombre"
              defaultValue={categoria?.nombre}
              placeholder="Cortes"
              error={errores.nombre}
              required
            />
            <CampoArea etiqueta="Descripción" name="descripcion" defaultValue={categoria?.descripcion ?? ''} />
          </GrupoCampos>
        )}
      </PanelFormulario>
    </>
  );
}
