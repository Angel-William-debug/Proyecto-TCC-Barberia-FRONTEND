'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { clienteNavegador } from '@barber-shop/api/navegador';
import { AvisoFormulario, Boton, Campo, Icono } from '@barber-shop/ui';

/**
 * Recuperación de contraseña CON UN CÓDIGO (8/10/2026).
 *
 * QUÉ CAMBIÓ Y POR QUÉ
 *
 * Antes mandaba un enlace que volvía a `/ingresar`, donde no había forma de
 * elegir la contraseña nueva: el correo llegaba y no servía. Y en la app no
 * habría servido nunca, porque el enlace abre la web. Ahora el correo trae un
 * código de 8 dígitos que se escribe acá -o en la misma pantalla de la app-,
 * sin enlaces que dependan de dónde se abra el correo.
 *
 * TRES PASOS EN LA MISMA PANTALLA
 *
 *   1. El correo: `resetPasswordForEmail` manda el código (por Brevo, con la
 *      plantilla `recuperacion.html` del DBA).
 *   2. El código: `verifyOtp({ type: 'recovery' })` lo valida y abre una
 *      sesión.
 *   3. La contraseña nueva: `updateUser({ password })`, y entra directo.
 *
 * La respuesta del paso 1 es siempre la misma, exista o no la cuenta: decir
 * «ese correo no está registrado» convierte esta pantalla en un buscador de
 * cuentas válidas. El sistema nunca conoce ni compara contraseñas (RN-001):
 * todo lo hace Supabase Auth.
 */

type Paso = 'correo' | 'codigo' | 'clave';

const ESPERA_REENVIO_S = 60;

export function FormularioRecuperar() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>('correo');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [espera, setEspera] = useState(0);
  const [reenviado, setReenviado] = useState(false);

  // Cuenta regresiva para «Reenviar código»: Supabase admite uno por minuto.
  useEffect(() => {
    if (espera <= 0) return;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  async function pedirCodigo(direccion: string): Promise<boolean> {
    if (MODO_DEMO) return true;
    const { error: e } = await clienteNavegador().auth.resetPasswordForEmail(direccion);
    // El límite de envíos sí se dice: no revela si la cuenta existe, y sin
    // decirlo la persona espera un correo que no va a llegar.
    if (e?.code === 'over_email_send_rate_limit' || e?.status === 429) {
      setError('Ya le enviamos un código hace muy poco. Espere un minuto y vuelva a intentar.');
      return false;
    }
    return true;
  }

  // --------------------------------------------------------- 1. el correo
  async function enviarCorreo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const direccion = String(new FormData(evento.currentTarget).get('email') ?? '').trim();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(direccion)) {
      setErrores({ email: 'Escriba un correo válido.' });
      return;
    }
    setErrores({});
    setEnviando(true);
    const ok = await pedirCodigo(direccion);
    setEnviando(false);
    if (!ok) return;
    setEmail(direccion);
    setEspera(ESPERA_REENVIO_S);
    setPaso('codigo');
  }

  async function reenviar() {
    setError(null);
    setReenviado(false);
    const ok = await pedirCodigo(email);
    if (ok) {
      setReenviado(true);
      setEspera(ESPERA_REENVIO_S);
    }
  }

  // --------------------------------------------------------- 2. el código
  async function enviarCodigo(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const codigo = String(new FormData(evento.currentTarget).get('codigo') ?? '').replace(/\s/g, '');
    setError(null);
    if (!/^\d{6,10}$/.test(codigo)) {
      setErrores({ codigo: 'Escriba el código de 8 números que le llegó por correo.' });
      return;
    }
    setErrores({});
    if (MODO_DEMO) {
      setPaso('clave');
      return;
    }
    setEnviando(true);
    const { error: e } = await clienteNavegador().auth.verifyOtp({ email, token: codigo, type: 'recovery' });
    setEnviando(false);
    if (e) {
      setError('El código no es correcto o ya venció. Revíselo, o pida uno nuevo.');
      return;
    }
    setPaso('clave');
  }

  // ------------------------------------------------- 3. la contraseña nueva
  async function enviarClave(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    const password = String(datos.get('password') ?? '');
    const repetir = String(datos.get('repetir') ?? '');
    setError(null);

    const nuevos: Record<string, string> = {};
    if (password.length < 8) nuevos.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== repetir) nuevos.repetir = 'Las dos contraseñas no coinciden.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    if (MODO_DEMO) {
      router.push('/ingresar');
      return;
    }
    setEnviando(true);
    const { error: e } = await clienteNavegador().auth.updateUser({ password });
    if (e) {
      setEnviando(false);
      setError(
        e.code === 'same_password'
          ? 'La contraseña nueva tiene que ser distinta de la anterior.'
          : 'No se pudo guardar la contraseña. Intente de nuevo.',
      );
      return;
    }
    // Ya tiene sesión: entra como en el ingreso. El panel manda a cada uno a
    // su zona según el rol (los clientes, al portal).
    router.refresh();
    router.push('/panel/agenda');
  }

  // ----------------------------------------------------------------- vista
  const pasos = { correo: 1, codigo: 2, clave: 3 } as const;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-titulillo text-terciario tracking-[0.08em] uppercase">
        Paso {pasos[paso]} de 3
      </p>

      {error && <AvisoFormulario mensaje={error} />}

      {paso === 'correo' && (
        <form onSubmit={enviarCorreo} className="flex flex-col gap-5" noValidate>
          <p className="text-cuerpo-sm text-secundario">
            Escriba el correo con el que ingresa y le enviaremos un código para elegir una
            contraseña nueva.
          </p>
          <Campo
            etiqueta="Correo electrónico"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nombre@correo.com.py"
            defaultValue={email}
            error={errores.email}
            required
          />
          <Boton type="submit" variante="primario" ancho="completo" cargando={enviando}>
            Enviar código
          </Boton>
        </form>
      )}

      {paso === 'codigo' && (
        <form onSubmit={enviarCodigo} className="flex flex-col gap-5" noValidate>
          <div className="flex items-start gap-3">
            <span className="bg-[var(--chip-info-fondo)] text-info inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Icono nombre="mail" tamano="md" />
            </span>
            <p className="text-cuerpo-sm text-secundario">
              Si <strong className="text-principal">{email}</strong> tiene una cuenta, le enviamos
              un código de 8 números. Vence en una hora. Si no lo ve, revise el correo no deseado.
            </p>
          </div>
          <Campo
            etiqueta="Código"
            name="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={10}
            placeholder="12345678"
            className="font-mono tracking-[0.3em]"
            error={errores.codigo}
            required
            autoFocus
          />
          <Boton type="submit" variante="primario" ancho="completo" cargando={enviando}>
            Verificar código
          </Boton>
          <div className="text-cuerpo-sm flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setPaso('correo');
                setError(null);
                setReenviado(false);
              }}
              className="text-secundario hover:text-principal cursor-pointer underline"
            >
              Usar otro correo
            </button>
            {espera > 0 ? (
              <span className="text-terciario tabular-nums">
                {reenviado ? 'Se lo volvimos a enviar. ' : ''}Reenviar en {espera} s
              </span>
            ) : (
              <button
                type="button"
                onClick={reenviar}
                className="text-secundario hover:text-principal cursor-pointer underline"
              >
                Reenviar código
              </button>
            )}
          </div>
        </form>
      )}

      {paso === 'clave' && (
        <form onSubmit={enviarClave} className="flex flex-col gap-5" noValidate>
          <div className="flex items-start gap-3">
            <span className="bg-[var(--chip-exito-fondo)] text-exito inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
              <Icono nombre="key-round" tamano="md" />
            </span>
            <p className="text-cuerpo-sm text-secundario">
              Código correcto. Elija su contraseña nueva para <strong className="text-principal">{email}</strong>.
            </p>
          </div>
          <Campo
            etiqueta="Contraseña nueva"
            name="password"
            type="password"
            autoComplete="new-password"
            ayuda="Al menos 8 caracteres"
            error={errores.password}
            required
            autoFocus
          />
          <Campo
            etiqueta="Repetir contraseña nueva"
            name="repetir"
            type="password"
            autoComplete="new-password"
            error={errores.repetir}
            required
          />
          <Boton type="submit" variante="primario" ancho="completo" cargando={enviando}>
            Guardar e ingresar
          </Boton>
        </form>
      )}
    </div>
  );
}
