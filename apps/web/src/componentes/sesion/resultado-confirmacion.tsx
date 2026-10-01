'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Boton, Icono } from '@barber-shop/ui';

/**
 * Lo que ve el cliente al abrir el enlace del correo de confirmacion.
 *
 * El enlace pasa primero por Supabase, que confirma la cuenta y recien
 * despues redirige aca. Lo que llega en el fragmento de la direccion (`#...`)
 * dice como salio:
 *
 *   - `#access_token=...`: confirmada. No se usa para abrir sesion: el
 *     cliente puede haber abierto el correo en el telefono y registrarse
 *     desde la app, asi que se le pide que ingrese donde prefiera.
 *   - `#error=...&error_code=otp_expired`: el enlace vencio (una hora) o ya
 *     se uso. Desde Ingresar puede pedir otro.
 *
 * El fragmento se borra de la barra en cuanto se lee: lleva un token de
 * sesion y no tiene por que quedar en el historial ni en una captura.
 */
export function ResultadoConfirmacion() {
  const [estado, setEstado] = useState<'leyendo' | 'ok' | 'vencido'>('leyendo');

  useEffect(() => {
    const fragmento = new URLSearchParams(window.location.hash.slice(1));
    setEstado(fragmento.has('error') || fragmento.has('error_code') ? 'vencido' : 'ok');
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  if (estado === 'leyendo') return null;

  const ok = estado === 'ok';

  return (
    <div className="text-center">
      <span
        className={
          ok
            ? 'bg-[var(--chip-exito-fondo)] text-exito inline-flex h-12 w-12 items-center justify-center rounded-full'
            : 'bg-[var(--chip-advertencia-fondo)] text-advertencia inline-flex h-12 w-12 items-center justify-center rounded-full'
        }
      >
        <Icono nombre={ok ? 'circle-check' : 'circle-alert'} tamano="lg" />
      </span>
      <h2 className="text-titulo-3 text-principal mt-4 font-semibold">
        {ok ? '¡Correo confirmado!' : 'El enlace ya no sirve'}
      </h2>
      <p className="text-cuerpo-sm text-secundario medida-lectura mx-auto mt-2">
        {ok
          ? 'Su cuenta está activa. Ya puede ingresar con su correo y su contraseña, desde esta página o desde la app Barber Shop.'
          : 'Venció o ya se usó. Si su cuenta todavía no está confirmada, intente ingresar y toque «Reenviar el correo» para recibir uno nuevo.'}
      </p>
      <Link href="/ingresar" className="mt-6 inline-block">
        <Boton variante="primario">Ir a iniciar sesión</Boton>
      </Link>
    </div>
  );
}
