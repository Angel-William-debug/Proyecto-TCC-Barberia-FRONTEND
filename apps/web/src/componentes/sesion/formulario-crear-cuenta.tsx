'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { clienteNavegador } from '@barber-shop/api/navegador';
import { Boton, Campo, Icono } from '@barber-shop/ui';

/**
 * CU-001 — alta de cuenta.
 *
 * Crea la credencial en Supabase Auth. NO crea la fila de `public.usuarios`
 * ni asigna rol: eso lo hace el administrador desde Configuración, porque el
 * rol determina qué puede ver cada persona y no puede quedar a elección de
 * quien se registra.
 *
 * Por eso, hasta que un administrador habilite la cuenta, quien se registre
 * podrá autenticarse pero no entrar al panel: `usuarioActual()` devuelve null
 * si no encuentra su fila en `public.usuarios`.
 */
export function FormularioCrearCuenta() {
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const datos = new FormData(evento.currentTarget);
    const nombre = String(datos.get('nombre') ?? '').trim();
    const email = String(datos.get('email') ?? '').trim();
    const password = String(datos.get('password') ?? '');
    const repetir = String(datos.get('repetir') ?? '');

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (password !== repetir) {
      setError('Las dos contraseñas no coinciden.');
      return;
    }

    setEnviando(true);

    if (MODO_DEMO) {
      setListo(true);
      setEnviando(false);
      return;
    }

    try {
      const { error: errorAuth } = await clienteNavegador().auth.signUp({
        email,
        password,
        options: { data: { nombre } },
      });

      if (errorAuth) {
        // No se distingue «ese correo ya existe» de otros fallos: revelarlo
        // permitiría averiguar qué cuentas están dadas de alta.
        setError('No se pudo crear la cuenta. Revise los datos e intente de nuevo.');
        setEnviando(false);
        return;
      }

      setListo(true);
      setEnviando(false);
    } catch {
      setError('No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.');
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <div className="text-center">
        <span className="bg-[var(--chip-exito-fondo)] text-exito inline-flex h-12 w-12 items-center justify-center rounded-full">
          <Icono nombre="circle-check" tamano="lg" />
        </span>
        <h2 className="text-titulo-3 text-principal mt-4 font-semibold">Cuenta creada</h2>
        <p className="text-cuerpo-sm text-secundario medida-lectura mx-auto mt-2">
          Le enviamos un correo para confirmar su dirección. Después de confirmarla, un
          administrador debe habilitar su cuenta y asignarle un rol antes de que pueda ingresar
          al sistema.
        </p>
        <Link href="/ingresar" className="mt-6 inline-block">
          <Boton variante="primario">Ir a iniciar sesión</Boton>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      {error && (
        <div
          role="alert"
          className="border-peligro text-peligro text-cuerpo-sm flex items-start gap-2 rounded-md border bg-[var(--chip-peligro-fondo)] p-3"
        >
          <Icono nombre="circle-alert" tamano="sm" className="mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <Campo
        etiqueta="Nombre y apellido"
        name="nombre"
        autoComplete="name"
        placeholder="Juan González"
        required
      />

      <Campo
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nombre@barbershop.com.py"
        required
      />

      <Campo
        etiqueta="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        ayuda="Al menos 8 caracteres"
        required
      />

      <Campo
        etiqueta="Repetir contraseña"
        name="repetir"
        type="password"
        autoComplete="new-password"
        required
      />

      <Boton type="submit" variante="primario" ancho="completo" cargando={enviando}>
        Crear cuenta
      </Boton>

      <p className="text-cuerpo-sm text-terciario text-center">
        Al crear la cuenta acepta el tratamiento de sus datos según la Ley 6534/2020 de
        Protección de Datos Personales.
      </p>
    </form>
  );
}
