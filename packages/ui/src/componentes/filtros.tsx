'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

import { Icono } from './icono';
import { Boton } from './boton';
import { cn } from '../utilidades';

/**
 * Sección 9.9 del Sistema de Diseño: filtros de tabla.
 *
 * Toda tabla del sistema filtra con estas mismas piezas. No porque sea más
 * cómodo, sino porque un usuario que aprendió a filtrar la agenda tiene que
 * saber filtrar el inventario sin volver a aprender nada.
 *
 * EL ESTADO VIVE EN LA URL, no en `useState`. Consecuencias, todas buenas:
 *
 *   - Un listado filtrado se comparte pegando el enlace.
 *   - El botón Atrás del navegador deshace el último filtro.
 *   - El componente de servidor lee `searchParams` y consulta ya filtrado, en
 *     lugar de traer todo y descartar en el navegador.
 *   - Recargar la página no pierde el trabajo.
 *
 * Convención de nombres de parámetro, igual en las diez pantallas:
 *
 *   q         búsqueda de texto libre
 *   estado    valores múltiples separados por coma
 *   desde     fecha inicial, aaaa-MM-dd
 *   hasta     fecha final, aaaa-MM-dd
 *   pagina    número de página, base 1
 */

// ---------------------------------------------------------------------------
// Escritura de la URL
// ---------------------------------------------------------------------------

function useFiltros() {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();

  /**
   * Aplica cambios y navega. Un valor vacío o nulo BORRA el parámetro: dejar
   * `?estado=` en la barra de direcciones ensucia el enlace y complica la
   * lectura del lado del servidor.
   */
  const aplicar = useCallback(
    (cambios: Record<string, string | null>) => {
      const siguientes = new URLSearchParams(params.toString());

      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor === null || valor === '') siguientes.delete(clave);
        else siguientes.set(clave, valor);
      }

      // Cambiar un filtro siempre vuelve a la primera página. Quedarse en la
      // página 4 de un resultado que ahora tiene una sola es desconcertante.
      if (!('pagina' in cambios)) siguientes.delete('pagina');

      const consulta = siguientes.toString();
      router.push(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
    },
    [params, router, ruta],
  );

  const limpiar = useCallback(() => {
    router.push(ruta, { scroll: false });
  }, [router, ruta]);

  return { params, aplicar, limpiar };
}

// ---------------------------------------------------------------------------
// Contenedor
// ---------------------------------------------------------------------------

/**
 * Barra de filtros. Va siempre en la cabecera de la tarjeta que contiene la
 * tabla, separada por un borde inferior.
 */
export function BarraFiltros({ children }: { children: ReactNode }) {
  return (
    <div className="border-borde-sutil flex flex-wrap items-end gap-3 border-b p-4">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Búsqueda de texto
// ---------------------------------------------------------------------------

export interface PropsCampoBusqueda {
  /** Nombre del parámetro en la URL. Por convención, `q`. */
  nombre?: string;
  placeholder: string;
  etiqueta?: string;
}

/**
 * Búsqueda libre. Espera 400 ms desde la última tecla antes de navegar: sin
 * esa demora, escribir «González» dispararía ocho consultas.
 */
export function CampoBusqueda({
  nombre = 'q',
  placeholder,
  etiqueta = 'Buscar',
}: PropsCampoBusqueda) {
  const { params, aplicar } = useFiltros();
  const id = useId();
  const valorUrl = params.get(nombre) ?? '';
  const [texto, setTexto] = useState(valorUrl);
  const primeraVez = useRef(true);

  // Sincroniza cuando la URL cambia por fuera: botón Atrás, o «Limpiar todo».
  useEffect(() => {
    setTexto(valorUrl);
  }, [valorUrl]);

  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    if (texto === valorUrl) return;

    const temporizador = setTimeout(() => aplicar({ [nombre]: texto.trim() || null }), 400);
    return () => clearTimeout(temporizador);
    // `aplicar` y `valorUrl` cambian en cada render de la navegación; incluirlos
    // reiniciaría el temporizador y la búsqueda nunca se dispararía.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  return (
    <div className="flex min-w-[16rem] flex-1 flex-col gap-2 sm:max-w-sm">
      <label htmlFor={id} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
      </label>
      <div className="relative flex items-center">
        <span className="text-terciario pointer-events-none absolute left-3">
          <Icono nombre="search" tamano="sm" />
        </span>
        <input
          id={id}
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'bg-fondo border-borde-control text-principal placeholder:text-terciario',
            'text-cuerpo h-10 w-full rounded-md border pr-3 pl-9',
          )}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selector simple
// ---------------------------------------------------------------------------

export interface Opcion {
  valor: string;
  etiqueta: string;
}

export interface PropsSelectorFiltro {
  nombre: string;
  etiqueta: string;
  opciones: Opcion[];
  /** Texto de la opción que no filtra nada. */
  textoTodos?: string;
}

/**
 * Desplegable de opción única.
 *
 * Usa un `<select>` nativo a propósito. Un desplegable propio se ve más
 * moderno y funciona peor: el nativo ya trae navegación por teclado, búsqueda
 * escribiendo la inicial, y en el teléfono abre la rueda del sistema, que es
 * mucho más cómoda que una lista flotante.
 */
export function SelectorFiltro({
  nombre,
  etiqueta,
  opciones,
  textoTodos = 'Todos',
}: PropsSelectorFiltro) {
  const { params, aplicar } = useFiltros();
  const id = useId();
  const valor = params.get(nombre) ?? '';

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-etiqueta text-secundario font-medium">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e) => aplicar({ [nombre]: e.target.value || null })}
        className={cn(
          'bg-fondo border-borde-control text-principal',
          'text-cuerpo h-10 min-w-[10rem] rounded-md border px-3',
        )}
      >
        <option value="">{textoTodos}</option>
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.etiqueta}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selector múltiple
// ---------------------------------------------------------------------------

export interface PropsSelectorMultiple {
  nombre: string;
  etiqueta: string;
  opciones: Opcion[];
}

/**
 * Selección múltiple. Los valores viajan en un solo parámetro separados por
 * coma: `?estado=pendiente,confirmado`.
 *
 * Se apoya en `<details>` y `<summary>` nativos para abrir y cerrar. Eso
 * resuelve gratis el foco, la tecla Escape y el anuncio del estado
 * abierto/cerrado a los lectores de pantalla, que es justamente lo que suele
 * quedar mal en los desplegables hechos a mano.
 */
export function SelectorMultiple({ nombre, etiqueta, opciones }: PropsSelectorMultiple) {
  const { params, aplicar } = useFiltros();
  const contenedor = useRef<HTMLDetailsElement>(null);

  const crudo = params.get(nombre) ?? '';
  const elegidos = crudo ? crudo.split(',').filter(Boolean) : [];

  // Cierra al hacer clic fuera. `<details>` no lo hace por su cuenta.
  useEffect(() => {
    function alClicar(evento: MouseEvent) {
      const nodo = contenedor.current;
      if (nodo?.open && !nodo.contains(evento.target as Node)) nodo.open = false;
    }
    document.addEventListener('mousedown', alClicar);
    return () => document.removeEventListener('mousedown', alClicar);
  }, []);

  function alternar(valor: string) {
    const siguiente = elegidos.includes(valor)
      ? elegidos.filter((v) => v !== valor)
      : [...elegidos, valor];
    aplicar({ [nombre]: siguiente.length ? siguiente.join(',') : null });
  }

  const resumen =
    elegidos.length === 0
      ? 'Todos'
      : elegidos.length === 1
        ? (opciones.find((o) => o.valor === elegidos[0])?.etiqueta ?? '1 elegido')
        : `${elegidos.length} elegidos`;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario font-medium">{etiqueta}</span>
      <details ref={contenedor} className="relative">
        <summary
          className={cn(
            'bg-fondo border-borde-control text-principal text-cuerpo',
            'flex h-10 min-w-[10rem] cursor-pointer list-none items-center justify-between gap-2',
            'rounded-md border px-3 select-none',
            '[&::-webkit-details-marker]:hidden',
            elegidos.length > 0 && 'border-borde-foco',
          )}
        >
          <span className={elegidos.length === 0 ? 'text-terciario' : undefined}>{resumen}</span>
          <Icono nombre="chevron-down" tamano="sm" className="text-terciario" />
        </summary>

        <div
          className={cn(
            'bg-elevado border-borde-sutil absolute z-20 mt-1 min-w-full',
            'max-h-72 overflow-y-auto rounded-md border p-1 shadow-2',
          )}
        >
          {opciones.map((o) => {
            const marcado = elegidos.includes(o.valor);
            return (
              <label
                key={o.valor}
                className={cn(
                  'text-cuerpo text-principal flex cursor-pointer items-center gap-2.5',
                  'hover:bg-superficie rounded-sm px-2 py-2 whitespace-nowrap',
                )}
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => alternar(o.valor)}
                  className="accent-[var(--marca)] h-4 w-4"
                />
                {o.etiqueta}
              </label>
            );
          })}
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rango de fechas
// ---------------------------------------------------------------------------

/** Atajos del rango de fechas. Cubren el 90 % de las consultas reales. */
const ATAJOS: Array<{ clave: string; etiqueta: string; dias: number }> = [
  { clave: 'hoy', etiqueta: 'Hoy', dias: 0 },
  { clave: '7', etiqueta: 'Últimos 7 días', dias: 6 },
  { clave: '30', etiqueta: 'Últimos 30 días', dias: 29 },
  { clave: '90', etiqueta: 'Últimos 90 días', dias: 89 },
];

function aIso(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(fecha);
}

export interface PropsRangoFechas {
  etiqueta?: string;
  nombreDesde?: string;
  nombreHasta?: string;
}

/**
 * Rango de fechas con atajos.
 *
 * Los campos son `<input type="date">` nativos: el selector del sistema ya
 * está traducido, respeta el formato local y funciona con teclado. Uno propio
 * costaría cientos de líneas para quedar peor.
 */
export function RangoFechas({
  etiqueta = 'Período',
  nombreDesde = 'desde',
  nombreHasta = 'hasta',
}: PropsRangoFechas) {
  const { params, aplicar } = useFiltros();
  const idDesde = useId();
  const idHasta = useId();

  const desde = params.get(nombreDesde) ?? '';
  const hasta = params.get(nombreHasta) ?? '';

  function aplicarAtajo(dias: number) {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(fin.getDate() - dias);
    aplicar({ [nombreDesde]: aIso(inicio), [nombreHasta]: aIso(fin) });
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario font-medium">{etiqueta}</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={idDesde}
          type="date"
          value={desde}
          max={hasta || undefined}
          aria-label={`${etiqueta}: desde`}
          onChange={(e) => aplicar({ [nombreDesde]: e.target.value || null })}
          className="bg-fondo border-borde-control text-principal text-cuerpo h-10 rounded-md border px-3"
        />
        <span className="text-terciario text-cuerpo-sm">a</span>
        <input
          id={idHasta}
          type="date"
          value={hasta}
          min={desde || undefined}
          aria-label={`${etiqueta}: hasta`}
          onChange={(e) => aplicar({ [nombreHasta]: e.target.value || null })}
          className="bg-fondo border-borde-control text-principal text-cuerpo h-10 rounded-md border px-3"
        />

        <div className="flex flex-wrap gap-1">
          {ATAJOS.map((a) => (
            <button
              key={a.clave}
              type="button"
              onClick={() => aplicarAtajo(a.dias)}
              className={cn(
                'text-cuerpo-sm text-secundario hover:bg-elevado hover:text-principal',
                'h-8 rounded-md px-2.5 whitespace-nowrap',
              )}
            >
              {a.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resumen de filtros activos
// ---------------------------------------------------------------------------

export interface PropsFiltrosActivos {
  /** Traduce el nombre del parámetro y su valor a algo legible. */
  etiquetas: Record<string, { titulo: string; valores?: Record<string, string> }>;
  /** Cuántas filas quedaron. Se muestra junto a los chips. */
  total?: number;
  sustantivo?: [singular: string, plural: string];
}

/**
 * Chips de lo que está filtrado, con la cruz para quitar cada uno.
 *
 * No es un adorno: sin este resumen, alguien que dejó un filtro puesto y
 * vuelve media hora después ve una tabla «vacía» y cree que se perdieron los
 * datos. Es el mismo motivo por el que el estado vacío distingue «no hay
 * nada» de «no hay coincidencias».
 */
export function FiltrosActivos({
  etiquetas,
  total,
  sustantivo = ['resultado', 'resultados'],
}: PropsFiltrosActivos) {
  const { params, aplicar, limpiar } = useFiltros();

  const activos: Array<{ clave: string; texto: string }> = [];

  for (const [clave, config] of Object.entries(etiquetas)) {
    const crudo = params.get(clave);
    if (!crudo) continue;

    const partes = crudo.split(',').filter(Boolean);
    const legible = partes.map((p) => config.valores?.[p] ?? p).join(', ');
    activos.push({ clave, texto: `${config.titulo}: ${legible}` });
  }

  if (activos.length === 0) return null;

  return (
    <div className="border-borde-sutil flex flex-wrap items-center gap-2 border-b px-4 py-3">
      {total !== undefined && (
        <span className="text-cuerpo-sm text-secundario mr-1">
          {total} {total === 1 ? sustantivo[0] : sustantivo[1]}
        </span>
      )}

      {activos.map((a) => (
        <button
          key={a.clave}
          type="button"
          onClick={() => aplicar({ [a.clave]: null })}
          className={cn(
            'bg-[var(--chip-marca-fondo)] text-[var(--chip-marca-texto)]',
            'text-etiqueta inline-flex h-6 items-center gap-1.5 rounded-sm px-2 font-medium',
            'hover:opacity-80',
          )}
        >
          {a.texto}
          <Icono nombre="x" tamano="xs" etiqueta={`Quitar filtro ${a.texto}`} />
        </button>
      ))}

      <Boton variante="terciario" tamano="sm" onClick={limpiar}>
        Limpiar todo
      </Boton>
    </div>
  );
}
