import Link from 'next/link';

import type { NombreRol } from '@barber-shop/tipos';
import { Boton, Icono, type NombreIcono } from '@barber-shop/ui';

import { ROLES_AYUDA, etiquetaRol, seccionesPara } from '@/lib/ayuda';

import { BuscadorAyuda } from './buscador-ayuda';

const PRESENTACION: Record<NombreRol, string> = {
  administrador:
    'Todo lo que se hace en el sistema: la operación del mostrador, los catálogos, las compras, las comisiones, los informes y la configuración.',
  recepcionista: 'Lo que se usa en el mostrador: la agenda, los cobros, los clientes, el inventario y los avisos.',
  profesional: 'Su día, la agenda del equipo, sus comisiones y el ranking.',
  cliente: 'Cómo reservar, ver y cancelar sus turnos, calificar la atención y usar la app.',
};

const EJEMPLO_BUSQUEDA: Record<NombreRol, string> = {
  administrador: 'Por ejemplo: liquidar, orden de compra, crear usuario',
  recepcionista: 'Por ejemplo: cancelar un turno, cobrar, ajustar stock',
  profesional: 'Por ejemplo: comisiones, contraseña, agenda',
  cliente: 'Por ejemplo: reservar, cancelar, contraseña',
};

/**
 * La portada del centro de ayuda: buscador y, debajo, las secciones del
 * manual del rol con sus artículos. La usan el panel y el portal; cambian la
 * ruta base y el título.
 */
export function CentroAyuda({
  rol,
  rolSesion,
  base,
  titulo,
}: {
  /** De qué rol es el manual que se muestra. */
  rol: NombreRol;
  /** El rol de quien mira: el administrador puede cambiar de manual. */
  rolSesion: NombreRol;
  base: string;
  titulo: React.ReactNode;
}) {
  const secciones = seccionesPara(rol);
  const sufijoRol = rol === rolSesion ? '' : `?rol=${rol}`;
  const total = secciones.reduce((s, x) => s + x.articulos.length, 0);

  const entradas = secciones.flatMap((s) =>
    s.articulos.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      resumen: a.resumen,
      categoria: s.categoria.titulo,
      palabras: a.palabras ?? [],
    })),
  );

  return (
    <>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {titulo}
          <p className="text-cuerpo text-terciario medida-lectura mt-1">
            {rol === rolSesion ? '' : `Manual de: ${etiquetaRol(rol)}. `}
            {PRESENTACION[rol]} {total} artículos.
          </p>
        </div>
        {/* Un enlace y no un botón con JavaScript: el PDF se genera en el
            servidor y el navegador lo abre o lo guarda como cualquier archivo. */}
        <a href={`${base}/pdf${sufijoRol}`} target="_blank" rel="noopener">
          <Boton variante="secundario" icono="download">
            Descargar manual (PDF)
          </Boton>
        </a>
      </div>

      {rolSesion === 'administrador' && (
        <nav aria-label="Manual de otro rol" className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-cuerpo-sm text-terciario mr-1">Ver el manual de:</span>
          {ROLES_AYUDA.map((r) => (
            <Link
              key={r}
              href={r === rolSesion ? base : `${base}?rol=${r}`}
              aria-current={r === rol ? 'page' : undefined}
              className={
                r === rol
                  ? 'bg-marca text-sobre-marca text-cuerpo-sm rounded-full px-3 py-1 font-medium'
                  : 'border-borde-sutil text-secundario hover:border-borde-control text-cuerpo-sm rounded-full border px-3 py-1'
              }
            >
              {etiquetaRol(r)}
            </Link>
          ))}
        </nav>
      )}

      <BuscadorAyuda entradas={entradas} base={base} ejemplo={EJEMPLO_BUSQUEDA[rol]}>
        <div className="grid gap-4 lg:grid-cols-2">
          {secciones.map(({ categoria, articulos }) => (
            <section
              key={categoria.id}
              aria-labelledby={`seccion-${categoria.id}`}
              className="border-borde-sutil bg-superficie rounded-lg border p-5"
            >
              <div className="mb-3 flex items-start gap-3">
                <span
                  className="bg-elevado text-marca flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                  aria-hidden="true"
                >
                  <Icono nombre={categoria.icono as NombreIcono} tamano="sm" />
                </span>
                <div>
                  <h2 id={`seccion-${categoria.id}`} className="text-titulo-3 text-principal font-semibold">
                    {categoria.titulo}
                  </h2>
                  <p className="text-cuerpo-sm text-terciario">{categoria.descripcion}</p>
                </div>
              </div>
              <ul className="space-y-1">
                {articulos.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`${base}/${a.id}${sufijoRol}`}
                      className="text-secundario hover:text-marca hover:bg-elevado -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors"
                    >
                      <span>{a.titulo}</span>
                      <Icono nombre="chevron-right" tamano="sm" className="text-terciario shrink-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </BuscadorAyuda>
    </>
  );
}
