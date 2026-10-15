import Link from 'next/link';
import { redirect } from 'next/navigation';

import {
  listarClientes,
  listarProductosConNivel,
  listarProfesionales,
  listarServicios,
  usuarioActual,
} from '@barber-shop/api';
import { MODULOS_POR_ROL } from '@barber-shop/tipos';
import {
  EstadoVacio,
  Icono,
  Tarjeta,
  TarjetaEncabezado,
  cantidad,
  duracion,
  guaranies,
  plural,
  type NombreIcono,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';

export const metadata = { title: 'Búsqueda' };

interface Resultado {
  titulo: string;
  detalle: string;
  href: string;
}

/**
 * Búsqueda global (vista 94 del anexo; 15/10/2026).
 *
 * Una sola caja, en el encabezado, que busca a la vez en clientes, servicios,
 * productos y barberos. Cada grupo aparece solo si el rol tiene ese módulo:
 * no tiene sentido ofrecerle a alguien un resultado que no puede abrir.
 */
export default async function PaginaBuscar({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const usuario = await usuarioActual();
  if (!usuario) redirect('/ingresar');
  const q = (await searchParams).q?.trim() ?? '';
  const puede = new Set(MODULOS_POR_ROL[usuario.rol]);

  const vacio = Promise.resolve([] as Resultado[]);
  const [clientes, servicios, productos, barberos] =
    q.length < 2
      ? [[], [], [], []]
      : await Promise.all([
          puede.has('clientes')
            ? listarClientes({ busqueda: q })
                .then((p) =>
                  p.datos.map((c) => ({
                    titulo: c.nombre,
                    detalle: [c.telefono, c.email].filter(Boolean).join(' · '),
                    href: `/panel/clientes/${c.id_cliente}`,
                  })),
                )
                .catch(() => [])
            : vacio,
          puede.has('servicios')
            ? listarServicios({ busqueda: q })
                .then((f) =>
                  f.map((s) => ({
                    titulo: s.nombre,
                    detalle: `${duracion(s.duracion_min)} · ${guaranies(s.precio_base)}`,
                    href: `/panel/servicios?q=${encodeURIComponent(s.nombre)}`,
                  })),
                )
                .catch(() => [])
            : vacio,
          puede.has('inventario')
            ? listarProductosConNivel({ busqueda: q })
                .then((f) =>
                  f.map((p) => ({
                    titulo: p.nombre,
                    detalle: `Stock ${cantidad(p.stock_actual)}`,
                    href: `/panel/inventario?q=${encodeURIComponent(p.nombre)}`,
                  })),
                )
                .catch(() => [])
            : vacio,
          puede.has('profesionales')
            ? listarProfesionales({ busqueda: q })
                .then((f) =>
                  f.map((b) => ({
                    titulo: b.nombre,
                    detalle: b.especialidad ?? 'Barbero',
                    href: `/panel/barberos/${b.id_profesional}`,
                  })),
                )
                .catch(() => [])
            : vacio,
        ]);

  const grupos: Array<{ titulo: string; icono: NombreIcono; filas: Resultado[] }> = [
    { titulo: 'Clientes', icono: 'user-round' as NombreIcono, filas: clientes },
    { titulo: 'Servicios', icono: 'sparkles' as NombreIcono, filas: servicios },
    { titulo: 'Productos', icono: 'package' as NombreIcono, filas: productos },
    { titulo: 'Barberos', icono: 'scissors' as NombreIcono, filas: barberos },
  ].filter((g) => g.filas.length > 0);
  const total = grupos.reduce((n, g) => n + g.filas.length, 0);

  return (
    <>
      <EncabezadoVista
        titulo="Búsqueda"
        descripcion={
          q.length < 2
            ? 'Escriba al menos dos letras en la caja del encabezado.'
            : `${plural(total, 'resultado', 'resultados')} para «${q}»`
        }
      />

      {/* En el teléfono la caja del encabezado no entra: se ofrece acá. */}
      <form action="/panel/buscar" method="get" role="search" className="mb-6 md:hidden">
        <label htmlFor="busqueda-movil" className="solo-lectores">
          Buscar
        </label>
        <input
          id="busqueda-movil"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Cliente, servicio, producto…"
          className="border-borde-control bg-fondo text-cuerpo text-principal h-10 w-full rounded-md border px-3"
        />
      </form>

      {q.length >= 2 && total === 0 ? (
        <Tarjeta>
          <EstadoVacio
            icono="search"
            titulo="Sin resultados"
            descripcion="Pruebe con menos letras, o con el teléfono si busca un cliente."
          />
        </Tarjeta>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {grupos.map((g) => (
            <Tarjeta key={g.titulo}>
              <TarjetaEncabezado titulo={g.titulo} descripcion={plural(g.filas.length, 'resultado', 'resultados')} />
              <ul className="divide-borde-sutil divide-y px-4 pb-2 sm:px-6">
                {g.filas.slice(0, 10).map((r) => (
                  <li key={r.href + r.titulo}>
                    <Link href={r.href} className="hover:bg-elevado -mx-2 flex items-center gap-3 rounded-md px-2 py-2.5">
                      <Icono nombre={g.icono} tamano="sm" className="text-terciario" />
                      <span className="min-w-0">
                        <span className="text-cuerpo text-principal block truncate">{r.titulo}</span>
                        {r.detalle && <span className="text-cuerpo-sm text-terciario block truncate">{r.detalle}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Tarjeta>
          ))}
        </div>
      )}
    </>
  );
}
