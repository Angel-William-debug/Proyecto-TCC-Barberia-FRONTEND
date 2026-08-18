'use client';

import { useState } from 'react';

import {
  Boton, Campo, CampoArea, CampoSelector, CuerpoFormulario, FilaCampos, GrupoCampos,
  Interruptor, PanelLateral, type AnchoPanel,
} from '@barber-shop/ui';

/**
 * Demostracion del panel lateral para la galeria del sistema de diseno.
 *
 * No guarda nada: es para ver la animacion de entrada, los tres anchos y la
 * disposicion estandar del formulario. Los formularios de verdad viven en
 * `componentes/formularios`.
 */
export function DemoPanel() {
  const [ancho, setAncho] = useState<AnchoPanel | null>(null);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Boton variante="primario" icono="plus" onClick={() => setAncho('md')}>
          Abrir formulario de ejemplo
        </Boton>
        <Boton variante="secundario" onClick={() => setAncho('sm')}>
          Ancho sm · 420 px
        </Boton>
        <Boton variante="secundario" onClick={() => setAncho('lg')}>
          Ancho lg · 760 px
        </Boton>
      </div>

      <PanelLateral
        abierto={ancho !== null}
        onCerrar={() => setAncho(null)}
        titulo="Nuevo cliente"
        descripcion={`Ancho ${ancho ?? 'md'}. Probá Escape, el velo y la tecla Tab.`}
        ancho={ancho ?? 'md'}
        pie={
          <>
            <Boton variante="terciario" onClick={() => setAncho(null)}>
              Cancelar
            </Boton>
            <Boton variante="primario" onClick={() => setAncho(null)}>
              Registrar cliente
            </Boton>
          </>
        }
      >
        <CuerpoFormulario>
          <GrupoCampos titulo="Datos de contacto">
            <Campo etiqueta="Nombre y apellido" placeholder="Juan González" required />
            <FilaCampos>
              <Campo etiqueta="Teléfono" placeholder="0981 123 456" required />
              <Campo etiqueta="Fecha de nacimiento" type="date" />
            </FilaCampos>
            <Campo
              etiqueta="Correo electrónico"
              type="email"
              defaultValue="correo-mal-escrito"
              error="Ingrese un correo con el formato nombre@dominio.com"
            />
            <CampoSelector
              etiqueta="Categoría"
              opciones={[
                { valor: '1', etiqueta: 'Corte' },
                { valor: '2', etiqueta: 'Barba' },
                { valor: '3', etiqueta: 'Infantil' },
              ]}
            />
          </GrupoCampos>

          <GrupoCampos titulo="Uso interno">
            <CampoArea
              etiqueta="Notas"
              placeholder="Prefiere tijera, no máquina en los costados."
              ayuda="Solo las ven recepcionistas y administradores."
            />
            <Interruptor
              etiqueta="Cliente activo"
              descripcion="Un cliente inactivo no aparece al agendar."
              defaultChecked
            />
          </GrupoCampos>
        </CuerpoFormulario>
      </PanelLateral>
    </>
  );
}
