'use client';

import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

import { Icono } from './icono';
import { cn } from '../utilidades';

/**
 * Seccion 9.4 del Sistema de Diseno: el resto de los campos de formulario.
 *
 * `Campo` -el de texto- vive aparte porque es el mas usado. Estos comparten
 * con el la misma anatomia, y esa repeticion es deliberada: etiqueta arriba
 * siempre visible, control de 40 px, y debajo la ayuda o el error, nunca los
 * dos a la vez.
 */

/** Envoltorio comun. Es lo que garantiza que los seis campos se vean igual. */
function Envoltorio({
  id,
  etiqueta,
  requerido,
  ayuda,
  error,
  className,
  children,
}: {
  id: string;
  etiqueta: string;
  requerido?: boolean;
  ayuda?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
        {requerido && (
          <span className="text-peligro ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-peligro text-cuerpo-sm flex items-center gap-1"
        >
          <Icono nombre="circle-alert" tamano="xs" />
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-terciario text-cuerpo-sm">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

/** Clases del control. Iguales en select, textarea y campo de texto. */
const CONTROL = [
  'bg-fondo text-principal text-cuerpo w-full rounded-md border px-3',
  'transition-colors duration-[var(--movimiento-rapido)]',
  'disabled:bg-superficie disabled:text-deshabilitado disabled:cursor-not-allowed',
];

// ---------------------------------------------------------------------------
// Selector
// ---------------------------------------------------------------------------

export interface OpcionCampo {
  valor: string | number;
  etiqueta: string;
}

export interface PropsCampoSelector
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  etiqueta: string;
  opciones: OpcionCampo[];
  /** Texto de la opcion vacia. Sin el, el primer valor queda elegido sin querer. */
  marcador?: string;
  ayuda?: string;
  error?: string;
  claseContenedor?: string;
}

/**
 * Elemento `select` nativo, igual que en los filtros.
 *
 * Uno propio se ve mas moderno y funciona peor: el nativo ya trae navegacion
 * por teclado, busqueda escribiendo la inicial, y en el telefono abre la rueda
 * del sistema.
 */
export const CampoSelector = forwardRef<HTMLSelectElement, PropsCampoSelector>(
  function CampoSelector(
    { etiqueta, opciones, marcador = 'Seleccione una opción', ayuda, error, required, id, claseContenedor, ...resto },
    ref,
  ) {
    const generado = useId();
    const idCampo = id ?? generado;

    return (
      <Envoltorio
        id={idCampo}
        etiqueta={etiqueta}
        requerido={required}
        ayuda={ayuda}
        error={error}
        className={claseContenedor}
      >
        <select
          ref={ref}
          id={idCampo}
          required={required}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
          className={cn(CONTROL, 'h-10', error ? 'border-peligro' : 'border-borde-control')}
          {...resto}
        >
          <option value="">{marcador}</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </Envoltorio>
    );
  },
);

// ---------------------------------------------------------------------------
// Area de texto
// ---------------------------------------------------------------------------

export interface PropsCampoArea
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  claseContenedor?: string;
}

export const CampoArea = forwardRef<HTMLTextAreaElement, PropsCampoArea>(function CampoArea(
  { etiqueta, ayuda, error, required, id, rows = 3, claseContenedor, ...resto },
  ref,
) {
  const generado = useId();
  const idCampo = id ?? generado;

  return (
    <Envoltorio
      id={idCampo}
      etiqueta={etiqueta}
      requerido={required}
      ayuda={ayuda}
      error={error}
      className={claseContenedor}
    >
      <textarea
        ref={ref}
        id={idCampo}
        rows={rows}
        required={required}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${idCampo}-error` : ayuda ? `${idCampo}-ayuda` : undefined}
        className={cn(
          CONTROL,
          'resize-y py-2 placeholder:text-terciario',
          error ? 'border-peligro' : 'border-borde-control',
        )}
        {...resto}
      />
    </Envoltorio>
  );
});

// ---------------------------------------------------------------------------
// Interruptor
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Disposicion del formulario
// ---------------------------------------------------------------------------

/**
 * Grupo de campos con titulo. Un formulario de mas de seis campos sin grupos
 * se lee como una lista sin jerarquia.
 *
 * Es un `fieldset` de verdad, no un div con un titulo: el lector de pantalla
 * anuncia la leyenda al entrar en cada campo del grupo.
 */
export function GrupoCampos({
  titulo,
  descripcion,
  children,
}: {
  titulo?: string;
  descripcion?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      {titulo && (
        <legend className="text-titulillo text-terciario mb-3 font-semibold tracking-[0.08em] uppercase">
          {titulo}
        </legend>
      )}
      {descripcion && <p className="text-cuerpo-sm text-terciario -mt-1 mb-3">{descripcion}</p>}
      <div className="flex flex-col gap-4">{children}</div>
    </fieldset>
  );
}

/**
 * Dos campos en una fila. Solo para pares cortos y relacionados -precio y
 * duracion, stock minimo y maximo-. En movil se apilan siempre.
 */
export function FilaCampos({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/** Separacion estandar entre grupos dentro del panel. */
export function CuerpoFormulario({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

/**
 * Aviso al pie del encabezado del formulario, para el error que no pertenece a
 * ningun campo: la conexion que falla, la regla de negocio que rechaza la base.
 *
 * Va arriba de todo y con `role="alert"`, de modo que el lector de pantalla lo
 * anuncie sin que el foco se mueva (criterio 4.1.3 de la WCAG).
 */
export function AvisoFormulario({ mensaje, tono = 'peligro' }: { mensaje: string; tono?: 'peligro' | 'info' }) {
  const estilos =
    tono === 'peligro'
      ? 'border-peligro text-peligro bg-[var(--chip-peligro-fondo)]'
      : 'border-info text-info bg-[var(--chip-info-fondo)]';

  return (
    <div role="alert" className={cn('text-cuerpo-sm flex items-start gap-2 rounded-md border p-3', estilos)}>
      <Icono nombre={tono === 'peligro' ? 'circle-alert' : 'bell'} tamano="sm" className="mt-0.5" />
      <span>{mensaje}</span>
    </div>
  );
}
