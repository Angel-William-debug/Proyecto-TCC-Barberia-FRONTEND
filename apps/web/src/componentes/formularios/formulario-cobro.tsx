'use client';

import { useState } from 'react';

import type { MetodoPago, VistaCobroPendiente } from '@barber-shop/tipos';
import { Boton, Campo, CampoSelector, FilaCampos, GrupoCampos, fechaHora, guaranies } from '@barber-shop/ui';

import { guardarCobro } from '@/acciones/cobros';
import { PanelFormulario } from './panel-formulario';

/** CU-008 — registro de un cobro sobre un turno completado. */
export function FormularioCobro({
  citasPendientes,
  metodos,
}: {
  citasPendientes: VistaCobroPendiente[];
  metodos: MetodoPago[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [idCita, setIdCita] = useState('');
  const [monto, setMonto] = useState('');

  const citaElegida = citasPendientes.find((c) => String(c.id_cita) === idCita);

  function elegirCita(valor: string) {
    setIdCita(valor);
    const cita = citasPendientes.find((c) => String(c.id_cita) === valor);
    // Se propone el saldo completo; el usuario lo reduce si el cliente paga
    // menos, y eso es lo que deja el cobro como parcial (RN-025).
    if (cita) setMonto(String(cita.saldo));
  }

  return (
    <>
      <Boton
        variante="primario"
        icono="plus"
        onClick={() => setAbierto(true)}
        disabled={citasPendientes.length === 0}
      >
        Registrar cobro
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Registrar cobro"
        descripcion="Solo se puede cobrar un turno completado (RN-024). Si el monto no cubre el saldo, queda como pago parcial (RN-025)."
        accion={guardarCobro}
        textoGuardar="Registrar cobro"
      >
        {(errores) => (
          <>
            <GrupoCampos titulo="Turno">
              <CampoSelector
                etiqueta="Turno"
                name="id_cita"
                value={idCita}
                onChange={(e) => elegirCita(e.target.value)}
                opciones={citasPendientes.map((c) => ({
                  valor: c.id_cita,
                  etiqueta: `${c.nombre_cliente} · ${fechaHora(c.fecha_hora)} · saldo ${guaranies(c.saldo)}`,
                }))}
                marcador="Elija un turno con saldo pendiente"
                error={errores.id_cita}
                required
              />
              {citaElegida && (
                <p className="text-cuerpo-sm text-terciario">
                  Total del turno: {guaranies(citaElegida.total)} · Ya cobrado:{' '}
                  {guaranies(citaElegida.cobrado)}
                </p>
              )}
            </GrupoCampos>

            <GrupoCampos titulo="Pago">
              <FilaCampos>
                <CampoSelector
                  etiqueta="Método de pago"
                  name="id_metodo_pago"
                  opciones={metodos.map((m) => ({ valor: m.id_metodo, etiqueta: m.nombre }))}
                  marcador="Elija un método"
                  error={errores.id_metodo_pago}
                  required
                />
                <Campo
                  etiqueta="Monto"
                  name="monto"
                  inputMode="numeric"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  sufijo="Gs."
                  error={errores.monto}
                  required
                />
              </FilaCampos>
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
