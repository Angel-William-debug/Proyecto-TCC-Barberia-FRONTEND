'use client';

import { useState } from 'react';

import type { CategoriaProducto, Producto } from '@barber-shop/tipos';
import {
  AvisoFormulario, Boton, BotonIcono, Campo, CampoArea, CampoSelector, FilaCampos, GrupoCampos, Interruptor,
} from '@barber-shop/ui';

import { guardarProducto } from '@/acciones/catalogo';
import { PanelFormulario } from './panel-formulario';

/**
 * Modulo 6 — alta y edicion de productos.
 *
 * El stock actual NO se edita aca a proposito: se mueve con entradas, salidas
 * y ajustes, que dejan su rastro en `movimientos_inventario`. Un campo
 * editable en este formulario permitiria cambiar el stock sin que quede
 * constancia de por que, y el inventario dejaria de ser auditable.
 */
export function FormularioProducto({
  producto,
  categorias,
}: {
  producto?: Producto;
  categorias: CategoriaProducto[];
}) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(producto);

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar ${producto!.nombre}`}
          variante="terciario"
          tamano="sm"
          onClick={() => setAbierto(true)}
        />
      ) : (
        <Boton variante="primario" icono="plus" onClick={() => setAbierto(true)}>
          Nuevo producto
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? 'Editar producto' : 'Nuevo producto'}
        descripcion="El stock se mueve con entradas, salidas y ajustes, no desde acá."
        accion={guardarProducto}
        textoGuardar={editando ? 'Guardar cambios' : 'Crear producto'}
      >
        {(errores) => (
          <>
            {editando && <input type="hidden" name="id_producto" value={producto!.id_producto} />}

            <GrupoCampos titulo="Identificación">
              <Campo
                etiqueta="Nombre del producto"
                name="nombre"
                defaultValue={producto?.nombre}
                placeholder="Cera modeladora mate 100 g"
                error={errores.nombre}
                required
              />
              <CampoSelector
                etiqueta="Categoría"
                name="id_categoria_p"
                defaultValue={producto?.id_categoria_p ?? ''}
                opciones={categorias.map((c) => ({ valor: c.id_categoria_p, etiqueta: c.nombre }))}
                marcador="Elija una categoría"
                error={errores.id_categoria_p}
                required
              />
              <CampoArea
                etiqueta="Descripción"
                name="descripcion"
                defaultValue={producto?.descripcion ?? ''}
              />
            </GrupoCampos>

            <GrupoCampos
              titulo="Unidades"
              descripcion="Se compra en una unidad y se consume en otra. Todavía no hay conversión automática entre las dos."
            >
              <FilaCampos>
                <Campo
                  etiqueta="Unidad de compra"
                  name="unidad_medida"
                  defaultValue={producto?.unidad_medida ?? ''}
                  placeholder="frasco"
                />
                <Campo
                  etiqueta="Unidad de consumo"
                  name="unidad_uso"
                  defaultValue={producto?.unidad_uso ?? ''}
                  placeholder="ml"
                />
              </FilaCampos>
            </GrupoCampos>

            <GrupoCampos titulo="Precio y niveles de stock">
              <Campo
                etiqueta="Precio unitario"
                name="precio_unitario"
                inputMode="numeric"
                defaultValue={producto?.precio_unitario ?? ''}
                sufijo="Gs."
                error={errores.precio_unitario}
                required
              />
              <FilaCampos>
                <Campo
                  etiqueta="Stock mínimo"
                  name="stock_minimo"
                  inputMode="decimal"
                  defaultValue={producto?.stock_minimo ?? ''}
                  error={errores.stock_minimo}
                  ayuda="Por debajo de esto se genera una alerta"
                  required
                />
                <Campo
                  etiqueta="Stock máximo"
                  name="stock_maximo"
                  inputMode="decimal"
                  defaultValue={producto?.stock_maximo ?? ''}
                  error={errores.stock_maximo}
                  ayuda="Opcional"
                />
              </FilaCampos>

              {editando && (
                <AvisoFormulario
                  tono="info"
                  mensaje={`Stock actual: ${producto!.stock_actual}. Para corregirlo, registre un movimiento de ajuste desde Inventario.`}
                />
              )}

              <Interruptor
                name="estado"
                etiqueta="Producto activo"
                descripcion="Uno inactivo no aparece al cargar consumos ni órdenes de compra."
                defaultChecked={producto ? producto.estado : true}
              />
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
