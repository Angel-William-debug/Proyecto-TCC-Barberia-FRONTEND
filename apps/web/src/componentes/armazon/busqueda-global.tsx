import { Icono } from '@barber-shop/ui';

/**
 * Caja de búsqueda del encabezado (vista 94; 15/10/2026). Un formulario GET
 * común: funciona sin JavaScript y el resultado queda en la dirección, así se
 * puede volver atrás a la búsqueda.
 */
export function BusquedaGlobal() {
  return (
    <form action="/panel/buscar" method="get" role="search" className="relative hidden md:block">
      <label htmlFor="busqueda-global" className="solo-lectores">
        Buscar en todo el sistema
      </label>
      <Icono
        nombre="search"
        tamano="sm"
        className="text-terciario pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
      />
      <input
        id="busqueda-global"
        name="q"
        type="search"
        placeholder="Buscar en el sistema…"
        className="border-borde-control bg-fondo text-cuerpo-sm text-principal placeholder:text-terciario focus-visible:ring-marca h-9 w-64 rounded-md border pr-3 pl-8 focus-visible:ring-2 focus-visible:outline-none"
      />
    </form>
  );
}
