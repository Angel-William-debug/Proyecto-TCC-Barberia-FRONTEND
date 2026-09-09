'use client';

import type { ReactNode } from 'react';

import { Boton } from './boton';
import { Icono } from './icono';
import { cn } from '../utilidades';

/**
 * Barra de cambios sin guardar (seccion 9.12).
 *
 * Es la contraparte del panel lateral para las pantallas de ajustes. En un
 * formulario de alta el usuario SABE que esta creando algo y que hay que
 * confirmar; en una pantalla de configuracion, en cambio, llega a mirar y a
 * veces corrige un dato al pasar. La barra existe para que ese cambio no se
 * pierda en silencio: aparece pegada al pie apenas se toca un campo, dice
 * cuantos cambios hay y ofrece las dos unicas salidas posibles.
 *
 * POR QUE NO ES UN BOTON «GUARDAR» FIJO
 *
 * Un boton siempre visible no distingue entre «no toque nada» y «toque algo y
 * todavia no guarde», que es justo lo que el usuario necesita saber. Al
 * aparecer solo cuando hay cambios, la barra ES el aviso; no hace falta un
 * segundo cartel que lo diga.
 *
 * ACCESIBILIDAD
 *
 * `role="status"` con `aria-live="polite"`: el lector de pantalla anuncia que
 * hay cambios pendientes cuando termina de leer lo que el usuario estaba
 * haciendo, sin interrumpirlo a mitad de un campo. Un `alert` seria correcto
 * para un error, no para esto.
 *
 * Al desaparecer no se desmonta el hueco que ocupa: la pantalla reserva el
 * espacio con `pb-24`, de modo que el ultimo campo del formulario nunca queda
 * tapado por la barra.
 */
export interface PropsBarraGuardar {
  /** Con `false` la barra no se dibuja. La pantalla decide, mirando si el formulario esta sucio. */
  visible: boolean;
  /** Deshabilita las dos acciones y pone el boton primario en «guardando». */
  guardando?: boolean;
  /** Formulario al que pertenece el boton de guardar, por su atributo `id`. */
  formulario: string;
  onDescartar: () => void;
  /** Texto de la izquierda. El predeterminado sirve para casi todo. */
  mensaje?: string;
  /** Aviso de error, arriba del mensaje. Lo pone la pantalla cuando la accion falla. */
  error?: ReactNode;
  textoGuardar?: string;
}

export function BarraGuardar({
  visible,
  guardando = false,
  formulario,
  onDescartar,
  mensaje = 'Hay cambios sin guardar',
  error,
  textoGuardar = 'Guardar cambios',
}: PropsBarraGuardar) {
  if (!visible && !error) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'sticky bottom-0 z-30 -mx-4 mt-6 sm:-mx-6',
        'border-borde-sutil bg-navegacion border-t px-4 py-3 shadow-2 sm:px-6',
        'animate-in slide-in-from-bottom duration-200',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-cuerpo-sm text-secundario flex items-center gap-2">
          <Icono
            nombre={error ? 'circle-alert' : 'circle-dashed'}
            tamano="sm"
            className={error ? 'text-peligro' : 'text-marca'}
          />
          <span className={error ? 'text-peligro' : undefined}>{error ?? mensaje}</span>
        </p>

        <div className="flex items-center gap-2">
          <Boton variante="terciario" onClick={onDescartar} disabled={guardando}>
            Descartar
          </Boton>
          {/* Igual que en el panel lateral: el boton vive fuera del `form` y lo
              alcanza por su atributo `form`. Es lo que permite dejarlo pegado
              al pie sin sacar el formulario de su lugar en la pantalla. */}
          <Boton type="submit" form={formulario} variante="primario" cargando={guardando}>
            {textoGuardar}
          </Boton>
        </div>
      </div>
    </div>
  );
}
