'use client';

import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';

import { CONTROL, Envoltorio } from './base';
import { Icono } from '../icono';
import { cn } from '../../utilidades';

/**
 * Campo de texto (seccion 9.11.3). Es el mas usado del sistema.
 *
 * Antes vivia en `campo.tsx`, al lado de `campos.tsx` con los otros cuatro:
 * dos nombres que se diferenciaban en una letra. Y ademas dibujaba su propia
 * etiqueta, su propia ayuda y su propio error, duplicando lo que ya hacia
 * `Envoltorio`. Ahora usa el mismo, que es justamente lo que garantiza que los
 * cinco campos se vean iguales.
 *
 * CONTRASEÑAS (8/10/2026). Con `type="password"` el campo lleva a la derecha
 * un boton con un ojo que muestra u oculta lo escrito. Esta aca y no en cada
 * formulario para que aparezca en todos: ingresar, crear cuenta, recuperar la
 * contraseña y el alta de usuarios del panel. El boton dice que hace en
 * `aria-label` y su estado en `aria-pressed`; no roba el foco del campo al
 * tabular (va despues, en orden natural).
 */
export interface PropsCampo extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  etiqueta: string;
  /** Debajo del campo. Lo reemplaza el mensaje de error cuando lo hay. */
  ayuda?: string;
  error?: string;
  /** Contenido a la derecha dentro del campo: un sufijo como «Gs.» o «min». */
  sufijo?: ReactNode;
  className?: string;
  claseContenedor?: string;
}

export const Campo = forwardRef<HTMLInputElement, PropsCampo>(function Campo(
  { etiqueta, ayuda, error, sufijo, required, id, className, claseContenedor, type, ...resto },
  ref,
) {
  const generado = useId();
  const idCampo = id ?? generado;
  const esClave = type === 'password';
  const [visible, setVisible] = useState(false);

  return (
    <Envoltorio
      id={idCampo}
      etiqueta={etiqueta}
      requerido={required}
      ayuda={ayuda}
      error={error}
      className={claseContenedor}
    >
      <div className="relative flex items-center">
        <input
          ref={ref}
          id={idCampo}
          type={esClave && visible ? 'text' : type}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
          className={cn(
            CONTROL,
            'h-10',
            error ? 'border-peligro' : 'border-borde-control',
            // El sufijo y el ojo se dibujan encima del campo, no al lado: sin
            // este relleno el texto largo pasa por debajo.
            (sufijo || esClave) && 'pr-12',
            className,
          )}
          {...resto}
        />
        {esClave ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            aria-controls={idCampo}
            className="text-terciario hover:text-principal absolute right-1 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-sm"
          >
            <Icono nombre={visible ? 'eye-off' : 'eye'} tamano="sm" />
          </button>
        ) : (
          sufijo && (
            <span className="text-terciario text-cuerpo-sm pointer-events-none absolute right-3">
              {sufijo}
            </span>
          )
        )}
      </div>
    </Envoltorio>
  );
});
