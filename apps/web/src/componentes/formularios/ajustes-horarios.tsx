'use client';

import { useState } from 'react';

import type { HorarioAtencion } from '@barber-shop/tipos';
import {
  Campo,
  Interruptor,
  cn,
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  diaSemana,
} from '@barber-shop/ui';

import { guardarHorarios } from '@/acciones/configuracion';
import { FormularioAjustes } from './formulario-ajustes';

/**
 * CU-020 - horario de atencion.
 *
 * Hasta el 9/9/2026 esto era una tabla de solo lectura: el horario se veia en
 * pantalla y se cambiaba en la base a mano. Ahora cada dia es una fila
 * editable.
 *
 * POR QUE NO ES UNA `Tabla`
 *
 * La tabla del sistema (seccion 9.5) esta hecha para filas que se leen,
 * ordenan y filtran. Estas son siete filas fijas y el objetivo es escribir en
 * ellas. Una lista de filas con campos adentro dice mejor lo que es, y en
 * movil se apila sin necesidad del modo tarjeta.
 *
 * LAS HORAS QUEDAN VISIBLES EN LOS DIAS CERRADOS
 *
 * Podrian ocultarse o deshabilitarse, pero el horario del dia cerrado es justo
 * el que hace falta ver para decidir si se vuelve a abrir. Y la base exige
 * `hora_cierre > hora_apertura` tambien cuando el dia esta cerrado: si los
 * campos estuvieran deshabilitados no se enviarian, y guardar fallaria con un
 * error que el usuario no podria corregir desde ningun lado.
 */
export function AjustesHorarios({ horarios }: { horarios: HorarioAtencion[] }) {
  return (
    <FormularioAjustes id="ajustes-horarios" accion={guardarHorarios}>
      {(errores) => (
        <Tarjeta>
          <TarjetaEncabezado
            titulo="Horario de atención"
            descripcion="Define qué franjas admiten turnos. Un día cerrado no ofrece ningún horario al reservar."
          />
          <TarjetaCuerpo>
            <ul className="divide-borde-sutil divide-y">
              {horarios.map((h) => (
                <FilaDia key={h.id_horario} horario={h} errores={errores} />
              ))}
            </ul>
          </TarjetaCuerpo>
        </Tarjeta>
      )}
    </FormularioAjustes>
  );
}

/**
 * Un dia.
 *
 * Es su propio componente por el estado del interruptor: la fila se atenua al
 * cerrarse, y para eso hace falta saber en el navegador si esta encendida. El
 * resto de los campos siguen sin control -van con `defaultValue`-, de modo que
 * escribir una hora no vuelve a dibujar los otros seis dias.
 */
function FilaDia({
  horario,
  errores,
}: {
  horario: HorarioAtencion;
  errores: Record<string, string>;
}) {
  const [abierto, setAbierto] = useState(horario.activo);
  const id = horario.id_horario;

  /** `HH:mm:ss` de la base -> `HH:mm`, que es lo que acepta un `input type="time"`. */
  const soloHora = (h: string) => h.slice(0, 5);

  return (
    <li className="grid items-start gap-4 py-4 sm:grid-cols-[1fr_auto]">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-cuerpo text-principal font-medium capitalize">
          {diaSemana(horario.dia_semana)}
        </p>
        {/* El `id_horario` viaja oculto: es lo que le dice a la accion que
            filas llegaron, sin depender de que los campos se hayan enviado. */}
        <input type="hidden" name="id_horario" value={id} />
        <Interruptor
          name={`activo_${id}`}
          etiqueta={abierto ? 'Abierto' : 'Cerrado'}
          checked={abierto}
          onChange={setAbierto}
        />
      </div>

      {/* El dia cerrado se atenua pero NO se bloquea: es una senal de que esas
          horas no rigen hoy, sin quitarle al usuario la posibilidad de dejarlas
          listas para cuando vuelva a abrir. */}
      <div
        className={cn(
          'flex flex-wrap gap-3 transition-opacity duration-[var(--movimiento-rapido)]',
          !abierto && 'opacity-60',
        )}
      >
        <Campo
          etiqueta="Apertura"
          name={`apertura_${id}`}
          type="time"
          defaultValue={soloHora(horario.hora_apertura)}
          error={errores[`apertura_${id}`]}
          claseContenedor="w-full sm:w-40"
        />
        <Campo
          etiqueta="Cierre"
          name={`cierre_${id}`}
          type="time"
          defaultValue={soloHora(horario.hora_cierre)}
          error={errores[`cierre_${id}`]}
          claseContenedor="w-full sm:w-40"
        />
      </div>
    </li>
  );
}
