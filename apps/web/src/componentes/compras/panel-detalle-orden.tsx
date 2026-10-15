'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { PedidoDetalle } from '@barber-shop/tipos';
import {
  AvisoFormulario,
  Boton,
  BotonIcono,
  ChipEstado,
  Esqueleto,
  GrupoCampos,
  PRESENTACION_PEDIDO,
  PanelLateral,
  useConfirmar,
  cantidad,
  fechaCorta,
  guaranies,
  identificador,
} from '@barber-shop/ui';

import { cancelarOrden, obtenerDetalleOrden, recibirOrden } from '@/acciones/compras';

/**
 * Detalle de una orden de compra (vista 75) y su ciclo (vista 76;
 * 15/10/2026).
 *
 * Una orden cargada como «pedido» quedaba así para siempre: no había botón
 * para marcarla recibida cuando llegaba la mercadería, y por lo tanto el
 * stock nunca entraba. Desde acá se marca recibida -la base suma el stock y
 * deja el movimiento- o se cancela si el proveedor no la va a entregar.
 */
export function PanelDetalleOrden({ idPedido }: { idPedido: number }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [orden, setOrden] = useState<PedidoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();
  const confirmar = useConfirmar();

  function abrir() {
    setAbierto(true);
    setError(null);
    iniciar(async () => {
      const r = await obtenerDetalleOrden(idPedido);
      if (r.ok) setOrden(r.datos);
      else setError(r.error);
    });
  }

  async function cambiar(accion: 'recibir' | 'cancelar') {
    const ok = await confirmar(
      accion === 'recibir'
        ? {
            titulo: '¿Marcar la orden como recibida?',
            mensaje: 'El stock de cada producto se suma ahora y no se puede deshacer.',
            textoConfirmar: 'Marcar recibida',
          }
        : {
            titulo: '¿Cancelar la orden?',
            mensaje: 'No se puede deshacer.',
            textoConfirmar: 'Cancelar orden',
            textoCancelar: 'Volver',
            peligro: true,
          },
    );
    if (!ok) return;
    setError(null);
    iniciar(async () => {
      const r = await (accion === 'recibir' ? recibirOrden(idPedido) : cancelarOrden(idPedido));
      if (!r.ok) {
        setError(r.error);
        return;
      }
      const nuevo = await obtenerDetalleOrden(idPedido);
      if (nuevo.ok) setOrden(nuevo.datos);
      router.refresh();
    });
  }

  const pendiente = orden?.estado === 'pedido';
  const saldo = orden ? orden.total - orden.pagado : 0;

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver la orden ${identificador(idPedido)}`}
        variante="terciario"
        tamano="sm"
        onClick={abrir}
      />

      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={`Orden ${identificador(idPedido)}`}
        descripcion={orden ? orden.nombre_proveedor : 'Cargando…'}
        pie={
          pendiente ? (
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Boton variante="secundario" disabled={ocupado} onClick={() => cambiar('cancelar')}>
                Cancelar orden
              </Boton>
              <Boton variante="primario" icono="package-check" cargando={ocupado} onClick={() => cambiar('recibir')}>
                Marcar recibida
              </Boton>
            </div>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-6">
          {error && <AvisoFormulario mensaje={error} />}

          {!orden ? (
            !error && (
              <div className="flex flex-col gap-3">
                <Esqueleto className="h-6 w-40" />
                <Esqueleto className="h-24 w-full" />
              </div>
            )
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <ChipEstado presentacion={PRESENTACION_PEDIDO[orden.estado]} />
                <span className="text-cuerpo-sm text-secundario">
                  Pedida el {fechaCorta(orden.fecha_pedido)}
                  {orden.fecha_recepcion && ` · recibida el ${fechaCorta(orden.fecha_recepcion)}`}
                </span>
              </div>

              {orden.telefono_proveedor && (
                <GrupoCampos titulo="Proveedor">
                  <p className="text-cuerpo text-principal font-medium">{orden.nombre_proveedor}</p>
                  <a href={`tel:${orden.telefono_proveedor}`} className="text-cuerpo-sm text-marca">
                    {orden.telefono_proveedor}
                  </a>
                </GrupoCampos>
              )}

              <GrupoCampos titulo="Productos">
                <ul className="divide-borde-sutil divide-y">
                  {orden.lineas.map((l) => (
                    <li key={l.id_detalle_pedido} className="flex items-start justify-between gap-3 py-2">
                      <div>
                        <p className="text-cuerpo text-principal">{l.nombre_producto}</p>
                        <p className="text-cuerpo-sm text-terciario tabular-nums">
                          {cantidad(l.cantidad)} {l.unidad_medida ?? 'u.'} × {guaranies(l.precio_unit)}
                        </p>
                      </div>
                      <span className="text-cuerpo text-principal tabular-nums">{guaranies(l.subtotal)}</span>
                    </li>
                  ))}
                </ul>
                <div className="text-cuerpo-sm mt-2 flex flex-col items-end gap-1 tabular-nums">
                  <span className="text-cuerpo text-principal font-semibold">Total {guaranies(orden.total)}</span>
                  {orden.estado !== 'pedido' && orden.estado !== 'cancelado' && (
                    <span className={saldo > 0 ? 'text-advertencia' : 'text-secundario'}>
                      Pagado {guaranies(orden.pagado)}
                      {saldo > 0 ? ` · saldo ${guaranies(saldo)}` : ' · sin saldo'}
                    </span>
                  )}
                </div>
              </GrupoCampos>

              {pendiente && (
                <p className="text-cuerpo-sm text-secundario">
                  Cuando llegue la mercadería, márquela como recibida: el stock de cada producto se
                  suma solo y la orden queda lista para pagarse.
                </p>
              )}
            </>
          )}
        </div>
      </PanelLateral>
    </>
  );
}
