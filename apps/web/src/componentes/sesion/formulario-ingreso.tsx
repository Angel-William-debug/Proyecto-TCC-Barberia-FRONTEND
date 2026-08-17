'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { clienteNavegador } from '@barber-shop/api/navegador';
import { Boton, Campo, Icono } from '@barber-shop/ui';

/**
 * Formulario de ingreso.
 *
 * Los mensajes de error no distinguen entre «el correo no existe» y «la
 * contrasena es incorrecta». Hacerlo permitiria averiguar que cuentas estan
 * dadas de alta probando correos, que es el primer paso de un ataque dirigido.
 */
export function FormularioIngreso() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    // En modo demostracion no hay credenciales que validar: se entra directo.
    if (MODO_DEMO) {
      router.push('/panel/agenda');
      return;
    }

    const datos = new FormData(evento.currentTarget);
    const email = String(datos.get('email') ?? '').trim();
    const password = String(datos.get('password') ?? '');

    try {
      const { error: errorAuth } = await clienteNavegador().auth.signInWithPassword({
        email,
        password,
      });

      if (errorAuth) {
        setError('El correo o la contraseña no son correctos.');
        setEnviando(false);
        return;
      }

      router.refresh();
      router.push('/panel/agenda');
    } catch (causa) {
      const mensaje =
        causa instanceof Error && causa.message.includes('variable de entorno')
          ? 'Falta configurar la conexión con la base de datos. Revise apps/web/.env.local'
          : 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.';
      setError(mensaje);
      setEnviando(false);
    }
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
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nombre@barbershop.com.py"
        required
      />

      <div>
        <Campo
          etiqueta="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <p className="mt-2 text-right">
          <Link
            href="/recuperar-contrasena"
            className="text-cuerpo-sm text-secundario hover:text-marca underline"
          >
            ¿Olvidó su contraseña?
          </Link>
        </p>
      </div>

      <Boton type="submit" variante="primario" ancho="completo" cargando={enviando}>
        Ingresar
      </Boton>

      {MODO_DEMO && (
        <p className="text-cuerpo-sm text-terciario text-center">
          Modo demostración activo: cualquier dato le da acceso, y lo que verá es ficticio.
        </p>
      )}
    </form>
  );
}
