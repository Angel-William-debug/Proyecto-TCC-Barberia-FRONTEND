'use client';

import { useState } from 'react';

import type { ConfiguracionSistema } from '@barber-shop/tipos';
import { Boton, Campo, CampoSelector, FilaCampos, GrupoCampos } from '@barber-shop/ui';

import { guardarConfiguracion } from '@/acciones/operaciones';
import { PanelFormulario } from './panel-formulario';

/**
 * CU-020 - datos del establecimiento y parametros del sistema.
 *
 * Solo edita: la tabla tiene una fila unica y la crea la instalacion, asi que
 * no hay alta que ofrecer.
 *
 * Los horarios de atencion y los metodos de pago NO se editan aca aunque se
 * muestren en la misma pantalla: son tablas propias, con una fila por dia y
 * por metodo, y meterlas en este panel obligaria a mezclar tres formularios
 * en uno.
 */
export function FormularioConfiguracion({ configuracion }: { configuracion: ConfiguracionSistema }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <Boton variante="primario" icono="pencil" onClick={() => setAbierto(true)}>
        Editar
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Editar la configuración"
        descripcion="Estos datos salen impresos en los comprobantes y en los reportes."
        accion={guardarConfiguracion}
        textoGuardar="Guardar cambios"
      >
        {(errores) => (
          <>
            <GrupoCampos titulo="Datos del establecimiento">
              <Campo
                etiqueta="Nombre de la barbería"
                name="nombre_barberia"
                defaultValue={configuracion.nombre_barberia}
                error={errores.nombre_barberia}
                required
              />
              <FilaCampos>
                <Campo etiqueta="RUC" name="ruc" defaultValue={configuracion.ruc ?? ''} />
                <Campo
                  etiqueta="Teléfono"
                  name="telefono"
                  type="tel"
                  defaultValue={configuracion.telefono ?? ''}
                />
              </FilaCampos>
              <Campo
                etiqueta="Dirección"
                name="direccion"
                defaultValue={configuracion.direccion ?? ''}
              />
              <Campo
                etiqueta="Correo electrónico"
                name="email"
                type="email"
                defaultValue={configuracion.email ?? ''}
                error={errores.email}
              />
            </GrupoCampos>

            <GrupoCampos titulo="Moneda y zona horaria">
              <FilaCampos>
                <Campo
                  etiqueta="Moneda"
                  name="moneda"
                  defaultValue={configuracion.moneda}
                  maxLength={3}
                  ayuda="Código de tres letras. En Paraguay, PYG."
                  error={errores.moneda}
                  required
                />
                <CampoSelector
                  etiqueta="Zona horaria"
                  name="zona_horaria"
                  defaultValue={configuracion.zona_horaria}
                  opciones={[{ valor: 'America/Asuncion', etiqueta: 'America/Asuncion' }]}
                  error={errores.zona_horaria}
                  required
                />
              </FilaCampos>
            </GrupoCampos>

            <GrupoCampos titulo="Notificaciones">
              <FilaCampos>
                <Campo
                  etiqueta="Recordatorio de turno"
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
                  etiqueta="Reintentos de notificación"
                  name="max_reintentos_notif"
                  type="number"
                  min={0}
                  defaultValue={configuracion.max_reintentos_notif}
                  error={errores.max_reintentos_notif}
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
