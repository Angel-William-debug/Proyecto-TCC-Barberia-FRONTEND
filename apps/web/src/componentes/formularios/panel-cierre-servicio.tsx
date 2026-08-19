'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { SugerenciaCierre } from '@barber-shop/tipos';
import {
  Boton,
  Campo,
  EstadoVacio,
  GrupoCampos,
  Icono,
  PanelLateral,
  cantidad,
} from '@barber-shop/ui';

import { completarCitaAccion, registrarInsumosAccion } from '@/acciones/agenda';

interface LineaInsumo {
  idProducto: number;
  nombreProducto: string;
  unidadUso: string | null;
  stockActual: number;
  cantidad: string;
}

interface ServicioConInsumos {
  idHistorial: number;
  nombreServicio: string;
  productos: LineaInsumo[];
}

function aServicios(sugerencias: SugerenciaCierre[]): ServicioConInsumos[] {
  return sugerencias.map((s) => ({
    idHistorial: s.idHistorial,
    nombreServicio: s.nombreServicio,
    productos: s.productos.map((p) => ({
      idProducto: p.idProducto,
      nombreProducto: p.nombreProducto,
      unidadUso: p.unidadUso,
      stockActual: p.stockActual,
      cantidad: String(p.cantidadSugerida),
    })),
  }));
}

/**
 * CU-007 (cerrar el turno) seguido de CU-011 (confirmar los insumos usados).
 *
 * `completarCitaAccion` ya deja la cita en 'completado' -es irreversible por
 * RN-018, de ahi la confirmacion antes de llamarla-, asi que este panel no es
 * una vista previa: aparece DESPUES del cambio, para registrar el consumo
 * mientras el disparador ya generó el historial y la comisión. Si el usuario
 * cierra sin confirmar, el turno queda completado sin insumos registrados;
 * hoy no hay forma de retomarlo desde aca, es una limitacion conocida.
 */
export function PanelCierreServicio({ idCita, nombreCliente }: { idCita: number; nombreCliente: string }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [servicios, setServicios] = useState<ServicioConInsumos[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  function iniciarCierre() {
    if (
      !window.confirm(
        `¿Completar el turno de ${nombreCliente}? Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setError(null);
    iniciar(async () => {
      const r = await completarCitaAccion(idCita);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setServicios(aServicios(r.sugerencias));
      setAbierto(true);
    });
  }

  function cambiarCantidad(idHistorial: number, idProducto: number, valor: string) {
    setServicios((prev) =>
      prev
        ? prev.map((s) =>
            s.idHistorial !== idHistorial
              ? s
              : {
                  ...s,
                  productos: s.productos.map((p) =>
                    p.idProducto === idProducto ? { ...p, cantidad: valor } : p,
                  ),
                }
          )
        : prev,
    );
  }

  function confirmar() {
    if (!servicios) return;
    setError(null);

    const aNumero = (s: string) => {
      const n = Number(s.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(n) ? n : 0;
    };

    const entradas = servicios.flatMap((s) =>
      s.productos
        .map((p) => ({ ...p, cantidadNum: aNumero(p.cantidad) }))
        .filter((p) => p.cantidadNum > 0)
        .map((p) => ({
          idHistorial: s.idHistorial,
          idProducto: p.idProducto,
          cantidadUsada: p.cantidadNum,
          excepcionStock: p.cantidadNum > p.stockActual,
        })),
    );

    iniciar(async () => {
      const r = await registrarInsumosAccion(entradas);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setAbierto(false);
      setServicios(null);
      router.refresh();
    });
  }

  const hayExcepciones = (servicios ?? []).some((s) =>
    s.productos.some((p) => {
      const n = Number(p.cantidad.replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(n) && n > p.stockActual;
    }),
  );

  return (
    <>
      <Boton variante="secundario" tamano="sm" icono="check-check" onClick={iniciarCierre} disabled={ocupado}>
        Completar
      </Boton>

      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Insumos utilizados"
        descripcion={`Turno de ${nombreCliente} ya completado. Confirme los productos consumidos (CU-011).`}
        ancho="lg"
        pie={
          <>
            <Boton variante="terciario" onClick={() => setAbierto(false)} disabled={ocupado}>
              Cerrar
            </Boton>
            <Boton variante="primario" onClick={confirmar} cargando={ocupado}>
              Confirmar consumo
            </Boton>
          </>
        }
      >
        {error && <p className="text-cuerpo-sm text-peligro mb-4">{error}</p>}

        {hayExcepciones && (
          <div
            role="status"
            className="border-peligro text-peligro text-cuerpo-sm mb-4 flex items-start gap-2 rounded-md border bg-[var(--chip-peligro-fondo)] p-3"
          >
            <Icono nombre="triangle-alert" tamano="sm" className="mt-0.5" />
            <span>
              Algún producto va a quedar con stock negativo. Se registra igual, como excepción
              (RN-031).
            </span>
          </div>
        )}

        {!servicios || servicios.every((s) => s.productos.length === 0) ? (
          <EstadoVacio
            icono="box"
            titulo="Sin productos que registrar"
            descripcion="Ninguno de los servicios de este turno tiene una receta cargada."
          />
        ) : (
          servicios.map(
            (s) =>
              s.productos.length > 0 && (
                <GrupoCampos key={s.idHistorial} titulo={s.nombreServicio}>
                  <div className="flex flex-col gap-3">
                    {s.productos.map((p) => {
                      const usado = Number(p.cantidad.replace(/\./g, '').replace(',', '.'));
                      const excede = Number.isFinite(usado) && usado > p.stockActual;
                      return (
                        <div key={p.idProducto} className="flex items-end gap-3">
                          <div className="flex-[2]">
                            <p className="text-cuerpo text-principal">{p.nombreProducto}</p>
                            <p className="text-cuerpo-sm text-terciario">
                              Stock actual: {cantidad(p.stockActual)}
                              {p.unidadUso ? ` ${p.unidadUso}` : ''}
                            </p>
                          </div>
                          <Campo
                            etiqueta="Cantidad usada"
                            aria-label={`Cantidad usada de ${p.nombreProducto}`}
                            name={`cantidad-${p.idProducto}`}
                            inputMode="numeric"
                            value={p.cantidad}
                            onChange={(e) =>
                              cambiarCantidad(s.idHistorial, p.idProducto, e.target.value)
                            }
                            sufijo={p.unidadUso ?? undefined}
                            error={excede ? 'Supera el stock disponible' : undefined}
                            claseContenedor="w-40"
                          />
                        </div>
                      );
                    })}
                  </div>
                </GrupoCampos>
              ),
          )
        )}
      </PanelLateral>
    </>
  );
}
