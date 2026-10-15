'use client';

import { useEffect, useState } from 'react';

import { Boton, EstadoVacio, Tarjeta } from '@barber-shop/ui';

type Causa = 'revisando' | 'sin-internet' | 'servidor' | 'aplicacion';

/**
 * Limite de error del panel.
 *
 * Distingue el caso mas frecuente al arrancar el proyecto -falta el archivo
 * .env.local- de un error real de la aplicacion. Sin esa distincion, quien
 * clona el repositorio ve una pantalla en blanco y no sabe por que.
 *
 * Desde el 15/10/2026 (vista 91, error de conexion) distingue tambien de
 * donde viene la falla, porque en produccion Next oculta el mensaje real:
 *
 *   - el navegador no tiene internet;
 *   - hay internet pero la base no responde (Supabase pausado o caido): se
 *     pregunta a su endpoint de salud;
 *   - la base responde: el error es de la aplicacion.
 */
export default function ErrorPanel({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [causa, setCausa] = useState<Causa>('revisando');

  useEffect(() => {
    console.error('[panel]', error);
  }, [error]);

  useEffect(() => {
    let vigente = true;
    async function diagnosticar() {
      if (!navigator.onLine) return setCausa('sin-internet');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const clave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !clave) return setCausa('aplicacion');
      try {
        const r = await fetch(`${url}/auth/v1/health`, {
          headers: { apikey: clave },
          signal: AbortSignal.timeout(8000),
        });
        if (vigente) setCausa(r.ok ? 'aplicacion' : 'servidor');
      } catch {
        if (vigente) setCausa(navigator.onLine ? 'servidor' : 'sin-internet');
      }
    }
    void diagnosticar();
    return () => {
      vigente = false;
    };
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

  const textos: Record<Causa, { titulo: string; descripcion: string }> = {
    revisando: {
      titulo: 'No se pudieron cargar los datos',
      descripcion: 'Revisando la conexión…',
    },
    'sin-internet': {
      titulo: 'Sin conexión a internet',
      descripcion: 'Este equipo perdió la conexión. Cuando vuelva, toque Reintentar: no se perdió nada de lo guardado.',
    },
    servidor: {
      titulo: 'El servidor de datos no responde',
      descripcion:
        'Hay internet, pero la base de datos no contesta. Si dura más de unos minutos, avísele al administrador: puede estar pausada.',
    },
    aplicacion: {
      titulo: 'No se pudieron cargar los datos',
      descripcion: 'La conexión está bien, pero esta pantalla tuvo un problema. Reintente; si se repite, avise al administrador.',
    },
  };

  return (
    <Tarjeta className="mx-auto max-w-2xl">
      <EstadoVacio
        icono={causa === 'aplicacion' || causa === 'revisando' ? 'triangle-alert' : 'circle-x'}
        titulo={textos[causa].titulo}
        descripcion={textos[causa].descripcion}
        accion={
          <Boton variante="primario" onClick={reset} disabled={causa === 'revisando'}>
            Reintentar
          </Boton>
        }
      />
    </Tarjeta>
  );
}
