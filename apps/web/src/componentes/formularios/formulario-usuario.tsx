'use client';

import { useState } from 'react';

import type { Rol, VistaUsuarioPorRol } from '@barber-shop/tipos';
import { Boton, BotonIcono, Campo, CampoSelector, GrupoCampos, Interruptor } from '@barber-shop/ui';

import { actualizarUsuario, guardarUsuario } from '@/acciones/usuarios';
import { PanelFormulario } from './panel-formulario';

/**
 * CU-019 — alta de un usuario y cambio de rol o estado.
 *
 * Al editar no se toca el nombre ni el correo: son los datos con los que
 * Supabase Auth identifica a la persona, y cambiarlos desde acá dejaría la
 * ficha de `usuarios` desincronizada de su cuenta real. Solo se cambia el rol
 * (CU-019 A3) y el estado (CU-019 A2).
 */
export function FormularioUsuario({ usuario, roles }: { usuario?: VistaUsuarioPorRol; roles: Rol[] }) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(usuario);
  const rolActual = roles.find((r) => r.nombre === usuario?.rol);

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar ${usuario!.nombre}`}
          variante="terciario"
          tamano="sm"
          onClick={() => setAbierto(true)}
        />
      ) : (
        <Boton variante="primario" icono="plus" onClick={() => setAbierto(true)}>
          Invitar usuario
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? `Editar ${usuario!.nombre}` : 'Invitar usuario'}
        descripcion={
          editando
            ? 'El nombre y el correo no se editan acá: identifican la cuenta de Auth.'
            : 'Se manda un correo de invitación de Supabase Auth. La persona elige su propia contraseña (RN-047).'
        }
        accion={editando ? actualizarUsuario : guardarUsuario}
        textoGuardar={editando ? 'Guardar cambios' : 'Enviar invitación'}
      >
        {(errores) => (
          <>
            {editando && <input type="hidden" name="id_usuario" value={usuario!.id_usuario} />}

            <GrupoCampos titulo="Identificación">
              {editando ? (
                <>
                  <Campo etiqueta="Nombre" name="_nombre" defaultValue={usuario!.nombre} disabled />
                  <Campo etiqueta="Correo" name="_email" defaultValue={usuario!.email} disabled />
                </>
              ) : (
                <>
                  <Campo
                    etiqueta="Nombre completo"
                    name="nombre"
                    placeholder="Marcos Ayala"
                    error={errores.nombre}
                    required
                  />
                  <Campo
                    etiqueta="Correo"
                    name="email"
                    type="email"
                    placeholder="marcos@barbershop.com"
                    error={errores.email}
                    required
                  />
                </>
              )}
            </GrupoCampos>

            <GrupoCampos titulo="Rol y acceso">
              <CampoSelector
                etiqueta="Rol"
                name="id_rol"
                defaultValue={rolActual?.id_rol ?? ''}
                opciones={roles.map((r) => ({ valor: r.id_rol, etiqueta: r.nombre }))}
                marcador="Elija un rol"
                error={errores.id_rol}
                required
              />
              {editando && (
                <Interruptor
                  name="estado"
                  etiqueta="Usuario activo"
                  descripcion="Uno inactivo conserva su cuenta pero no puede iniciar sesión (RN-003)."
                  defaultChecked={usuario!.estado}
                />
              )}
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
