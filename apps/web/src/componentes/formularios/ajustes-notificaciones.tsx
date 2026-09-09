'use client';

import type { ConfiguracionSistema } from '@barber-shop/tipos';
import {
  Campo,
  FilaCampos,
  GrupoCampos,
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
} from '@barber-shop/ui';

import { guardarNotificaciones } from '@/acciones/configuracion';
import { FormularioAjustes } from './formulario-ajustes';

/**
 * CU-020 - parametros de notificacion (RN-042).
 *
 * Son dos numeros, y los dos gobiernan a la funcion `recordatorios` de
 * Supabase: cuanto antes avisa y cuantas veces reintenta si el aviso no sale.
 * Estaban mezclados con el RUC y la direccion en la pantalla unica anterior,
 * donde no se parecian a nada de lo que tenian alrededor.
 */
export function AjustesNotificaciones({
  configuracion,
}: {
  configuracion: ConfiguracionSistema;
}) {
  return (
    <FormularioAjustes id="ajustes-notificaciones" accion={guardarNotificaciones}>
      {(errores) => (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Recordatorio de turno"
            descripcion="Cuánto antes se le avisa al cliente y qué pasa si el aviso no llega."
          />
          <TarjetaCuerpo>
            <GrupoCampos>
              <FilaCampos>
                <Campo
                  etiqueta="Se avisa con esta anticipación"
                  name="minutos_antes_recordatorio"
                  type="number"
                  min={0}
                  defaultValue={configuracion.minutos_antes_recordatorio}
                  sufijo="min"
                  ayuda="1440 son 24 horas antes. Cero desactiva el aviso."
                  error={errores.minutos_antes_recordatorio}
                  required
                />
                <Campo
                  etiqueta="Reintentos si el aviso falla"
                  name="max_reintentos_notif"
                  type="number"
                  min={0}
                  defaultValue={configuracion.max_reintentos_notif}
                  ayuda="Cuántas veces se vuelve a intentar antes de darlo por perdido."
                  error={errores.max_reintentos_notif}
                  required
                />
              </FilaCampos>
            </GrupoCampos>
          </TarjetaCuerpo>
        </Tarjeta>
      )}
    </FormularioAjustes>
  );
}
