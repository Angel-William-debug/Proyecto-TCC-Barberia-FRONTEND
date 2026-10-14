'use client';

import { useState } from 'react';

import type { CategoriaProducto } from '@barber-shop/tipos';
import { Boton, BotonIcono, Campo, CampoArea, GrupoCampos } from '@barber-shop/ui';

import { guardarCategoriaProducto } from '@/acciones/inventario';
import { PanelFormulario } from '@/componentes/compartido/panel-formulario';

/** CU-010 — alta y edición de una categoría de producto, desde Inventario (vistas 61 y 62). */
export function FormularioCategoriaProducto({ categoria }: { categoria?: CategoriaProducto }) {
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
        titulo={editando ? 'Editar categoría de producto' : 'Nueva categoría de producto'}
        accion={guardarCategoriaProducto}
        textoGuardar={editando ? 'Guardar cambios' : 'Crear categoría'}
      >
        {(errores) => (
          <GrupoCampos titulo="Identificación">
            {editando && <input type="hidden" name="id_categoria_p" value={categoria!.id_categoria_p} />}
            <Campo
              etiqueta="Nombre"
              name="nombre"
              defaultValue={categoria?.nombre}
              placeholder="Cuidado del cabello"
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
