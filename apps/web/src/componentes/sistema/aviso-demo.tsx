import { Icono } from '@barber-shop/ui';

/**
 * Aviso permanente del modo demostración.
 *
 * No es decorativo ni se puede cerrar. Un panel que muestra cifras de
 * facturación sin aclarar que son inventadas induce a error, y estas capturas
 * van a terminar en un documento académico.
 */
export function AvisoDemo() {
  return (
    <div
      role="status"
      className="bg-[var(--chip-advertencia-fondo)] text-advertencia flex items-center justify-center gap-2 px-6 py-2"
    >
      <Icono nombre="triangle-alert" tamano="xs" />
      <p className="text-cuerpo-sm font-medium">
        Modo demostración: todos los datos de esta pantalla son ficticios. No hay conexión con la
        base de datos.
      </p>
    </div>
  );
}
