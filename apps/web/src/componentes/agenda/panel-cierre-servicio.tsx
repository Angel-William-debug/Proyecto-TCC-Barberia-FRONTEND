'use client';

import Link from 'next/link';
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
  useConfirmar,
} from '@barber-shop/ui';

import { completarCitaAccion, registrarInsumosAccion, stockActualAccion } from '@/acciones/agenda';

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
 *
 * El stock nunca queda negativo (RN-031, desde el 11/11/2026): si lo cargado
 * supera lo que hay -sumando el mismo producto en todos los servicios del
 * turno-, «Confirmar consumo» queda bloqueado. Se carga la entrada en
 * Inventario (otra pestaña) y «Actualizar stock» lo vuelve a leer sin cerrar
 * el panel, que si se cierra ya no se retoma.
 *
 * La agenda lo deja montado aunque el turno ya este completado
 * (`puedeCompletar` en false): al completar, la pagina se refresca y la fila
 * pasa a «completado». Antes el componente se desmontaba en ese momento y el
 * panel se cerraba solo, sin dejar confirmar el consumo (QA del 25/10/2026).
 */
export function PanelCierreServicio({
  idCita,
  nombreCliente,
  puedeCompletar = true,
}: {
  idCita: number;
  nombreCliente: string;
  puedeCompletar?: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const pedirConfirmacion = useConfirmar();
  const [servicios, setServicios] = useState<ServicioConInsumos[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  async function iniciarCierre() {
    const ok = await pedirConfirmacion({
      titulo: `¿Completar el turno de ${nombreCliente}?`,
      mensaje: 'Esta acción no se puede deshacer: el turno queda cerrado y se genera la comisión.',
      textoConfirmar: 'Completar turno',
      peligro: true,
    });
    if (!ok) return;

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

  function actualizarStock() {
    if (!servicios) return;
    const ids = [...new Set(servicios.flatMap((s) => s.productos.map((p) => p.idProducto)))];
    setError(null);
    iniciar(async () => {
      try {
        const stock = await stockActualAccion(ids);
        setServicios((prev) =>
          prev
            ? prev.map((s) => ({
                ...s,
                productos: s.productos.map((p) => {
                  const nuevo = stock[p.idProducto];
                  return nuevo === undefined ? p : { ...p, stockActual: nuevo };
                }),
              }))
            : prev,
        );
      } catch {
        setError('No se pudo leer el stock. Intente nuevamente.');
      }
    });
  }

  // Lo que se va a usar de cada producto, sumando todos los servicios del turno.
  const usoPorProducto = new Map<
    number,
    { nombre: string; unidad: string | null; usado: number; stock: number }
  >();
  for (const s of servicios ?? []) {
    for (const p of s.productos) {
      const n = Number(p.cantidad.replace(/\./g, '').replace(',', '.'));
      const previo = usoPorProducto.get(p.idProducto);
      usoPorProducto.set(p.idProducto, {
        nombre: p.nombreProducto,
        unidad: p.unidadUso,
        usado: (previo?.usado ?? 0) + (Number.isFinite(n) && n > 0 ? n : 0),
        stock: p.stockActual,
      });
    }
  }
  const faltantes = [...usoPorProducto.entries()].filter(([, u]) => u.usado > u.stock);
  const sinStock = new Set(faltantes.map(([id]) => id));

  return (
    <>
      {puedeCompletar && (
        <span className="inline-flex flex-col items-end gap-1">
          <Boton variante="secundario" tamano="sm" icono="check-check" onClick={iniciarCierre} disabled={ocupado}>
            Completar
          </Boton>
          {/* El error de completar (por ejemplo, un turno de un dia que no llego)
              se ve aca: el panel lateral todavia no esta abierto. */}
          {error && !abierto && <span className="text-etiqueta text-peligro">{error}</span>}
        </span>
      )}

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
            <Boton
              variante="primario"
              onClick={confirmar}
              cargando={ocupado}
              disabled={faltantes.length > 0}
            >
              Confirmar consumo
            </Boton>
          </>
        }
      >
        {error && <p className="text-cuerpo-sm text-peligro mb-4">{error}</p>}

        {faltantes.length > 0 && (
          <div
            role="status"
            className="border-peligro text-peligro text-cuerpo-sm mb-4 flex items-start gap-2 rounded-md border bg-[var(--chip-peligro-fondo)] p-3"
          >
            <Icono nombre="triangle-alert" tamano="sm" className="mt-0.5" />
            <div className="flex flex-col gap-2">
              <span>
                No alcanza el stock, y no puede quedar negativo (RN-031). Registre la entrada o el
                ajuste en Inventario, o corrija la cantidad, y después toque «Actualizar stock».
              </span>
              <ul className="list-disc pl-5">
                {faltantes.map(([id, u]) => (
                  <li key={id}>
                    <Link
                      href={`/panel/inventario?q=${encodeURIComponent(u.nombre)}`}
                      target="_blank"
                      className="underline"
                    >
                      {u.nombre}
                    </Link>
                    : hay {cantidad(u.stock)}
                    {u.unidad ? ` ${u.unidad}` : ''}, se cargaron {cantidad(u.usado)}
                    {u.unidad ? ` ${u.unidad}` : ''}
                  </li>
                ))}
              </ul>
              <span>
                <Boton variante="secundario" tamano="sm" onClick={actualizarStock} cargando={ocupado}>
                  Actualizar stock
                </Boton>
              </span>
            </div>
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
                      const excede = sinStock.has(p.idProducto);
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
                            error={excede ? 'No alcanza el stock' : undefined}
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
