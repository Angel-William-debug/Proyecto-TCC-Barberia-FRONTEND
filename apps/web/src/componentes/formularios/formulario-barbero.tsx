'use client';

import { useState } from 'react';

import type { Profesional } from '@barber-shop/tipos';
import { Boton, BotonIcono, Campo, CampoSelector, FilaCampos, GrupoCampos, Interruptor } from '@barber-shop/ui';

import { guardarBarbero } from '@/acciones/catalogo';
import { PanelFormulario } from './panel-formulario';

/** Tipos de contratacion de `profesionales.tipo`. */
const TIPOS = [
  { valor: 'barbero', etiqueta: 'Barbero' },
  { valor: 'barbero senior', etiqueta: 'Barbero senior' },
  { valor: 'especialista', etiqueta: 'Especialista' },
  { valor: 'externo', etiqueta: 'Externo' },
];

/**
 * CU-004 — alta y edicion de barberos.
 *
 * La tabla se llama `profesionales` y asi permanece; en pantalla se lee
 * «Barbero», segun la seccion 13.3 del sistema de diseno.
 */
export function FormularioBarbero({ barbero }: { barbero?: Profesional }) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(barbero);

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar a ${barbero!.nombre}`}
          variante="terciario"
          tamano="sm"
          onClick={() => setAbierto(true)}
        />
      ) : (
        <Boton variante="primario" icono="plus" onClick={() => setAbierto(true)}>
          Registrar barbero
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? 'Editar barbero' : 'Nuevo barbero'}
        descripcion="La comisión se aplica sobre cada servicio que complete."
        accion={guardarBarbero}
        textoGuardar={editando ? 'Guardar cambios' : 'Registrar barbero'}
      >
        {(errores) => (
          <>
            {editando && (
              <input type="hidden" name="id_profesional" value={barbero!.id_profesional} />
            )}

            <GrupoCampos titulo="Datos del barbero">
              <Campo
                etiqueta="Nombre y apellido"
                name="nombre"
                defaultValue={barbero?.nombre}
                placeholder="Marcos Ayala"
                error={errores.nombre}
                required
              />
              <FilaCampos>
                <Campo
                  etiqueta="Especialidad"
                  name="especialidad"
                  defaultValue={barbero?.especialidad ?? ''}
                  placeholder="Corte clásico y navaja"
                />
                <CampoSelector
                  etiqueta="Tipo de contratación"
                  name="tipo"
                  defaultValue={barbero?.tipo ?? ''}
                  opciones={TIPOS}
                  marcador="Elija un tipo"
                />
              </FilaCampos>
            </GrupoCampos>

            <GrupoCampos titulo="Comisión">
              <Campo
                etiqueta="Porcentaje por servicio"
                name="porcentaje_com"
                inputMode="decimal"
                defaultValue={barbero?.porcentaje_com ?? ''}
                sufijo="%"
                error={errores.porcentaje_com}
                ayuda="Entre 0 y 100. Se calcula sola al cerrar cada servicio (CU-007)."
                required
              />
              <Interruptor
                name="estado"
                etiqueta="Barbero activo"
                descripcion="Uno inactivo no aparece al agendar, pero conserva sus comisiones."
                defaultChecked={barbero ? barbero.estado : true}
              />
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
