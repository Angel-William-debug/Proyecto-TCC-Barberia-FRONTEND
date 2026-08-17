import { cn } from '@barber-shop/ui';

/**
 * Seccion 2.3 del Sistema de Diseno.
 *
 * El isotipo es un poste de barbero estilizado: una forma vertical con
 * franjas diagonales, inscripta en una caja cuadrada. Se dibuja en SVG y no
 * como imagen para que herede el color del texto y escale sin perdida.
 *
 * Las franjas usan `currentColor` con opacidades distintas en lugar del rojo
 * y azul literales del poste real: sobre fondo carbon, esos dos colores
 * compiten con la paleta semantica, donde el rojo ya significa peligro.
 */
export function Isotipo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn('text-marca', className)}
      aria-hidden="true"
    >
      {/* Remates superior e inferior */}
      <rect x="14" y="2" width="20" height="5" rx="1.5" fill="currentColor" />
      <rect x="14" y="41" width="20" height="5" rx="1.5" fill="currentColor" />

      {/* Cuerpo del poste */}
      <rect
        x="16"
        y="8"
        width="16"
        height="32"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />

      {/* Franjas diagonales, recortadas al cuerpo */}
      <clipPath id="cuerpo-poste">
        <rect x="17" y="9" width="14" height="30" rx="1.5" />
      </clipPath>
      <g clipPath="url(#cuerpo-poste)" fill="currentColor">
        <rect x="4" y="4" width="6" height="52" transform="rotate(35 24 24)" opacity="0.9" />
        <rect x="18" y="4" width="6" height="52" transform="rotate(35 24 24)" opacity="0.45" />
        <rect x="32" y="4" width="6" height="52" transform="rotate(35 24 24)" opacity="0.9" />
      </g>
    </svg>
  );
}

/** Variante horizontal: isotipo mas texto. Barra superior y cabeceras. */
export function LogoHorizontal({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Isotipo className="h-7 w-7" />
      <span className="font-display text-principal text-titulo-2 leading-none font-semibold tracking-wide">
        BARBER<span className="text-marca">SHOP</span>
      </span>
    </span>
  );
}
