import type { ReactNode } from 'react';

/**
 * Encabezado comun de toda vista interna (seccion 6.5).
 *
 * Contiene el unico H1 de la pantalla y, como maximo, una accion primaria.
 * Que sea un componente y no un fragmento repetido es lo que garantiza que
 * las 104 vistas empiecen igual.
 */
export function EncabezadoVista({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-titulo-1 text-principal font-semibold">{titulo}</h1>
        {descripcion && <p className="text-cuerpo text-terciario mt-1">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}
