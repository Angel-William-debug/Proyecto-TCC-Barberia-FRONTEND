'use client';

import { useState, useTransition } from 'react';

import type { EstadisticaServicio } from '@barber-shop/api';
import type { Servicio } from '@barber-shop/tipos';
import {
  BotonIcono,
  ChipEstado,
  Esqueleto,
  GrupoCampos,
  PanelLateral,
  duracion,
  fechaCorta,
  guaranies,
  plural,
} from '@barber-shop/ui';

import { obtenerEstadisticaServicio } from '@/acciones/servicios';

/**
 * Detalle del servicio (vista 32 del anexo; 15/10/2026): la ficha completa y
 * cuánto se hizo en los últimos 90 días, con quién lo hace más. La receta
 * sigue en su propio botón de la fila.
 */
export function PanelDetalleServicio({
  servicio,
  categoria,
}: {
  servicio: Servicio;
  categoria: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [datos, setDatos] = useState<EstadisticaServicio | null>(null);
  const [cargando, iniciar] = useTransition();

  function abrir() {
    setAbierto(true);
    iniciar(async () => setDatos(await obtenerEstadisticaServicio(servicio.id_servicio)));
  }

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver el detalle de ${servicio.nombre}`}
        variante="terciario"
        tamano="sm"
        onClick={abrir}
      />
      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={servicio.nombre}
        descripcion={categoria ?? 'Sin categoría'}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <ChipEstado
              presentacion={
                servicio.estado
                  ? { etiqueta: 'Activo', tono: 'exito', icono: 'circle-check' }
                  : { etiqueta: 'Inactivo', tono: 'neutro', icono: 'ban' }
              }
            />
            <span className="text-cuerpo text-principal tabular-nums">
              {duracion(servicio.duracion_min)} · {guaranies(servicio.precio_base)}
            </span>
          </div>

          {servicio.descripcion && (
            <GrupoCampos titulo="Descripción">
              <p className="text-cuerpo-sm text-secundario">{servicio.descripcion}</p>
            </GrupoCampos>
          )}

          <GrupoCampos titulo="Últimos 90 días">
            {!datos ? (
              cargando ? (
                <Esqueleto className="h-20 w-full" />
              ) : (
                <p className="text-cuerpo-sm text-terciario">No se pudieron cargar los números.</p>
              )
            ) : datos.veces === 0 ? (
              <p className="text-cuerpo-sm text-terciario">No se hizo en los últimos 90 días.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    ['Veces', String(datos.veces)],
                    ['Facturado', guaranies(datos.facturado)],
                    ['Última vez', datos.ultimaVez ? fechaCorta(datos.ultimaVez) : '—'],
                  ].map(([etiqueta, valor]) => (
                    <div key={etiqueta} className="border-borde-sutil rounded-md border p-3">
                      <p className="text-titulillo text-terciario uppercase">{etiqueta}</p>
                      <p className="text-cuerpo text-principal mt-1 font-semibold tabular-nums">{valor}</p>
                    </div>
                  ))}
                </div>
                <ul className="divide-borde-sutil mt-3 divide-y">
                  {datos.porBarbero.map((b) => (
                    <li key={b.nombre} className="text-cuerpo-sm flex justify-between py-2">
                      <span className="text-principal">{b.nombre}</span>
                      <span className="text-secundario tabular-nums">{plural(b.veces, 'vez', 'veces')}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </GrupoCampos>
        </div>
      </PanelLateral>
    </>
  );
}
