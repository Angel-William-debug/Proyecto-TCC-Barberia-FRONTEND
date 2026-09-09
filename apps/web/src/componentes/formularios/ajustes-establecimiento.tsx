'use client';

import type { ConfiguracionSistema } from '@barber-shop/tipos';
import {
  Campo,
  CampoSelector,
  FilaCampos,
  GrupoCampos,
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
} from '@barber-shop/ui';

import { guardarDatosEstablecimiento } from '@/acciones/configuracion';
import { FormularioAjustes } from './formulario-ajustes';

/**
 * CU-020 - datos del establecimiento.
 *
 * La fila es unica y la crea la instalacion: no hay alta que ofrecer, solo
 * edicion. Por eso los campos estan siempre abiertos y no detras de un boton
 * «Editar»: no habia nada que el usuario tuviera que decidir antes de escribir.
 */
export function AjustesEstablecimiento({
  configuracion,
}: {
  configuracion: ConfiguracionSistema;
}) {
  return (
    <FormularioAjustes id="ajustes-establecimiento" accion={guardarDatosEstablecimiento}>
      {(errores) => (
        <>
          <Tarjeta>
            <TarjetaEncabezado
              titulo="Identificación"
              descripcion="Estos datos salen impresos en los comprobantes y en los reportes."
            />
            <TarjetaCuerpo>
              <GrupoCampos>
                <Campo
                  etiqueta="Nombre de la barbería"
                  name="nombre_barberia"
                  defaultValue={configuracion.nombre_barberia}
                  error={errores.nombre_barberia}
                  ayuda="Es el que encabeza cada factura y cada reporte."
                  required
                />
                <FilaCampos>
                  <Campo
                    etiqueta="RUC"
                    name="ruc"
                    defaultValue={configuracion.ruc ?? ''}
                    ayuda="Opcional. Con guion y dígito verificador."
                  />
                  <Campo
                    etiqueta="Teléfono"
                    name="telefono"
                    type="tel"
                    defaultValue={configuracion.telefono ?? ''}
                  />
                </FilaCampos>
              </GrupoCampos>
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado
              titulo="Contacto"
              descripcion="Donde encuentra el cliente a la barbería."
            />
            <TarjetaCuerpo>
              <GrupoCampos>
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
            </TarjetaCuerpo>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado
              titulo="Moneda y zona horaria"
              descripcion="Con qué se expresan los importes y contra qué reloj se agendan los turnos."
            />
            <TarjetaCuerpo>
              <GrupoCampos>
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
                  {/* Una sola opcion, y aun asi un selector: el dia que la
                      barberia abra una sucursal en otro huso, agregar la zona
                      es agregar una linea aca y nada mas. Un campo de texto
                      libre, en cambio, admitiria «Asuncion» y romperia todos
                      los horarios sin decir por que. */}
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
            </TarjetaCuerpo>
          </Tarjeta>
        </>
      )}
    </FormularioAjustes>
  );
}
