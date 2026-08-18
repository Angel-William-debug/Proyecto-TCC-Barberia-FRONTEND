'use client';

import { useState } from 'react';

import type { Proveedor } from '@barber-shop/tipos';
import { Boton, BotonIcono, Campo, CampoArea, GrupoCampos, Interruptor } from '@barber-shop/ui';

import { guardarProveedor } from '@/acciones/entidades';
import { PanelFormulario } from './panel-formulario';

/** CU-011 — alta y edicion de proveedores. */
export function FormularioProveedor({ proveedor }: { proveedor?: Proveedor }) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(proveedor);

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar ${proveedor!.nombre}`}
          variante="terciario"
          tamano="sm"
          onClick={() => setAbierto(true)}
        />
      ) : (
        <Boton variante="secundario" tamano="sm" icono="plus" onClick={() => setAbierto(true)}>
          Nuevo proveedor
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? 'Editar proveedor' : 'Nuevo proveedor'}
        descripcion="Se vincula a las órdenes de compra del módulo de inventario."
        ancho="sm"
        accion={guardarProveedor}
        textoGuardar={editando ? 'Guardar cambios' : 'Crear proveedor'}
      >
        {(errores) => (
          <>
            {editando && <input type="hidden" name="id_proveedor" value={proveedor!.id_proveedor} />}

            <GrupoCampos titulo="Datos del proveedor">
              <Campo
                etiqueta="Razón social"
                name="nombre"
                defaultValue={proveedor?.nombre}
                placeholder="Distribuidora Capilar S.A."
                error={errores.nombre}
                required
              />
              <Campo
                etiqueta="Teléfono"
                name="telefono"
                defaultValue={proveedor?.telefono ?? ''}
                placeholder="021 445 6677"
              />
              <Campo
                etiqueta="Correo electrónico"
                name="email"
                type="email"
                defaultValue={proveedor?.email ?? ''}
                placeholder="ventas@proveedor.com.py"
                error={errores.email}
              />
              <CampoArea
                etiqueta="Dirección"
                name="direccion"
                rows={2}
                defaultValue={proveedor?.direccion ?? ''}
                placeholder="Asunción, Central"
              />
              <Interruptor
                name="estado"
                etiqueta="Proveedor activo"
                descripcion="Uno inactivo no aparece al crear una orden de compra."
                defaultChecked={proveedor ? proveedor.estado : true}
              />
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
