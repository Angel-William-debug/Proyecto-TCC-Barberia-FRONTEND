'use client';

import { useState, type FormEvent } from 'react';

import { clienteNavegador } from '@barber-shop/api/navegador';
import { AvisoFormulario, Boton, Campo } from '@barber-shop/ui';

/**
 * Cambiar la contraseña con la sesión abierta (vista 3; 15/10/2026).
 *
 * Supabase deja cambiarla con solo tener la sesión, sin pedir la actual. Eso
 * significa que cualquiera que encuentre la computadora del mostrador abierta
 * podría quedarse con la cuenta. Por eso se confirma primero la contraseña
 * actual, volviendo a ingresar con ella.
 */
export function FormularioCambiarContrasena({ email }: { email: string }) {
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const formulario = evento.currentTarget;
    const datos = new FormData(formulario);
    const actual = String(datos.get('actual') ?? '');
    const nueva = String(datos.get('nueva') ?? '');
    const repetida = String(datos.get('repetida') ?? '');

    const e: Record<string, string> = {};
    if (!actual) e.actual = 'Escriba su contraseña actual.';
    if (nueva.length < 8) e.nueva = 'Use al menos 8 caracteres.';
    else if (nueva === actual) e.nueva = 'La nueva tiene que ser distinta de la actual.';
    if (repetida !== nueva) e.repetida = 'No coincide con la nueva.';
    setErrores(e);
    setError(null);
    setListo(false);
    if (Object.keys(e).length) return;

    setEnviando(true);
    const supabase = clienteNavegador();
    const { error: errorActual } = await supabase.auth.signInWithPassword({ email, password: actual });
    if (errorActual) {
      setEnviando(false);
      if (errorActual.status === 0 || errorActual.name === 'AuthRetryableFetchError') {
        setError('No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.');
      } else {
        setErrores({ actual: 'La contraseña actual no es correcta.' });
      }
      return;
    }

    const { error: errorNueva } = await supabase.auth.updateUser({ password: nueva });
    setEnviando(false);
    if (errorNueva) {
      setError(
        errorNueva.code === 'weak_password'
          ? 'La contraseña nueva es demasiado débil. Combine letras, números y algún símbolo.'
          : 'No se pudo cambiar la contraseña. Intente de nuevo en unos instantes.',
      );
      return;
    }
    formulario.reset();
    setListo(true);
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {error && <AvisoFormulario mensaje={error} />}
      {listo && (
        <p role="status" className="text-cuerpo-sm text-exito">
          Listo: su contraseña cambió. La próxima vez ingrese con la nueva.
        </p>
      )}
      <Campo
        etiqueta="Contraseña actual"
        name="actual"
        type="password"
        autoComplete="current-password"
        error={errores.actual}
        required
      />
      <Campo
        etiqueta="Contraseña nueva"
        name="nueva"
        type="password"
        autoComplete="new-password"
        ayuda="Al menos 8 caracteres."
        error={errores.nueva}
        required
      />
      <Campo
        etiqueta="Repita la contraseña nueva"
        name="repetida"
        type="password"
        autoComplete="new-password"
        error={errores.repetida}
        required
      />
      <div className="flex justify-end">
        <Boton type="submit" variante="primario" icono="key-round" cargando={enviando}>
          Cambiar contraseña
        </Boton>
      </div>
    </form>
  );
}
