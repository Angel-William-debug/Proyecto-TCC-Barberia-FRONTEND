import { CLASES_CHIP, type Presentacion, type Tono } from '../estados';
import { Icono } from './icono';
import type { NombreIcono } from '../iconos';
import { cn } from '../utilidades';

/**
 * Seccion 9.6 del Sistema de Diseno.
 *
 * El chip lleva SIEMPRE icono y texto ademas del color. No es un adorno: es
 * el criterio 1.4.1 de la WCAG, y en este sistema tambien una necesidad
 * practica, porque el ambar de marca y el color de advertencia son
 * cromaticamente cercanos (seccion 4.5).
 */
export interface PropsChipEstado {
  presentacion: Presentacion;
  className?: string;
  /** Oculta el icono. Solo admisible en listas muy densas. */
  sinIcono?: boolean;
}

export function ChipEstado({ presentacion, className, sinIcono = false }: PropsChipEstado) {
  const { etiqueta, tono, icono, ayuda } = presentacion;

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-sm px-2',
        'text-etiqueta font-medium whitespace-nowrap',
        CLASES_CHIP[tono],
        className,
      )}
      title={ayuda}
    >
      {!sinIcono && <Icono nombre={icono as NombreIcono} tamano="xs" />}
      {etiqueta}
    </span>
  );
}

/**
 * Punto de color a secas, para la agenda, donde el espacio es escaso.
 *
 * `sinEtiqueta` deja solo el punto -el calendario del portal, en el
 * teléfono, no tiene lugar para el texto- y pasa la etiqueta a los lectores
 * de pantalla: el color solo no puede ser la única forma de decir el estado.
 */
export function PuntoEstado({
  tono,
  etiqueta,
  sinEtiqueta = false,
}: {
  tono: Tono;
  etiqueta: string;
  sinEtiqueta?: boolean;
}) {
  const fondo: Record<Tono, string> = {
    neutro: 'bg-secundario',
    exito: 'bg-exito',
    advertencia: 'bg-advertencia',
    peligro: 'bg-peligro',
    info: 'bg-info',
    marca: 'bg-marca',
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-2 shrink-0 rounded-full', fondo[tono])} aria-hidden="true" />
      <span className={sinEtiqueta ? 'solo-lectores' : 'text-etiqueta text-secundario'}>
        {etiqueta}
      </span>
    </span>
  );
}
