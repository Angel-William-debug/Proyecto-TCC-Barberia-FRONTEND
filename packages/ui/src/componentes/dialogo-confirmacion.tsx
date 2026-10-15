'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';

import { Boton } from './boton';
import { Icono } from './icono';
import { cn } from '../utilidades';

/**
 * Confirmación de acción destructiva (sección 9.13; vista 96 del anexo,
 * 15/10/2026).
 *
 * Reemplaza a `window.confirm`, que mostraba una ventana gris del navegador,
 * con «Aceptar» y «Cancelar» en el idioma del sistema operativo y fuera de la
 * identidad visual. Usa el `<dialog>` nativo con `showModal()`: el navegador ya
 * pone el resto de la página inerte, atrapa el foco y cierra con Escape.
 *
 * Se usa como una promesa, igual que `window.confirm`:
 *
 *   const confirmar = useConfirmar();
 *   if (!(await confirmar({ titulo: '¿Borrar?', peligro: true }))) return;
 *
 * Con una acción de peligro el foco empieza en «Cancelar»: un Enter apurado
 * no borra nada.
 */
export interface OpcionesConfirmacion {
  titulo: string;
  mensaje?: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** Acción que destruye o no se puede deshacer: botón rojo y foco en Cancelar. */
  peligro?: boolean;
}

type Confirmar = (opciones: OpcionesConfirmacion) => Promise<boolean>;
type Pendiente = OpcionesConfirmacion & { resolver: (ok: boolean) => void };

const Contexto = createContext<Confirmar | null>(null);

export function ProveedorConfirmacion({ children }: { children: React.ReactNode }) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const dialogo = useRef<HTMLDialogElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const aceptar = useRef<HTMLButtonElement>(null);
  const idTitulo = useId();
  const idMensaje = useId();

  const confirmar = useCallback<Confirmar>(
    (opciones) => new Promise<boolean>((resolver) => setPendiente({ ...opciones, resolver })),
    [],
  );

  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (pendiente && !d.open) {
      d.showModal();
      (pendiente.peligro ? cancelar : aceptar).current?.focus();
    }
    if (!pendiente && d.open) d.close();
  }, [pendiente]);

  function responder(ok: boolean) {
    pendiente?.resolver(ok);
    setPendiente(null);
  }

  return (
    <Contexto.Provider value={confirmar}>
      {children}
      <dialog
        ref={dialogo}
        aria-labelledby={idTitulo}
        aria-describedby={pendiente?.mensaje ? idMensaje : undefined}
        onCancel={(e) => {
          e.preventDefault();
          responder(false);
        }}
        className={cn(
          'bg-superficie border-borde-sutil text-principal m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border p-0 shadow-4',
          'backdrop:bg-[var(--fondo-velo)]',
        )}
      >
        {pendiente && (
          <div className="flex flex-col gap-4 p-6 text-left">
            <div className="flex items-start gap-3">
              {pendiente.peligro && (
                <span className="text-peligro mt-0.5 shrink-0">
                  <Icono nombre="triangle-alert" tamano="md" />
                </span>
              )}
              <div className="min-w-0">
                <h2 id={idTitulo} className="text-titulo-3 text-principal font-semibold">
                  {pendiente.titulo}
                </h2>
                {pendiente.mensaje && (
                  <p id={idMensaje} className="text-cuerpo-sm text-secundario mt-2">
                    {pendiente.mensaje}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Boton ref={cancelar} variante="secundario" onClick={() => responder(false)}>
                {pendiente.textoCancelar ?? 'Cancelar'}
              </Boton>
              <Boton
                ref={aceptar}
                variante={pendiente.peligro ? 'peligro' : 'primario'}
                onClick={() => responder(true)}
              >
                {pendiente.textoConfirmar ?? 'Confirmar'}
              </Boton>
            </div>
          </div>
        )}
      </dialog>
    </Contexto.Provider>
  );
}

/**
 * La función para pedir confirmación. Fuera del proveedor -por ejemplo en la
 * galería del sistema de diseño- cae en `window.confirm`, para no romper.
 */
export function useConfirmar(): Confirmar {
  const contexto = useContext(Contexto);
  return (
    contexto ??
    (async (o: OpcionesConfirmacion) => window.confirm([o.titulo, o.mensaje].filter(Boolean).join('\n\n')))
  );
}
