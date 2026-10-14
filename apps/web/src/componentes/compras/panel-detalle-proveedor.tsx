'use client';

import { useState, useTransition } from 'react';

import type { PedidoDeLista, Proveedor } from '@barber-shop/tipos';
import {
  AvisoFormulario,
  BotonIcono,
  ChipEstado,
  Esqueleto,
  GrupoCampos,
  PRESENTACION_PEDIDO,
  PanelLateral,
  fechaCorta,
  guaranies,
  identificador,
  plural,
} from '@barber-shop/ui';

import { ordenesDelProveedor } from '@/acciones/compras';

/**
 * Ficha del proveedor con sus órdenes (vista 72 del anexo, 15/10/2026).
 *
 * La tabla de proveedores mostraba solo el contacto; para saber qué se le
 * compró a cada uno había que filtrar las órdenes a mano. Acá están juntas:
 * el contacto, cuánto se le compró y cada orden con su estado.
 */
export function PanelDetalleProveedor({ proveedor }: { proveedor: Proveedor }) {
  const [abierto, setAbierto] = useState(false);
  const [ordenes, setOrdenes] = useState<PedidoDeLista[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, iniciar] = useTransition();

  function abrir() {
    setAbierto(true);
    setError(null);
    iniciar(async () => {
      const r = await ordenesDelProveedor(proveedor.nombre);
      if (r.ok) setOrdenes(r.datos);
      else setError(r.error);
    });
  }

  const vigentes = (ordenes ?? []).filter((o) => o.estado !== 'cancelado');
  const comprado = vigentes.reduce((suma, o) => suma + o.total, 0);
  const enCamino = vigentes.filter((o) => o.estado === 'pedido').length;

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver la ficha de ${proveedor.nombre}`}
        variante="terciario"
        tamano="sm"
        onClick={abrir}
      />

      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={proveedor.nombre}
        descripcion={`Proveedor desde el ${fechaCorta(proveedor.created_at)}`}
      >
        <div className="flex flex-col gap-6">
          {error && <AvisoFormulario mensaje={error} />}

          <GrupoCampos titulo="Contacto">
            <dl className="text-cuerpo-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-terciario">Teléfono</dt>
              <dd className="text-principal">
                {proveedor.telefono ? (
                  <a href={`tel:${proveedor.telefono}`} className="text-marca">
                    {proveedor.telefono}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
              <dt className="text-terciario">Correo</dt>
              <dd className="text-principal break-all">
                {proveedor.email ? (
                  <a href={`mailto:${proveedor.email}`} className="text-marca">
                    {proveedor.email}
                  </a>
                ) : (
                  '—'
                )}
              </dd>
              <dt className="text-terciario">Dirección</dt>
              <dd className="text-principal">{proveedor.direccion ?? '—'}</dd>
            </dl>
          </GrupoCampos>

          <GrupoCampos titulo="Órdenes">
            {!ordenes ? (
              cargando && <Esqueleto className="h-24 w-full" />
            ) : ordenes.length === 0 ? (
              <p className="text-cuerpo-sm text-terciario">Todavía no se le hizo ninguna orden.</p>
            ) : (
              <>
                <p className="text-cuerpo-sm text-secundario mb-2">
                  {plural(vigentes.length, 'orden', 'órdenes')} por {guaranies(comprado)}
                  {enCamino > 0 && ` · ${plural(enCamino, 'esperando entrega', 'esperando entrega')}`}
                </p>
                <ul className="divide-borde-sutil divide-y">
                  {ordenes.map((o) => (
                    <li key={o.id_pedido} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className="text-cuerpo text-principal font-mono">{identificador(o.id_pedido)}</p>
                        <p className="text-cuerpo-sm text-terciario">
                          {fechaCorta(o.fecha_pedido)} · {plural(o.cantidad_items, 'ítem', 'ítems')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-cuerpo text-principal tabular-nums">{guaranies(o.total)}</span>
                        <ChipEstado presentacion={PRESENTACION_PEDIDO[o.estado]} />
                      </div>
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
