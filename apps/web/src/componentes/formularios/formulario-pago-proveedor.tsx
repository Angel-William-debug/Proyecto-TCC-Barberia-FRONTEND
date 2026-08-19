'use client';

import { useState } from 'react';

import type { MetodoPago, PedidoPendientePago } from '@barber-shop/tipos';
import { Boton, Campo, CampoSelector, FilaCampos, GrupoCampos, fechaCorta, guaranies } from '@barber-shop/ui';

import { guardarPagoProveedor } from '@/acciones/compras';
import { PanelFormulario } from './panel-formulario';

/** CU-018 — registro de un pago a un proveedor sobre una orden recibida (RN-028). */
export function FormularioPagoProveedor({
  pedidosPendientes,
  metodos,
}: {
  pedidosPendientes: PedidoPendientePago[];
  metodos: MetodoPago[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [idPedido, setIdPedido] = useState('');
  const [monto, setMonto] = useState('');

  const pedidoElegido = pedidosPendientes.find((p) => String(p.id_pedido) === idPedido);

  function elegirPedido(valor: string) {
    setIdPedido(valor);
    const pedido = pedidosPendientes.find((p) => String(p.id_pedido) === valor);
    if (pedido) setMonto(String(pedido.saldo));
  }

  return (
    <>
      <Boton
        variante="secundario"
        icono="plus"
        tamano="sm"
        onClick={() => setAbierto(true)}
        disabled={pedidosPendientes.length === 0}
      >
        Registrar pago
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Registrar pago a proveedor"
        descripcion="Solo se puede pagar una orden ya recibida (RN-028), y el total de sus pagos no puede superar el total de la orden (CU-018 A1)."
        accion={guardarPagoProveedor}
        textoGuardar="Registrar pago"
      >
        {(errores) => (
          <>
            <GrupoCampos titulo="Orden">
              <CampoSelector
                etiqueta="Orden de compra"
                name="id_pedido"
                value={idPedido}
                onChange={(e) => elegirPedido(e.target.value)}
                opciones={pedidosPendientes.map((p) => ({
                  valor: p.id_pedido,
                  etiqueta: `${p.nombre_proveedor} · ${fechaCorta(p.fecha_pedido)} · saldo ${guaranies(p.saldo)}`,
                }))}
                marcador="Elija una orden con saldo pendiente"
                error={errores.id_pedido}
                required
              />
              {pedidoElegido && (
                <p className="text-cuerpo-sm text-terciario">
                  Total de la orden: {guaranies(pedidoElegido.total)} · Ya pagado:{' '}
                  {guaranies(pedidoElegido.pagado)}
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
