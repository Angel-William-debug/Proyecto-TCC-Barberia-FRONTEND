'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import type { AuditoriaDeLista } from '@barber-shop/tipos';
import {
  BotonIcono,
  ChipEstado,
  Esqueleto,
  GrupoCampos,
  PanelLateral,
  fechaHora,
  identificador,
  type Presentacion,
} from '@barber-shop/ui';

import { historialDelRegistro } from '@/acciones/auditoria';

/** Dónde se ve cada registro auditado, cuando hay una pantalla propia. */
const RUTA_DEL_REGISTRO: Record<string, (id: number) => string> = {
  clientes: (id) => `/panel/clientes/${id}`,
  profesionales: (id) => `/panel/barberos/${id}`,
  servicios: () => '/panel/servicios',
  productos: () => '/panel/inventario',
  pedidos: () => '/panel/compras',
  cobros_cliente: () => '/panel/cobros',
  pagos_profesional: () => '/panel/comisiones',
};

/**
 * Detalle de un registro de auditoría (vista 15 del anexo; 15/10/2026).
 *
 * La fila de la tabla ya dice quién, cuándo y qué. El detalle agrega lo que
 * la tabla no puede mostrar en una línea: el texto completo y la historia de
 * ESE registro -todos los cambios que tuvo, en orden-, que es lo que se busca
 * cuando alguien pregunta «¿quién tocó este turno?».
 */
export function PanelDetalleAuditoria({
  registro: r,
  presentacion,
}: {
  registro: AuditoriaDeLista;
  presentacion: Presentacion;
}) {
  const [abierto, setAbierto] = useState(false);
  const [historia, setHistoria] = useState<AuditoriaDeLista[] | null>(null);
  const [cargando, iniciar] = useTransition();

  function abrir() {
    setAbierto(true);
    if (r.registro_id !== null) {
      iniciar(async () => setHistoria(await historialDelRegistro(r.tabla_afectada, r.registro_id!)));
    }
  }

  const ruta = r.registro_id !== null ? RUTA_DEL_REGISTRO[r.tabla_afectada]?.(r.registro_id) : undefined;

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver el detalle del registro ${identificador(r.id_auditoria)}`}
        variante="terciario"
        tamano="sm"
        onClick={abrir}
      />
      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={`Registro ${identificador(r.id_auditoria)}`}
        descripcion={fechaHora(r.fecha_accion)}
      >
        <div className="flex flex-col gap-6">
          <ChipEstado presentacion={presentacion} />

          <GrupoCampos titulo="Qué pasó">
            <dl className="text-cuerpo-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-terciario">Usuario</dt>
              <dd className="text-principal">{r.nombre_usuario ?? 'Sistema (sin sesión)'}</dd>
              <dt className="text-terciario">Tabla</dt>
              <dd className="text-principal font-mono">{r.tabla_afectada}</dd>
              <dt className="text-terciario">Registro</dt>
              <dd className="text-principal font-mono">
                {r.registro_id !== null ? identificador(r.registro_id) : '—'}
                {ruta && (
                  <Link href={ruta} className="text-marca ml-2 font-sans">
                    Abrir
                  </Link>
                )}
              </dd>
            </dl>
          </GrupoCampos>

          <GrupoCampos titulo="Detalle">
            <p className="text-cuerpo-sm text-secundario break-words whitespace-pre-line">
              {r.detalle ?? 'Sin detalle.'}
            </p>
          </GrupoCampos>

          {r.registro_id !== null && (
            <GrupoCampos titulo="Historia de este registro">
              {!historia ? (
                cargando && <Esqueleto className="h-20 w-full" />
              ) : (
                <ol className="border-borde-sutil flex flex-col gap-3 border-l pl-4">
                  {historia.map((h) => (
                    <li key={h.id_auditoria} className={h.id_auditoria === r.id_auditoria ? 'text-principal' : ''}>
                      <p className="text-cuerpo-sm text-principal">
                        {h.accion === 'INSERT' ? 'Alta' : h.accion === 'DELETE' ? 'Baja' : 'Modificación'}
                        {h.id_auditoria === r.id_auditoria && <span className="text-marca"> · este</span>}
                      </p>
                      <p className="text-titulillo text-terciario">
                        {fechaHora(h.fecha_accion)} · {h.nombre_usuario ?? 'Sistema'}
                        {h.detalle && ` · ${h.detalle}`}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </GrupoCampos>
          )}
        </div>
      </PanelLateral>
    </>
  );
}
