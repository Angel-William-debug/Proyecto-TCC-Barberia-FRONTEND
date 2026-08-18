'use client';

import { useState } from 'react';

import { Boton, CampoSelector, GrupoCampos, guaranies, plural } from '@barber-shop/ui';

import { liquidarPendientes } from '@/acciones/operaciones';
import { PanelFormulario } from './panel-formulario';

/** Lo que se va a liquidar, por barbero. Lo calcula la pantalla. */
export interface ResumenBarbero {
  nombre: string;
  idProfesional: number | null;
  servicios: number;
  total: number;
}

/**
 * CU-011 - liquidacion de comisiones.
 *
 * No es un alta: es una confirmacion. Por eso el panel es `sm` y lo unico que
 * se elige es el alcance. Aun asi pasa por el mismo armazon que los demas
 * formularios, para que el boton, los errores y el cierre se comporten igual.
 *
 * Se muestra el detalle antes de confirmar porque la operacion no tiene vuelta
 * atras desde la interfaz: una vez marcada, la comision figura como pagada.
 */
export function PanelLiquidacion({ resumen }: { resumen: ResumenBarbero[] }) {
  const [abierto, setAbierto] = useState(false);
  const [barbero, setBarbero] = useState('');

  const elegido = resumen.find((r) => String(r.idProfesional) === barbero);
  const aLiquidar = elegido ? [elegido] : resumen;
  const total = aLiquidar.reduce((s, r) => s + r.total, 0);
  const servicios = aLiquidar.reduce((s, r) => s + r.servicios, 0);

  return (
    <>
      <Boton
        variante="primario"
        icono="hand-coins"
        onClick={() => setAbierto(true)}
        disabled={resumen.length === 0}
      >
        Liquidar pendientes
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        ancho="sm"
        titulo="Liquidar comisiones"
        descripcion="Las comisiones quedan marcadas como pagadas con la fecha de hoy."
        accion={liquidarPendientes}
        textoGuardar="Confirmar liquidación"
      >
        {() => (
          <>
            <GrupoCampos titulo="Alcance">
              <CampoSelector
                etiqueta="Barbero"
                name="id_profesional"
                value={barbero}
                onChange={(e) => setBarbero(e.target.value)}
                opciones={resumen
                  .filter((r) => r.idProfesional !== null)
                  .map((r) => ({ valor: r.idProfesional!, etiqueta: r.nombre }))}
                marcador="Todos los barberos"
                ayuda="Sin elegir a nadie se liquida todo lo pendiente."
              />
            </GrupoCampos>

            <GrupoCampos titulo="Lo que se va a liquidar">
              <ul className="border-borde-sutil divide-borde-sutil divide-y rounded-md border">
                {aLiquidar.map((r) => (
                  <li
                    key={r.nombre}
                    className="flex items-baseline justify-between gap-4 px-3 py-2"
                  >
                    <span className="text-principal font-medium">{r.nombre}</span>
                    <span className="text-terciario text-cuerpo-xs">
                      {plural(r.servicios, 'servicio', 'servicios')}
                    </span>
                    <span className="text-principal tabular-nums">{guaranies(r.total)}</span>
                  </li>
                ))}
              </ul>

              <div className="border-marca bg-elevado flex items-baseline justify-between rounded-md border-l-2 px-3 py-2">
                <span className="text-titulillo text-terciario font-semibold tracking-[0.08em] uppercase">
                  Total
                </span>
                <span className="font-display text-principal text-display-sm tabular-nums">
                  {guaranies(total)}
                </span>
              </div>

              <p className="text-terciario text-cuerpo-xs">
                {plural(servicios, 'servicio realizado', 'servicios realizados')} sin liquidar.
                Una vez confirmada, la liquidación no se deshace desde el sistema.
              </p>
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
