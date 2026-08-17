import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';

import { cn } from '../utilidades';

/**
 * Seccion 9.5 del Sistema de Diseno.
 *
 * Es el componente mas usado del sistema: agenda, clientes, servicios,
 * cobros, inventario y compras son todas tablas.
 *
 * Decisiones que conviene no revertir sin pensarlo:
 *  - Sin filas alternadas. Sobre fondo oscuro un borde inferior separa mejor.
 *  - `caption` obligatorio aunque no se muestre: es lo que anuncia el lector
 *    de pantalla al entrar en la tabla.
 *  - Las columnas numericas van a la derecha y con cifras tabulares, para que
 *    los montos se comparen de un vistazo.
 */
export interface PropsTabla {
  /** Se anuncia a los lectores de pantalla. Obligatorio. */
  titulo: string;
  /** `false` lo oculta visualmente pero lo mantiene accesible. */
  mostrarTitulo?: boolean;
  /**
   * Por debajo de 768 px cada fila se convierte en una tarjeta. Se desactiva
   * solo en los reportes anchos, donde comparar columnas importa más que
   * evitar el desplazamiento horizontal.
   */
  tarjetasEnMovil?: boolean;
  children: ReactNode;
  className?: string;
}

export function Tabla({
  titulo,
  mostrarTitulo = false,
  tarjetasEnMovil = true,
  children,
  className,
}: PropsTabla) {
  return (
    <div className={cn('w-full', !tarjetasEnMovil && 'overflow-x-auto')}>
      {/* Los roles ARIA se declaran explícitamente en toda la tabla. En móvil
          el CSS cambia `display` para presentar cada fila como tarjeta, y eso
          le quita a los elementos de tabla sus roles implícitos. Sin estos
          atributos, un lector de pantalla dejaría de anunciarla como tabla
          justo en el dispositivo donde más se depende de él. */}
      <table
        role="table"
        data-tarjetas={tarjetasEnMovil ? 'true' : undefined}
        className={cn('w-full border-collapse text-left', className)}
      >
        <caption
          className={cn(
            'text-cuerpo-sm text-terciario px-4 py-2 text-left',
            !mostrarTitulo && 'solo-lectores',
          )}
        >
          {titulo}
        </caption>
        {children}
      </table>
    </div>
  );
}

export function TablaEncabezado({ children }: { children: ReactNode }) {
  return (
    <thead role="rowgroup" className="bg-navegacion sticky top-0 z-10">
      <tr role="row">{children}</tr>
    </thead>
  );
}

export interface PropsTh extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Alinea a la derecha y activa cifras tabulares en la columna. */
  numerico?: boolean;
}

export function Th({ numerico, className, children, ...resto }: PropsTh) {
  return (
    <th
      role="columnheader"
      scope="col"
      data-numerico={numerico ? 'true' : undefined}
      className={cn(
        'text-titulillo text-terciario px-4 py-3 font-semibold tracking-[0.08em] uppercase',
        'border-borde-sutil border-b',
        className,
      )}
      {...resto}
    >
      {children}
    </th>
  );
}

export function TablaCuerpo({ children }: { children: ReactNode }) {
  return <tbody role="rowgroup">{children}</tbody>;
}

export function Tr({
  className,
  interactiva = false,
  ...resto
}: React.HTMLAttributes<HTMLTableRowElement> & { interactiva?: boolean }) {
  return (
    <tr
      role="row"
      className={cn(
        'border-borde-sutil h-12 border-b',
        interactiva &&
          'hover:bg-elevado cursor-pointer transition-colors duration-[var(--movimiento-rapido)]',
        className,
      )}
      {...resto}
    />
  );
}

export interface PropsTd extends TdHTMLAttributes<HTMLTableCellElement> {
  numerico?: boolean;
  /**
   * Nombre de la columna. En móvil se muestra a la izquierda del valor, porque
   * el encabezado de la tabla deja de verse. Debe coincidir con el `Th`
   * correspondiente.
   */
  etiqueta?: string;
}

export function Td({ numerico, etiqueta, className, children, ...resto }: PropsTd) {
  return (
    <td
      role="cell"
      data-numerico={numerico ? 'true' : undefined}
      data-etiqueta={etiqueta}
      className={cn('text-cuerpo text-principal px-4 py-2', className)}
      {...resto}
    >
      {children}
    </td>
  );
}

/** Fila que ocupa toda la tabla: para el estado vacio o un mensaje de error. */
export function TdCompleta({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr role="row">
      <td role="cell" colSpan={colSpan} className="p-0">
        {children}
      </td>
    </tr>
  );
}
