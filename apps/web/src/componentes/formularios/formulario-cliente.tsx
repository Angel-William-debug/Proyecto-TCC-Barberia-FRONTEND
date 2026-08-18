'use client';

import { useState } from 'react';

import type { Cliente } from '@barber-shop/tipos';
import { Boton, BotonIcono, Campo, CampoArea, FilaCampos, GrupoCampos, Interruptor } from '@barber-shop/ui';

import { guardarCliente } from '@/acciones/catalogo';
import { PanelFormulario } from './panel-formulario';

/**
 * CU-002 — alta y edicion de clientes.
 *
 * El mismo componente sirve para las dos cosas: si recibe un cliente, edita;
 * si no, da de alta. Separarlos habria duplicado los ocho campos y su
 * validacion, que es exactamente igual en los dos casos.
 */
export function FormularioCliente({ cliente }: { cliente?: Cliente }) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(cliente);

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar a ${cliente!.nombre}`}
          variante="terciario"
          tamano="sm"
          onClick={() => setAbierto(true)}
        />
      ) : (
        <Boton variante="primario" icono="plus" onClick={() => setAbierto(true)}>
          Registrar cliente
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? 'Editar cliente' : 'Nuevo cliente'}
        descripcion={
          editando
            ? 'Los cambios se registran en la auditoría del sistema.'
            : 'El teléfono es obligatorio: es con lo que se confirma el turno.'
        }
        accion={guardarCliente}
        textoGuardar={editando ? 'Guardar cambios' : 'Registrar cliente'}
      >
        {(errores) => (
          <>
            {editando && <input type="hidden" name="id_cliente" value={cliente!.id_cliente} />}

            <GrupoCampos titulo="Datos de contacto">
              <Campo
                etiqueta="Nombre y apellido"
                name="nombre"
                defaultValue={cliente?.nombre}
                placeholder="Juan González"
                error={errores.nombre}
                required
              />
              <FilaCampos>
                <Campo
                  etiqueta="Teléfono"
                  name="telefono"
                  defaultValue={cliente?.telefono}
                  placeholder="0981 123 456"
                  error={errores.telefono}
                  required
                />
                <Campo
                  etiqueta="Fecha de nacimiento"
                  name="fecha_nacimiento"
                  type="date"
                  defaultValue={cliente?.fecha_nacimiento ?? ''}
                  ayuda="Habilita el saludo de cumpleaños"
                />
              </FilaCampos>
              <Campo
                etiqueta="Correo electrónico"
                name="email"
                type="email"
                defaultValue={cliente?.email ?? ''}
                placeholder="nombre@correo.com.py"
                error={errores.email}
                ayuda="Opcional. Sin correo no se pueden enviar recordatorios."
              />
              <Campo
                etiqueta="Dirección"
                name="direccion"
                defaultValue={cliente?.direccion ?? ''}
                placeholder="San Lorenzo, Central"
              />
            </GrupoCampos>

            <GrupoCampos titulo="Uso interno">
              <CampoArea
                etiqueta="Notas"
                name="notas_internas"
                defaultValue={cliente?.notas_internas ?? ''}
                placeholder="Prefiere tijera, no máquina en los costados."
                ayuda="RN-008: solo las ven recepcionistas y administradores. El cliente nunca."
              />
              <Interruptor
                name="estado"
                etiqueta="Cliente activo"
                descripcion="Un cliente inactivo no aparece al agendar, pero conserva su historial."
                defaultChecked={cliente ? cliente.estado : true}
              />
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
