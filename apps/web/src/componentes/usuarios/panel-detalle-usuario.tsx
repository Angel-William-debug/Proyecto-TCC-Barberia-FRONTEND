'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';

import type { AuditoriaDeLista, VistaUsuarioPorRol } from '@barber-shop/tipos';
import {
  BotonIcono,
  ChipEstado,
  Esqueleto,
  GrupoCampos,
  PRESENTACION_ROL,
  PanelLateral,
  fechaCorta,
  fechaHora,
} from '@barber-shop/ui';

import { actividadDelUsuario } from '@/acciones/usuarios';

const VERBO: Record<string, string> = { INSERT: 'Creó', UPDATE: 'Modificó', DELETE: 'Borró' };

/**
 * Detalle del usuario (vista 7 del anexo; 15/10/2026): su cuenta y lo
 * último que hizo en el sistema, sacado de la auditoría. Sirve para
 * responder «¿quién cambió esto?» sin ir a la pantalla de Auditoría y filtrar.
 */
export function PanelDetalleUsuario({ usuario }: { usuario: VistaUsuarioPorRol }) {
  const [abierto, setAbierto] = useState(false);
  const [actividad, setActividad] = useState<AuditoriaDeLista[] | null>(null);
  const [cargando, iniciar] = useTransition();

  function abrir() {
    setAbierto(true);
    iniciar(async () => setActividad(await actividadDelUsuario(usuario.id_usuario)));
  }

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver el detalle de ${usuario.nombre}`}
        variante="terciario"
        tamano="sm"
        onClick={abrir}
      />
      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={usuario.nombre}
        descripcion={usuario.email}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {PRESENTACION_ROL[usuario.rol] && <ChipEstado presentacion={PRESENTACION_ROL[usuario.rol]} />}
            <ChipEstado
              presentacion={
                usuario.estado
                  ? { etiqueta: 'Activo', tono: 'exito', icono: 'circle-check' }
                  : { etiqueta: 'Inactivo', tono: 'neutro', icono: 'ban' }
              }
            />
            <span className="text-cuerpo-sm text-secundario">Alta el {fechaCorta(usuario.created_at)}</span>
          </div>

          {usuario.id_profesional !== null && (
            <GrupoCampos titulo="Barbero">
              <Link href={`/panel/barberos/${usuario.id_profesional}`} className="text-cuerpo-sm text-marca">
                Ver su perfil de barbero
              </Link>
            </GrupoCampos>
          )}

          <GrupoCampos titulo="Última actividad">
            {!actividad ? (
              cargando && <Esqueleto className="h-24 w-full" />
            ) : actividad.length === 0 ? (
              <p className="text-cuerpo-sm text-terciario">No hay acciones registradas a su nombre.</p>
            ) : (
              <ul className="divide-borde-sutil divide-y">
                {actividad.map((a) => (
                  <li key={a.id_auditoria} className="py-2">
                    <p className="text-cuerpo-sm text-principal">
                      {VERBO[a.accion] ?? a.accion} en {a.tabla_afectada.replaceAll('_', ' ')}
                      {a.registro_id !== null && ` #${a.registro_id}`}
                    </p>
                    <p className="text-titulillo text-terciario">
                      {fechaHora(a.fecha_accion)}
                      {a.detalle && ` · ${a.detalle}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </GrupoCampos>
        </div>
      </PanelLateral>
    </>
  );
}
