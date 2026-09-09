'use client';

import { useState, useTransition } from 'react';

import type { RecomendacionDeLista } from '@barber-shop/tipos';
import { Boton, EstadoVacio, Tarjeta, TarjetaEncabezado, porcentaje } from '@barber-shop/ui';

import { generarRecomendacionesAccion } from '@/acciones/recomendaciones';

/** CU-013 — recomendaciones ML del cliente. K-Means + filtrado colaborativo, en `apps/api`. */
export function TarjetaRecomendaciones({
  idCliente,
  iniciales,
}: {
  idCliente: number;
  iniciales: RecomendacionDeLista[];
}) {
  const [recomendaciones, setRecomendaciones] = useState(iniciales);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function generar() {
    setError(null);
    iniciar(async () => {
      const r = await generarRecomendacionesAccion(idCliente);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setRecomendaciones(r.recomendaciones);
    });
  }

  return (
    <Tarjeta>
      <TarjetaEncabezado
        titulo="Recomendaciones"
        descripcion="K-Means + filtrado colaborativo sobre el historial de servicios"
      />
      <div className="p-6">
        {error && <p className="text-cuerpo-sm text-peligro mb-4">{error}</p>}

        {recomendaciones.length === 0 ? (
          <EstadoVacio
            icono="brain"
            titulo="Sin recomendaciones generadas"
            descripcion="Requiere al menos 3 servicios en el historial del cliente (RN-009)."
          />
        ) : (
          <ul className="mb-4 flex flex-col gap-3">
            {recomendaciones.map((r) => (
              <li key={r.id_recomendacion} className="flex items-center justify-between gap-4">
                <span className="text-cuerpo text-principal">{r.nombre_servicio}</span>
                <span className="text-cuerpo-sm text-terciario tabular-nums">
                  {porcentaje(r.score_relevancia * 100)} de afinidad
                </span>
              </li>
            ))}
          </ul>
        )}

        <Boton variante="secundario" icono="brain" onClick={generar} cargando={ocupado}>
          {recomendaciones.length === 0 ? 'Generar recomendaciones' : 'Volver a generar'}
        </Boton>
      </div>
    </Tarjeta>
  );
}
