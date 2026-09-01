'use client';

import Link from 'next/link';
import { useState, useTransition, type FormEvent } from 'react';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { AvisoFormulario, Boton, Campo, Icono } from '@barber-shop/ui';

import { accionRegistrarCliente } from '@/acciones/portal';

/**
 * CU-001 — alta de cuenta de cliente.
 *
 * QUE CAMBIO Y POR QUE
 *
 * Antes esto llamaba a `auth.signUp()` desde el navegador y no creaba ni la
 * fila de `public.usuarios` ni la ficha de `clientes`: dejaba una cuenta de
 * Auth suelta y un cartel que decia «un administrador debe habilitar su
 * cuenta». Quien se registraba no podia hacer nada hasta que alguien de la
 * barberia se acordara de el.
 *
 * Ahora el registro publico es del cliente y se completa solo: la accion de
 * servidor crea la credencial, el usuario con rol `cliente` y su ficha, las
 * tres enlazadas. Al confirmar el correo ya puede reservar.
 *
 * EL ROL NO ES UN CAMPO DE ESTE FORMULARIO, y no por descuido. Quien se
 * registra por su cuenta es siempre un cliente; el personal de la barberia lo
 * da de alta el Administrador desde `/panel/usuarios`, por invitacion. Si el
 * rol se pudiera elegir aca, cualquiera se haria administrador.
 */
export function FormularioCrearCuenta() {
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [listo, setListo] = useState(false);
  const [enviando, iniciar] = useTransition();

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);

    setError(null);
    setErrores({});

    if (MODO_DEMO) {
      setListo(true);
      return;
    }

    iniciar(async () => {
      const r = await accionRegistrarCliente(datos);
      if (!r.ok) {
        setError(r.error);
        setErrores(r.campos ?? {});
        return;
      }
      setListo(true);
    });
  }

  if (listo) {
    return (
      <div className="text-center">
        <span className="bg-[var(--chip-exito-fondo)] text-exito inline-flex h-12 w-12 items-center justify-center rounded-full">
          <Icono nombre="circle-check" tamano="lg" />
        </span>
        <h2 className="text-titulo-3 text-principal mt-4 font-semibold">Cuenta creada</h2>
        <p className="text-cuerpo-sm text-secundario medida-lectura mx-auto mt-2">
          Le enviamos un correo para confirmar su dirección. Cuando la confirme puede ingresar
          y reservar su turno.
        </p>
        <Link href="/ingresar" className="mt-6 inline-block">
          <Boton variante="primario">Ir a iniciar sesión</Boton>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-5" noValidate>
      {error && <AvisoFormulario mensaje={error} />}

      <Campo
        etiqueta="Nombre y apellido"
        name="nombre"
        autoComplete="name"
        placeholder="Juan González"
        error={errores.nombre}
        required
      />

      <Campo
        etiqueta="Correo electrónico"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="nombre@correo.com.py"
        error={errores.email}
        required
      />

      {/* El telefono es obligatorio porque `clientes.telefono` es NOT NULL
          desde la migracion de validaciones, y porque es como la barberia
          avisa si hay que mover un turno. */}
      <Campo
        etiqueta="Teléfono"
        name="telefono"
        type="tel"
        autoComplete="tel"
        placeholder="0981 123 456"
        error={errores.telefono}
        required
      />

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
