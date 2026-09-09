'use client';

import { useState } from 'react';

import type { MetodoPago } from '@barber-shop/tipos';
import { Interruptor, Tarjeta, TarjetaCuerpo, TarjetaEncabezado } from '@barber-shop/ui';

import { guardarMetodosPago } from '@/acciones/configuracion';
import { FormularioAjustes } from './formulario-ajustes';

/**
 * CU-020 - metodos de pago habilitados.
 *
 * Apagar un metodo NO lo borra. Los cobros ya registrados lo referencian, y
 * borrarlo dejaria facturas historicas apuntando a un metodo inexistente. Lo
 * que hace el interruptor es sacarlo del selector de la pantalla de cobros, de
 * ahi en adelante.
 *
 * El alta de metodos nuevos no vive aca: son ocho filas fijas que carga la
 * instalacion, y agregar uno es una decision con consecuencias contables que
 * excede a esta pantalla.
 */
export function AjustesMetodosPago({ metodos }: { metodos: MetodoPago[] }) {
  return (
    <FormularioAjustes id="ajustes-metodos-pago" accion={guardarMetodosPago}>
      {() => (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Métodos de pago"
            descripcion="Con qué se puede cobrar un turno. Los deshabilitados dejan de ofrecerse al registrar un cobro, pero siguen figurando en los cobros ya hechos."
          />
          <TarjetaCuerpo>
            <ul className="divide-borde-sutil divide-y">
              {metodos.map((m) => (
                <FilaMetodo key={m.id_metodo} metodo={m} />
              ))}
            </ul>
          </TarjetaCuerpo>
        </Tarjeta>
      )}
    </FormularioAjustes>
  );
}

/**
 * Un metodo.
 *
 * Controlado, y no con `defaultChecked`, por la linea de abajo: tiene que
 * decir «no se ofrece al cobrar» apenas se apaga el interruptor, no despues de
 * guardar. Una descripcion que sigue afirmando lo contrario de lo que muestra
 * el control que tiene al lado es peor que no tener descripcion.
 */
function FilaMetodo({ metodo }: { metodo: MetodoPago }) {
  const [habilitado, setHabilitado] = useState(metodo.estado);

  return (
    <li className="py-4">
      {/* Oculto y siempre presente: le dice a la accion que metodos llegaron.
          La casilla, en cambio, no se envia cuando esta apagada. */}
      <input type="hidden" name="id_metodo" value={metodo.id_metodo} />
      <Interruptor
        name={`estado_${metodo.id_metodo}`}
        etiqueta={metodo.nombre}
        checked={habilitado}
        onChange={setHabilitado}
        descripcion={habilitado ? 'Se ofrece al cobrar' : 'No se ofrece al cobrar'}
      />
    </li>
  );
}
