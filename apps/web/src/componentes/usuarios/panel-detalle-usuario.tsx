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

import type { DatosDeCuenta } from '@barber-shop/api';

import { actividadDelUsuario, cuentaDelUsuario } from '@/acciones/usuarios';
import { NOMBRE_DE_TABLA, RUTA_DEL_REGISTRO } from '@/lib/rutas-de-registro';

const VERBO: Record<string, string> = { INSERT: 'Creó', UPDATE: 'Modificó', DELETE: 'Borró' };

/**
 * Detalle del usuario (vista 7 del anexo; 15/10/2026): su cuenta y lo
 * último que hizo en el sistema, sacado de la auditoría. Sirve para
 * responder «¿quién cambió esto?» sin ir a la pantalla de Auditoría y filtrar.
 *
 * Desde el 11/11/2026 (QA F2-10) muestra también la cuenta (correo verificado,
 * último ingreso, cuántas acciones registra) y cada acción lleva al registro
 * que tocó: un turno abre la agenda de ese día.
 */
export function PanelDetalleUsuario({ usuario }: { usuario: VistaUsuarioPorRol }) {
  const [abierto, setAbierto] = useState(false);
  const [actividad, setActividad] = useState<AuditoriaDeLista[] | null>(null);
  const [cuenta, setCuenta] = useState<DatosDeCuenta | null>(null);
  const [cargando, iniciar] = useTransition();

  function abrir() {
    setAbierto(true);
    iniciar(async () => {
      const [a, c] = await Promise.all([
        actividadDelUsuario(usuario.id_usuario),
        cuentaDelUsuario(usuario.id_usuario),
      ]);
      setActividad(a);
      setCuenta(c);
    });
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

          <GrupoCampos titulo="Cuenta">
            {!cuenta ? (
              cargando ? <Esqueleto className="h-16 w-full" /> : <p className="text-cuerpo-sm text-terciario">No se pudo leer la cuenta.</p>
            ) : (
              <dl className="text-cuerpo-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                <dt className="text-terciario">Correo</dt>
                <dd className="text-principal">{cuenta.correoVerificado ? 'Verificado' : 'Sin verificar: todavía no abrió el correo'}</dd>
                <dt className="text-terciario">Último ingreso</dt>
                <dd className="text-principal">{cuenta.ultimoIngreso ? fechaHora(cuenta.ultimoIngreso) : 'Nunca ingresó'}</dd>
                <dt className="text-terciario">Acciones registradas</dt>
                <dd className="text-principal tabular-nums">{cuenta.accionesRegistradas}</dd>
              </dl>
            )}
          </GrupoCampos>

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
                {actividad.map((a) => {
                  const ruta = a.registro_id !== null ? RUTA_DEL_REGISTRO[a.tabla_afectada]?.(a.registro_id) : undefined;
                  const texto = `${VERBO[a.accion] ?? a.accion} ${NOMBRE_DE_TABLA[a.tabla_afectada] ?? a.tabla_afectada.replaceAll('_', ' ')}${a.registro_id !== null ? ` #${a.registro_id}` : ''}`;
                  return (
                  <li key={a.id_auditoria} className="py-2">
                    <p className="text-cuerpo-sm text-principal">
                      {ruta ? (
                        <Link href={ruta} className="text-marca font-medium hover:underline">
                          {texto}
                        </Link>
                      ) : (
                        texto
                      )}
                    </p>
                    <p className="text-titulillo text-terciario">
                      {fechaHora(a.fecha_accion)}
                      {a.detalle && ` · ${a.detalle}`}
                    </p>
                  </li>
                  );
                })}
              </ul>
            )}
          </GrupoCampos>
        </div>
      </PanelLateral>
    </>
  );
}
