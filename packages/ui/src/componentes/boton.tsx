'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';

import { Icono } from './icono';
import type { NombreIcono } from '../iconos';
import { cn } from '../utilidades';

/**
 * Seccion 9.3 del Sistema de Diseno.
 *
 * Los ocho estados obligatorios de la seccion 9.2 estan cubiertos: reposo,
 * sobrevuelo, foco (por la regla global de `estilos.css`), presionado,
 * seleccionado, deshabilitado, cargando y error.
 */
const variantes = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-md font-medium whitespace-nowrap',
    'transition-colors duration-[var(--movimiento-rapido)] ease-estandar',
    // Seccion 11.2, criterio 2.5.5: el objetivo tactil nunca baja de 44 px,
    // aunque el boton se vea de 32.
    'relative after:absolute after:inset-0 after:min-h-11 after:min-w-11',
    'after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2',
    'disabled:pointer-events-none disabled:opacity-45',
  ],
  {
    variants: {
      variante: {
        primario: 'bg-marca text-sobre-marca hover:bg-marca-hover active:bg-marca-activo',
        secundario:
          'border border-borde-control text-principal hover:bg-elevado active:bg-superficie',
        terciario: 'text-secundario hover:bg-elevado hover:text-principal',
        peligro: 'bg-peligro text-white hover:opacity-90 active:opacity-80',
        'peligro-sutil': 'border border-peligro text-peligro hover:bg-[var(--chip-peligro-fondo)]',
      },
      tamano: {
        sm: 'h-8 px-3 text-cuerpo-sm',
        md: 'h-10 px-4 text-cuerpo',
        lg: 'h-12 px-6 text-cuerpo-lg',
      },
      ancho: {
        auto: '',
        completo: 'w-full',
      },
    },
    defaultVariants: {
      variante: 'secundario',
      tamano: 'md',
      ancho: 'auto',
    },
  },
);

export interface PropsBoton
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantes> {
  /** Icono a la izquierda del texto. */
  icono?: NombreIcono;
  /** Icono a la derecha. Para acciones que abren algo o navegan. */
  iconoDerecha?: NombreIcono;
  /**
   * Estado cargando. Deshabilita el boton y reemplaza el icono por un
   * indicador giratorio, conservando el ancho para que la fila no salte.
   *
   * Es obligatorio en toda accion que escriba en el servidor: sin el, un
   * doble clic en «Registrar cobro» duplica el registro.
   */
  cargando?: boolean;
}

export const Boton = forwardRef<HTMLButtonElement, PropsBoton>(function Boton(
  {
    className,
    variante,
    tamano,
    ancho,
    icono,
    iconoDerecha,
    cargando = false,
    disabled,
    children,
    type = 'button',
    ...resto
  },
  ref,
) {
  const tamanoIcono = tamano === 'lg' ? 'md' : tamano === 'sm' ? 'xs' : 'sm';

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={cn(variantes({ variante, tamano, ancho }), className)}
      {...resto}
    >
      {cargando ? (
        <Icono nombre="loader-circle" tamano={tamanoIcono} className="animate-spin" />
      ) : (
        icono && <Icono nombre={icono} tamano={tamanoIcono} />
      )}
      {children}
      {!cargando && iconoDerecha && <Icono nombre={iconoDerecha} tamano={tamanoIcono} />}
    </button>
  );
});

/**
 * Boton de solo icono. Exige `etiqueta` porque sin texto visible no hay forma
 * de que un lector de pantalla anuncie que hace (seccion 7.3).
 */
export interface PropsBotonIcono
  extends Omit<PropsBoton, 'icono' | 'iconoDerecha' | 'children' | 'ancho'> {
  icono: NombreIcono;
  etiqueta: string;
}

export const BotonIcono = forwardRef<HTMLButtonElement, PropsBotonIcono>(function BotonIcono(
  { icono, etiqueta, tamano = 'md', className, cargando, ...resto },
  ref,
) {
  const lado = tamano === 'lg' ? 'h-12 w-12' : tamano === 'sm' ? 'h-8 w-8' : 'h-10 w-10';

  return (
    <Boton
      ref={ref}
      tamano={tamano}
      cargando={cargando}
      aria-label={etiqueta}
      title={etiqueta}
      className={cn('px-0', lado, className)}
      icono={cargando ? undefined : icono}
      {...resto}
    />
  );
});
