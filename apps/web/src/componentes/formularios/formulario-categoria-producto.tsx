'use client';

import { useState } from 'react';

import { Boton, Campo, CampoArea, GrupoCampos } from '@barber-shop/ui';

import { guardarCategoriaProducto } from '@/acciones/inventario';
import { PanelFormulario } from './panel-formulario';

/** CU-010 — alta rapida de una categoria de producto, desde Inventario. */
export function FormularioCategoriaProducto() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Boton variante="secundario" icono="tag" tamano="sm" onClick={() => setAbierto(true)}>
        Nueva categoría
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        ancho="sm"
        titulo="Nueva categoría de producto"
        accion={guardarCategoriaProducto}
        textoGuardar="Crear categoría"
      >
        {(errores) => (
          <GrupoCampos titulo="Identificación">
            <Campo
              etiqueta="Nombre"
              name="nombre"
              placeholder="Cuidado del cabello"
              error={errores.nombre}
              required
            />
            <CampoArea etiqueta="Descripción" name="descripcion" />
          </GrupoCampos>
        )}
      </PanelFormulario>
    </>
  );
}
