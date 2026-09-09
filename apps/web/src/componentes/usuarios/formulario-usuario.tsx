'use client';

import { useState } from 'react';

import type { Rol, VistaUsuarioPorRol } from '@barber-shop/tipos';
import { Boton, BotonIcono, Campo, CampoSelector, GrupoCampos, Interruptor } from '@barber-shop/ui';

import { guardarCambiosUsuario, guardarUsuario } from '@/acciones/usuarios';
import { PanelFormulario } from '@/componentes/compartido/panel-formulario';

/**
 * CU-019 — alta de un usuario y cambio de rol o estado.
 *
 * El alta CREA la cuenta con una contraseña inicial; no manda una invitación.
 * El porqué del cambio está en `apps/api/src/modulos/usuarios.ts`.
 *
 * Al editar no se toca el nombre ni el correo: son los datos con los que
 * Supabase Auth identifica a la persona, y cambiarlos desde acá dejaría la
 * ficha de `usuarios` desincronizada de su cuenta real. Tampoco se toca la
 * contraseña: cambiarla es de la persona, desde «Recuperar contraseña». Solo
 * se cambia el rol (CU-019 A3) y el estado (CU-019 A2).
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
          Crear usuario
        </Boton>
      )}

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? `Editar ${usuario!.nombre}` : 'Crear usuario'}
        descripcion={
          editando
            ? 'El nombre y el correo no se editan acá: identifican la cuenta de Auth.'
            : 'La cuenta queda lista para usarse. Entréguele la contraseña a la persona; la puede cambiar cuando quiera desde «Recuperar contraseña».'
        }
        accion={editando ? guardarCambiosUsuario : guardarUsuario}
        textoGuardar={editando ? 'Guardar cambios' : 'Crear usuario'}
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

            {!editando && (
              <GrupoCampos
                titulo="Contraseña inicial"
                descripcion="La elige usted y se la entrega a la persona, que la puede cambiar después. No se guarda en la ficha del usuario: la administra Supabase Auth (RN-047)."
              >
                <Campo
                  etiqueta="Contraseña"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  ayuda="Al menos 8 caracteres"
                  error={errores.password}
                  required
                />
                <Campo
                  etiqueta="Repetir contraseña"
                  name="repetir"
                  type="password"
                  autoComplete="new-password"
                  error={errores.repetir}
                  required
                />
              </GrupoCampos>
            )}

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
