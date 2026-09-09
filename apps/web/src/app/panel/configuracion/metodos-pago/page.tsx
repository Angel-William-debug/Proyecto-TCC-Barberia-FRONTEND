import { listarMetodosPagoTodos } from '@barber-shop/api';
import { EstadoVacio, Tarjeta } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { AjustesMetodosPago } from '@/componentes/configuracion/ajustes-metodos-pago';

export const metadata = { title: 'Métodos de pago' };

/**
 * CU-020 - metodos de pago habilitados.
 *
 * Usa `listarMetodosPagoTodos` y no `listarMetodosPago`: la segunda filtra los
 * habilitados, que es lo que necesita quien cobra, y aca hacen falta tambien
 * los apagados, que son justamente los que se pueden volver a encender.
 */
export default async function PaginaMetodosPago() {
  const metodos = await listarMetodosPagoTodos();

  return (
    <>
      <EncabezadoVista
        titulo="Métodos de pago"
        descripcion="Con qué se puede registrar el cobro de un turno y el pago a un proveedor."
      />

      {metodos.length > 0 ? (
        <AjustesMetodosPago metodos={metodos} />
      ) : (
        <Tarjeta>
          <EstadoVacio
            icono="triangle-alert"
            titulo="No hay métodos de pago cargados"
            descripcion="Sin ningún método no se puede registrar un cobro. Verifique los datos iniciales de la base."
          />
        </Tarjeta>
      )}
    </>
  );
}
