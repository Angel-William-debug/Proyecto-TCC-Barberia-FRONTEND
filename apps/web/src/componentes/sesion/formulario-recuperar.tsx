'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { clienteNavegador } from '@barber-shop/api/navegador';
import { Boton, Campo, Icono } from '@barber-shop/ui';

/**
 * Recuperación de contraseña.
 *
 * Supabase Auth envía el correo con el enlace de restablecimiento; el sistema
 * nunca conoce ni compara contraseñas (RN-001).
 *
 * La respuesta es siempre la misma, exista o no la cuenta. Decir «ese correo
 * no está registrado» convierte esta pantalla en un buscador de cuentas
 * válidas.
 */
export function FormularioRecuperar() {
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setEnviando(true);

    const datos = new FormData(evento.currentTarget);
    const email = String(datos.get('email') ?? '').trim();

    if (!MODO_DEMO) {
      try {
        const origen = window.location.origin;
        await clienteNavegador().auth.resetPasswordForEmail(email, {
          redirectTo: `${origen}/ingresar`,
        });
      } catch {
        // Se ignora a propósito: el mensaje al usuario no cambia.
      }
    }

    setEnviado(true);
    setEnviando(false);
  }

  if (enviado) {
    return (
      <div className="text-center">
        <span className="bg-[var(--chip-info-fondo)] text-info inline-flex h-12 w-12 items-center justify-center rounded-full">
          <Icono nombre="bell" tamano="lg" />
        </span>
        <h2 className="text-titulo-3 text-principal mt-4 font-semibold">Revise su correo</h2>
        <p className="text-cuerpo-sm text-secundario medida-lectura mx-auto mt-2">
          Si esa dirección corresponde a una cuenta del sistema, le enviamos un enlace para
          establecer una contraseña nueva. El enlace vence en una hora.
        </p>
        <Link href="/ingresar" className="mt-6 inline-block">
          <Boton variante="primario">Volver a iniciar sesión</Boton>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      <p className="text-cuerpo-sm text-secundario">
        Escriba el correo con el que ingresa al sistema y le enviaremos un enlace para
        establecer una contraseña nueva.
      </p>

      <Campo
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nombre@barbershop.com.py"
        required
      />

      <Boton type="submit" variante="primario" ancho="completo" cargando={enviando}>
        Enviar enlace
      </Boton>
    </form>
  );
}
