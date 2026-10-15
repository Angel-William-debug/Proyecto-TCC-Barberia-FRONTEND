'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useTransition } from 'react';

import { MODO_DEMO } from '@barber-shop/api/demo';
import type { TipoReporte } from '@barber-shop/api';
import { Icono, cn } from '@barber-shop/ui';

import { enviarReportePorCorreoAccion } from '@/acciones/reportes';
import { fecha, texto, type Parametros } from '@/lib/filtros';

type EstadoEnvio =
  | { fase: 'inactivo' }
  | { fase: 'enviando' }
  | { fase: 'enviado'; email: string }
  | { fase: 'error'; mensaje: string };

type EstadoDescarga =
  | { fase: 'inactivo' }
  | { fase: 'descargando'; href: string }
  | { fase: 'error'; href: string; mensaje: string };

/**
 * Un solo botón "Exportar", con un menú desplegable para Excel, PDF y —si el
 * panel lo tiene— los PDFs individuales en lote. Antes eran dos o tres
 * botones sueltos uno al lado del otro; con más de dos opciones (varios
 * paneles ya suman la tercera) eso se veía como una fila de botones sin
 * relación entre sí, en vez de una sola acción con variantes.
 *
 * Mismo patrón de `<details>` + cierre al clickear afuera que ya usa
 * `SelectorServicios` en el formulario de reserva del portal — no se suma
 * una librería de menús nueva para esto.
 *
 * No hay lógica de exportación acá: apunta a la misma ruta genérica que ya
 * usa la pantalla de Reportes (`/panel/reportes/exportar`), y a la ruta de
 * PDFs individuales que cada panel ya tenía resuelta por su cuenta.
 */
export function BotonExportar({
  tipo,
  searchParams,
  individual,
}: {
  tipo: TipoReporte;
  searchParams?: Parametros;
  /** Si el panel genera PDFs en lote (opción A), la ruta que los arma. */
  individual?: { href: string; etiqueta?: string };
}) {
  const contenedor = useRef<HTMLDetailsElement>(null);
  const [estadoEnvio, setEstadoEnvio] = useState<EstadoEnvio>({ fase: 'inactivo' });
  const [enviando, iniciarEnvio] = useTransition();
  const [descarga, setDescarga] = useState<EstadoDescarga>({ fase: 'inactivo' });

  // Cierra al hacer clic fuera. `<details>` no lo hace por su cuenta.
  useEffect(() => {
    function alClicar(evento: MouseEvent) {
      const nodo = contenedor.current;
      if (nodo?.open && !nodo.contains(evento.target as Node)) nodo.open = false;
    }
    document.addEventListener('mousedown', alClicar);
    return () => document.removeEventListener('mousedown', alClicar);
  }, []);

  if (MODO_DEMO) {
    return (
      <p className="text-cuerpo-sm text-terciario">
        La exportación no está disponible en modo demostración.
      </p>
    );
  }

  const query = new URLSearchParams();
  query.set('tipo', tipo);
  const desde = searchParams && fecha(searchParams, 'desde');
  const hasta = searchParams && fecha(searchParams, 'hasta');
  const busqueda = searchParams && texto(searchParams, 'q');
  if (desde) query.set('desde', desde);
  if (hasta) query.set('hasta', hasta);
  if (busqueda) query.set('q', busqueda);

  function cerrar() {
    if (contenedor.current) contenedor.current.open = false;
  }

  /**
   * Descarga con `fetch` en vez de navegar (vista 99, 15/10/2026). Antes un
   * fallo de la exportación dejaba al usuario en una página en blanco con el
   * texto del error; ahora el error queda en el menú, con «Reintentar».
   */
  async function descargar(href: string) {
    setDescarga({ fase: 'descargando', href });
    try {
      const respuesta = await fetch(href);
      if (!respuesta.ok) {
        const texto = (await respuesta.text()).slice(0, 200);
        setDescarga({ fase: 'error', href, mensaje: texto || 'No se pudo generar el archivo.' });
        return;
      }
      const nombre =
        /filename="([^"]+)"/.exec(respuesta.headers.get('Content-Disposition') ?? '')?.[1] ?? 'reporte';
      const url = URL.createObjectURL(await respuesta.blob());
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(url);
      setDescarga({ fase: 'inactivo' });
      cerrar();
    } catch {
      setDescarga({
        fase: 'error',
        href,
        mensaje: 'No se pudo conectar con el servidor. Revise su conexión.',
      });
    }
  }

  function enviarPorCorreo() {
    setEstadoEnvio({ fase: 'enviando' });
    iniciarEnvio(async () => {
      const r = await enviarReportePorCorreoAccion(tipo, {
        desde: desde || undefined,
        hasta: hasta || undefined,
        busqueda: busqueda || undefined,
      });
      setEstadoEnvio(r.ok ? { fase: 'enviado', email: r.email } : { fase: 'error', mensaje: r.error });
    });
  }

  return (
    <details ref={contenedor} className="relative inline-block">
      <summary
        className={cn(
          'border-borde-control text-principal text-cuerpo-sm font-medium',
          'inline-flex h-9 cursor-pointer list-none items-center gap-1.5',
          'rounded-md border px-3 select-none',
          'hover:bg-elevado',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        <Icono nombre="download" tamano="sm" />
        Exportar
        <Icono nombre="chevron-down" tamano="xs" className="text-terciario" />
      </summary>

      <div
        role="menu"
        className={cn(
          'bg-elevado border-borde-sutil absolute right-0 z-20 mt-1 w-60',
          'rounded-md border p-1 shadow-2',
        )}
      >
        <ItemMenu
          href={`/panel/reportes/exportar?${query.toString()}&formato=excel`}
          icono="file-spreadsheet"
          etiqueta="Descargar Excel"
          onDescargar={descargar}
          ocupado={descarga.fase === 'descargando'}
        />
        <ItemMenu
          href={`/panel/reportes/exportar?${query.toString()}&formato=pdf`}
          icono="file-text"
          etiqueta="Descargar PDF"
          onDescargar={descargar}
          ocupado={descarga.fase === 'descargando'}
        />

        <button
          type="button"
          role="menuitem"
          disabled={enviando}
          onClick={enviarPorCorreo}
          className={cn(
            'text-cuerpo-sm text-principal flex w-full items-center gap-2.5',
            'rounded-sm px-2.5 py-2 text-left hover:bg-superficie',
            'disabled:pointer-events-none disabled:opacity-60',
          )}
        >
          <Icono
            nombre={enviando ? 'loader-circle' : 'mail'}
            tamano="sm"
            className={cn('text-terciario shrink-0', enviando && 'animate-spin')}
          />
          {enviando ? 'Enviando…' : 'Enviar por correo'}
        </button>
        {estadoEnvio.fase === 'enviado' && (
          <p className="text-exito text-cuerpo-sm px-2.5 py-1">Enviado a {estadoEnvio.email}</p>
        )}
        {descarga.fase === 'descargando' && (
          <p className="text-secundario text-cuerpo-sm px-2.5 py-1">Generando el archivo…</p>
        )}
        {descarga.fase === 'error' && (
          <div role="alert" className="px-2.5 py-1">
            <p className="text-peligro text-cuerpo-sm">No se pudo exportar: {descarga.mensaje}</p>
            <button
              type="button"
              onClick={() => descargar(descarga.href)}
              className="text-marca text-cuerpo-sm mt-1 font-medium"
            >
              Reintentar
            </button>
          </div>
        )}
        {estadoEnvio.fase === 'error' && (
          <p className="text-peligro text-cuerpo-sm px-2.5 py-1">{estadoEnvio.mensaje}</p>
        )}

        {individual && (
          <>
            <div className="bg-borde-sutil my-1 h-px" />
            <ItemMenu
              href={individual.href}
              icono="file-archive"
              etiqueta={individual.etiqueta ?? 'PDFs individuales (.zip)'}
              onDescargar={descargar}
              ocupado={descarga.fase === 'descargando'}
            />
          </>
        )}
      </div>
    </details>
  );
}

function ItemMenu({
  href,
  icono,
  etiqueta,
  onDescargar,
  ocupado,
}: {
  href: string;
  icono: 'file-spreadsheet' | 'file-text' | 'file-archive';
  etiqueta: string;
  onDescargar: (href: string) => void;
  ocupado: boolean;
}) {
  // Sigue siendo un enlace -se puede abrir en otra pestaña o copiar-, pero el
  // clic normal descarga por fetch para poder mostrar el error y reintentar.
  return (
    <Link
      href={href}
      role="menuitem"
      aria-disabled={ocupado || undefined}
      onClick={(evento) => {
        evento.preventDefault();
        if (!ocupado) onDescargar(href);
      }}
      className={cn(
        'text-cuerpo-sm text-principal flex items-center gap-2.5',
        'rounded-sm px-2.5 py-2 hover:bg-superficie',
        ocupado && 'pointer-events-none opacity-60',
      )}
    >
      <Icono nombre={icono} tamano="sm" className="text-terciario shrink-0" />
      {etiqueta}
    </Link>
  );
}
