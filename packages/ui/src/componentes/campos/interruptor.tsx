'use client';

import { useId } from 'react';

import { cn } from '../../utilidades';

/** Interruptor de un booleano. Por dentro es una casilla nativa (seccion 9.11.3). */
export interface PropsInterruptor {
  name?: string;
  etiqueta: string;
  descripcion?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (valor: boolean) => void;
  disabled?: boolean;
}

/**
 * Interruptor de encendido y apagado, para `estado` y otros booleanos.
 *
 * Por dentro es una casilla nativa: asi el formulario la envia sola, el
 * teclado la alterna con la barra espaciadora y el lector de pantalla la
 * anuncia como lo que es. Lo que se dibuja es la casilla oculta, no un div
 * con un `onClick`.
 */
export function Interruptor({
  name,
  etiqueta,
  descripcion,
  defaultChecked,
  checked,
  onChange,
  disabled,
}: PropsInterruptor) {
  const id = useId();

  return (
    <div className="flex items-start gap-3">
      <label
        htmlFor={id}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
          'transition-colors duration-[var(--movimiento-rapido)]',
          'bg-elevado has-[:checked]:bg-marca',
          'has-[:focus-visible]:outline has-[:focus-visible]:outline-2',
          'has-[:focus-visible]:outline-borde-foco has-[:focus-visible]:outline-offset-2',
          disabled && 'cursor-not-allowed opacity-45',
        )}
      >
        <input
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          defaultChecked={defaultChecked}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={cn(
            'ml-0.5 h-5 w-5 rounded-full bg-white shadow-2',
            'transition-transform duration-[var(--movimiento-rapido)]',
            'peer-checked:translate-x-5',
          )}
        />
      </label>

      <div className="min-w-0">
        <label htmlFor={id} className="text-cuerpo text-principal cursor-pointer font-medium">
          {etiqueta}
        </label>
        {descripcion && <p className="text-cuerpo-sm text-terciario mt-0.5">{descripcion}</p>}
      </div>
    </div>
  );
}
