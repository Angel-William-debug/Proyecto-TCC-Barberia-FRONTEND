'use client';

import { useEffect } from 'react';

import { Boton, EstadoVacio, Tarjeta } from '@barber-shop/ui';

/**
 * Limite de error del panel.
 *
 * Distingue el caso mas frecuente al arrancar el proyecto -falta el archivo
 * .env.local- de un error real de la aplicacion. Sin esa distincion, quien
 * clona el repositorio ve una pantalla en blanco y no sabe por que.
 */
export default function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[panel]', error);
  }, [error]);

  const faltaConfiguracion = error.message.includes('variable de entorno');

  if (faltaConfiguracion) {
    return (
      <Tarjeta className="mx-auto max-w-2xl">
        <EstadoVacio
          icono="settings"
          titulo="Falta configurar la conexión con la base de datos"
          descripcion="Copie el archivo .env.example a apps/web/.env.local y complete NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. Los valores están en el panel de Supabase, en Project Settings > API."
          accion={
            <Boton variante="primario" icono="check" onClick={reset}>
              Ya lo configuré, reintentar
            </Boton>
          }
        />
      </Tarjeta>
    );
  }

  return (
    <Tarjeta className="mx-auto max-w-2xl">
      <EstadoVacio
        icono="triangle-alert"
        titulo="No se pudieron cargar los datos"
        descripcion={error.message}
        accion={
          <Boton variante="primario" onClick={reset}>
            Reintentar
          </Boton>
        }
      />
    </Tarjeta>
  );
}
