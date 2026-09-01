'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { PerfilCliente } from '@barber-shop/tipos';
import { AvisoFormulario, Boton, Campo } from '@barber-shop/ui';

import { accionActualizarPerfil } from '@/acciones/portal';

/**
 * Edicion de la ficha propia.
 *
 * NO usa `PanelFormulario`. Ese armazon existe para el molde del panel -abrir
 * un panel lateral desde una tabla, guardar, cerrar y volver a la lista-, y
 * aca no hay tabla ni lista: la pantalla ES el formulario. Meterlo en un panel
 * deslizante obligaria a abrir algo para editar lo unico que hay.
 *
 * El correo se muestra pero no se edita: cambiarlo significa cambiar la
 * credencial de Supabase Auth, que es otro flujo -con confirmacion en la
 * direccion nueva- y no una edicion de perfil.
 */
export function FormularioPerfil({ perfil }: { perfil: PerfilCliente }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardado, setGuardado] = useState(false);
  const [enviando, iniciar] = useTransition();

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);

    setError(null);
    setErrores({});
    setGuardado(false);

    iniciar(async () => {
      const r = await accionActualizarPerfil(datos);
      if (!r.ok) {
        setError(r.error);
        setErrores(r.campos ?? {});
        return;
      }
      setGuardado(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={enviar} className="mt-6 flex flex-col gap-5" noValidate>
      {error && <AvisoFormulario mensaje={error} />}
      {guardado && <AvisoFormulario mensaje="Sus datos quedaron guardados." tono="info" />}

      <Campo
        etiqueta="Nombre y apellido"
        name="nombre"
        autoComplete="name"
        defaultValue={perfil.nombre}
        error={errores.nombre}
        required
      />

      <Campo
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        defaultValue={perfil.email ?? ''}
        disabled
        ayuda="Es con lo que ingresa al portal. Para cambiarlo, avise en la barbería."
      />

      <Campo
        etiqueta="Teléfono"
        name="telefono"
        type="tel"
        autoComplete="tel"
        defaultValue={perfil.telefono}
        error={errores.telefono}
        ayuda="Por acá le avisamos si hay que mover un turno."
        required
      />

      <Campo
        etiqueta="Dirección"
        name="direccion"
        autoComplete="street-address"
        defaultValue={perfil.direccion ?? ''}
        error={errores.direccion}
      />

      <Campo
        etiqueta="Fecha de nacimiento"
        name="fechaNacimiento"
        type="date"
        defaultValue={perfil.fechaNacimiento ?? ''}
        error={errores.fechaNacimiento}
        ayuda="Opcional."
      />

      <div className="flex justify-end">
        <Boton type="submit" variante="primario" cargando={enviando}>
          Guardar mis datos
        </Boton>
      </div>
    </form>
  );
}
