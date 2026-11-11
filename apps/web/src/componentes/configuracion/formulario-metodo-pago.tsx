'use client';

import { useState } from 'react';

import { Boton, Campo, GrupoCampos } from '@barber-shop/ui';

import { crearMetodoPagoAccion } from '@/acciones/configuracion';
import { PanelFormulario } from '@/componentes/compartido/panel-formulario';

/**
 * CU-020 — alta de un método de pago (QA F2-07, 11/11/2026).
 *
 * Solo el alta: un método no se borra ni se renombra, porque los cobros ya
 * registrados lo referencian. Nace habilitado; si no se quiere ofrecer
 * todavía, se apaga con su interruptor como cualquier otro.
 */
export function FormularioMetodoPago() {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Boton variante="secundario" icono="plus" tamano="sm" onClick={() => setAbierto(true)}>
        Nuevo método de pago
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        ancho="sm"
        titulo="Nuevo método de pago"
        descripcion="Queda habilitado para registrar cobros y pagos a proveedores."
        accion={crearMetodoPagoAccion}
        textoGuardar="Crear método"
      >
        {(errores) => (
          <GrupoCampos titulo="Identificación">
            <Campo
              etiqueta="Nombre"
              name="nombre"
              placeholder="Giros Tigo"
              error={errores.nombre}
              required
            />
          </GrupoCampos>
        )}
      </PanelFormulario>
    </>
  );
}
