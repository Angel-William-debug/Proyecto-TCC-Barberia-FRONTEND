import { ICONOS, TAMANO_ICONO, type NombreIcono, type TamanoIcono } from '../iconos';
import { cn } from '../utilidades';

export interface PropsIcono {
  nombre: NombreIcono;
  tamano?: TamanoIcono;
  className?: string;
  /**
   * Texto para lectores de pantalla. Seccion 7.3: un icono sin texto visible
   * SIEMPRE necesita uno. Si el icono es decorativo y va junto a un texto que
   * ya dice lo mismo, se omite y el icono queda con `aria-hidden`.
   */
  etiqueta?: string;
}

export function Icono({ nombre, tamano = 'sm', className, etiqueta }: PropsIcono) {
  const Componente = ICONOS[nombre];
  const px = TAMANO_ICONO[tamano];

  return (
    <Componente
      size={px}
      strokeWidth={tamano === '2xl' ? 1.25 : 1.5}
      className={cn('shrink-0', className)}
      aria-hidden={etiqueta ? undefined : true}
      aria-label={etiqueta}
      role={etiqueta ? 'img' : undefined}
    />
  );
}
