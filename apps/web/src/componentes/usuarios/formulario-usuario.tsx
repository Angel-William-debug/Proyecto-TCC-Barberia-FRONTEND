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
export function FormularioUsuario({
  usuario,
  roles,
  barberosSinCuenta = [],
}: {
  usuario?: VistaUsuarioPorRol;
  roles: Rol[];
  /** Fichas de barbero sin cuenta, para vincular al dar de alta un profesional. */
  barberosSinCuenta?: Array<{ id_profesional: number; nombre: string }>;
}) {
  const [abierto, setAbierto] = useState(false);
  const editando = Boolean(usuario);
  const rolActual = roles.find((r) => r.nombre === usuario?.rol);
  const [idRolElegido, setIdRolElegido] = useState<string>('');
  const esProfesional = roles.find((r) => String(r.id_rol) === idRolElegido)?.nombre === 'profesional';

  // Al crear, el rol cliente no se ofrece (14/10/2026): un cliente se
  // registra solo desde el portal o la app, y asi recibe su ficha de
  // `clientes`. Creado desde aca quedaba con cuenta y sin ficha. Al editar
  // se lista igual, para no esconder el rol que ya tiene alguien.
  const rolesOfrecidos = editando ? roles : roles.filter((r) => r.nombre !== 'cliente');

  return (
    <>
      {editando ? (
        <BotonIcono
          icono="pencil"
          etiqueta={`Editar ${usuario!.nombre}`}
          variante="secundario"
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
                opciones={rolesOfrecidos.map((r) => ({ valor: r.id_rol, etiqueta: r.nombre }))}
                marcador="Elija un rol"
                error={errores.id_rol}
                onChange={(e) => setIdRolElegido(e.currentTarget.value)}
                required
              />
              {/* Un profesional necesita su ficha de barbero: sin ella entra al
                  panel y no ve su agenda ni sus comisiones. */}
              {!editando && esProfesional && (
                <CampoSelector
                  etiqueta="Ficha de barbero"
                  name="barbero"
                  defaultValue="nuevo"
                  opciones={[
                    { valor: 'nuevo', etiqueta: 'Crear su ficha nueva con este nombre' },
                    ...barberosSinCuenta.map((b) => ({
                      valor: b.id_profesional,
                      etiqueta: `${b.nombre} (ya cargado en Barberos, sin cuenta)`,
                    })),
                  ]}
                  ayuda="Si el barbero ya está en Barberos, elíjalo para que su cuenta vea su agenda y sus comisiones."
                  error={errores.barbero}
                  required
                />
              )}
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
