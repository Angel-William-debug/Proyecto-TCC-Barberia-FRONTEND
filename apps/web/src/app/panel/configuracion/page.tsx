import { listarHorarios, listarMetodosPago, obtenerConfiguracion } from '@barber-shop/api';
import {
  ChipEstado,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  Td,
  Th,
  Tr,
  diaSemana,
  duracion,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/navegacion/encabezado-vista';
import { FormularioConfiguracion } from '@/componentes/formularios/formulario-configuracion';

export const metadata = { title: 'Configuración' };

/** CU-020 — Parámetros generales del establecimiento. Fila única en la base. */
export default async function PaginaConfiguracion() {
  const [config, horarios, metodos] = await Promise.all([
    obtenerConfiguracion(),
    listarHorarios(),
    listarMetodosPago(),
  ]);

  const datos: Array<[string, string]> = [
    ['Nombre de la barbería', config?.nombre_barberia ?? '—'],
    ['RUC', config?.ruc ?? '—'],
    ['Dirección', config?.direccion ?? '—'],
    ['Teléfono', config?.telefono ?? '—'],
    ['Correo electrónico', config?.email ?? '—'],
    ['Moneda', config?.moneda ?? '—'],
    ['Zona horaria', config?.zona_horaria ?? '—'],
    [
      'Recordatorio de turno',
      config ? `${duracion(config.minutos_antes_recordatorio)} antes` : '—',
    ],
    ['Reintentos de notificación', config ? String(config.max_reintentos_notif) : '—'],
  ];

  /** `HH:mm:ss` de la base → `HH:mm` en pantalla. */
  const soloHora = (h: string) => h.slice(0, 5);

  return (
    <>
      <EncabezadoVista
        titulo="Configuración"
        descripcion="Datos del establecimiento, horarios y parámetros del sistema"
        accion={config ? <FormularioConfiguracion configuracion={config} /> : undefined}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Datos del establecimiento"
            descripcion="Aparecen en comprobantes y reportes"
          />
          <TarjetaCuerpo>
            <dl className="divide-borde-sutil divide-y">
              {datos.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="flex items-baseline justify-between gap-4 py-3">
                  <dt className="text-cuerpo-sm text-terciario">{etiqueta}</dt>
                  <dd className="text-cuerpo text-principal text-right font-medium">{valor}</dd>
                </div>
              ))}
            </dl>
          </TarjetaCuerpo>
        </Tarjeta>

        <div className="space-y-6">
          <Tarjeta>
            <TarjetaEncabezado
              titulo="Horario de atención"
              descripcion="Define qué franjas admiten turnos"
            />
            <Tabla titulo="Horario de atención por día de la semana">
              <TablaEncabezado>
                <Th>Día</Th>
                <Th>Apertura</Th>
                <Th>Cierre</Th>
                <Th>Estado</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {horarios.map((h) => (
                  <Tr key={h.id_horario}>
                    <Td className="font-medium capitalize" etiqueta="Día">{diaSemana(h.dia_semana)}</Td>
                    <Td className="font-mono" etiqueta="Apertura">{soloHora(h.hora_apertura)}</Td>
                    <Td className="font-mono" etiqueta="Cierre">{soloHora(h.hora_cierre)}</Td>
                    <Td etiqueta="Estado">
                      <ChipEstado
                        presentacion={
                          h.activo
                            ? { etiqueta: 'Abierto', tono: 'exito', icono: 'circle-check' }
                            : { etiqueta: 'Cerrado', tono: 'neutro', icono: 'ban' }
                        }
                      />
                    </Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          </Tarjeta>

          <Tarjeta>
            <TarjetaEncabezado titulo="Métodos de pago" />
            <Tabla titulo="Métodos de pago habilitados">
              <TablaEncabezado>
                <Th>Método</Th>
                <Th>Estado</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {metodos.map((m) => (
                  <Tr key={m.id_metodo}>
                    <Td className="font-medium" etiqueta="Método">{m.nombre}</Td>
                    <Td etiqueta="Estado">
                      <ChipEstado
                        presentacion={{
                          etiqueta: 'Habilitado',
                          tono: 'exito',
                          icono: 'circle-check',
                        }}
                      />
                    </Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          </Tarjeta>
        </div>
      </div>
    </>
  );
}
