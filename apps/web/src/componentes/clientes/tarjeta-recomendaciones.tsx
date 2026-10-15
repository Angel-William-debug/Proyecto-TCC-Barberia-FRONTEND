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
        {/* Vista 98 (15/10/2026): si el motor falla, se dice que es el motor
            -no el cliente- y se ofrece reintentar. La falta de historial
            (RN-009) no es una falla y se muestra tal cual. */}
        {error &&
          (/historial|RN-009|al menos/i.test(error) ? (
            <p className="text-cuerpo-sm text-advertencia mb-4">{error}</p>
          ) : (
            <div role="alert" className="border-borde-sutil bg-elevado mb-4 rounded-md border p-3">
              <p className="text-cuerpo-sm text-principal font-medium">
                El motor de recomendaciones no está disponible ahora
              </p>
              <p className="text-cuerpo-sm text-secundario mt-1">
                {error} El resto del perfil funciona igual.
              </p>
              <button type="button" onClick={generar} className="text-marca text-cuerpo-sm mt-2 font-medium">
                Reintentar
              </button>
            </div>
          ))}

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
