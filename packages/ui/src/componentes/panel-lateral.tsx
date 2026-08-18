'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { BotonIcono } from './boton';
import { cn } from '../utilidades';

/**
 * Seccion 9.10 del Sistema de Diseno: panel lateral.
 *
 * Entra desde la derecha y ocupa el alto completo. Es donde viven TODOS los
 * formularios de alta y edicion del sistema.
 *
 * POR QUE UN PANEL Y NO UNA VENTANA MODAL
 *
 * El formulario de un turno o de un cliente es alto y angosto: muchos campos
 * apilados, ninguno ancho. Una modal centrada desperdicia los costados y, en
 * cuanto pasa de seis campos, obliga a desplazar dentro de una caja flotante.
 *
 * Ademas el panel deja ver la tabla de atras. Quien carga un turno sigue
 * viendo la agenda del dia detras del velo, y eso ayuda a no perder contexto.
 *
 * POR QUE ENTRA DESDE LA DERECHA
 *
 * La izquierda ya es la barra de navegacion; un panel de ese lado la taparia.
 * Ademas la accion que lo abre -el boton primario del encabezado de vista-
 * esta a la derecha, asi que el panel aparece del mismo lado donde estaba el
 * puntero.
 */

export type AnchoPanel = 'sm' | 'md' | 'lg';

/** Seccion 9.10.1. Tres anchos, ninguno mas. */
const ANCHOS: Record<AnchoPanel, string> = {
  sm: 'sm:max-w-[420px]',
  md: 'sm:max-w-[560px]',
  lg: 'sm:max-w-[760px]',
};

export interface PropsPanelLateral {
  abierto: boolean;
  /** Se llama al pedir el cierre: velo, cruz o Escape. */
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  ancho?: AnchoPanel;
  /** Barra de acciones fija abajo. Normalmente Cancelar mas la accion primaria. */
  pie?: ReactNode;
  /**
   * Con cambios sin guardar, el velo y Escape piden confirmacion en lugar de
   * cerrar de una. Perder lo escrito por un clic al costado es de los errores
   * mas irritantes que puede cometer una interfaz.
   */
  hayCambios?: boolean;
  children: ReactNode;
}

export function PanelLateral({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  ancho = 'md',
  pie,
  hayCambios = false,
  children,
}: PropsPanelLateral) {
  // `presente` sobrevive al cierre el tiempo que dura la animacion de salida.
  // Sin eso el panel desapareceria de golpe y no habria transicion que ver.
  const [presente, setPresente] = useState(abierto);
  const [entrado, setEntrado] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const devolverFocoA = useRef<HTMLElement | null>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    if (abierto) {
      devolverFocoA.current = document.activeElement as HTMLElement;
      setPresente(true);
      // Dos cuadros: uno para montar en la posicion de salida y otro para que
      // el navegador registre el cambio de clase como una transicion.
      const t = requestAnimationFrame(() => requestAnimationFrame(() => setEntrado(true)));
      return () => cancelAnimationFrame(t);
    }

    setEntrado(false);
    const t = setTimeout(() => {
      setPresente(false);
      devolverFocoA.current?.focus();
    }, 240); // --movimiento-lento
    return () => clearTimeout(t);
  }, [abierto]);

  function pedirCierre() {
    if (hayCambios && !window.confirm('Hay cambios sin guardar. Cerrar de todos modos?')) {
      return;
    }
    onCerrar();
  }

  // Escape cierra. Tab queda atrapado dentro del panel: sin esto el foco se va
  // a la tabla de atras y el usuario escribe donde no ve.
  useEffect(() => {
    if (!abierto) return;

    function alPresionar(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        pedirCierre();
        return;
      }
      if (e.key !== 'Tab') return;

      const foco = contenedor.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!foco?.length) return;

      const primero = foco[0]!;
      const ultimo = foco[foco.length - 1]!;

      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener('keydown', alPresionar, true);
    return () => document.removeEventListener('keydown', alPresionar, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, hayCambios]);

  // El fondo no se desplaza mientras el panel esta abierto.
  useEffect(() => {
    if (!presente) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [presente]);

  // El primer campo recibe el foco al abrir: quien viene del teclado empieza a
  // escribir sin un Tab de mas.
  useEffect(() => {
    if (!entrado) return;
    const primero = contenedor.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled])',
    );
    primero?.focus();
  }, [entrado]);

  if (!presente) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Velo. Es un boton para que tambien se cierre desde el teclado. */}
      <button
        type="button"
        aria-label="Cerrar el panel"
        onClick={pedirCierre}
        className={cn(
          'absolute inset-0 bg-[var(--fondo-velo)]',
          'transition-opacity duration-[var(--movimiento-lento)] ease-estandar',
          entrado ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={contenedor}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={descripcion ? idDescripcion : undefined}
        className={cn(
          'bg-superficie border-borde-sutil relative flex h-full w-full flex-col border-l shadow-4',
          ANCHOS[ancho],
          'transition-transform duration-[var(--movimiento-lento)] ease-estandar',
          entrado ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <header className="border-borde-sutil flex shrink-0 items-start gap-4 border-b px-6 py-4">
          <div className="min-w-0 flex-1">
            <h2 id={idTitulo} className="text-titulo-2 text-principal font-semibold">
              {titulo}
            </h2>
            {descripcion && (
              <p id={idDescripcion} className="text-cuerpo-sm text-terciario mt-1">
                {descripcion}
              </p>
            )}
          </div>
          <BotonIcono
            icono="x"
            etiqueta="Cerrar"
            variante="terciario"
            tamano="sm"
            onClick={pedirCierre}
          />
        </header>

        {/* El unico elemento que se desplaza. Encabezado y pie quedan fijos: el
            boton de guardar tiene que estar siempre a la vista, tambien en un
            formulario de veinte campos. */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {pie && (
          <footer className="border-borde-sutil bg-superficie flex shrink-0 items-center justify-end gap-3 border-t px-6 py-4">
            {pie}
          </footer>
        )}
      </div>
    </div>
  );
}
