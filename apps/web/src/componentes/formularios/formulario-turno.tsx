'use client';

import { useState } from 'react';

import type { Cliente, Profesional, Servicio } from '@barber-shop/tipos';
import {
  Boton, BotonIcono, Campo, CampoArea, CampoSelector, FilaCampos, GrupoCampos, guaranies,
} from '@barber-shop/ui';

import { guardarTurno } from '@/acciones/agenda';
import { PanelFormulario } from './panel-formulario';

/** Una linea del turno. `clave` solo existe para React, no se envia. */
interface LineaServicio {
  clave: number;
  idServicio: string;
  idProfesional: string;
}

const LINEA_VACIA = (clave: number): LineaServicio => ({
  clave,
  idServicio: '',
  idProfesional: '',
});

/**
 * CU-006 - alta de un turno.
 *
 * Es el unico formulario del sistema con una lista adentro: un turno puede
 * llevar varios servicios, cada uno con su barbero. Por eso usa el ancho `lg`.
 *
 * Los servicios van como campos repetidos con el mismo `name`, que es como el
 * navegador envia una lista sin necesidad de JavaScript. La accion los lee con
 * `getAll` y empareja por posicion.
 *
 * La disponibilidad del barbero NO se comprueba aca. La verifica `crearCita`
 * contra los turnos ya agendados, que es el unico lugar donde el dato es
 * confiable: entre que se abre el panel y se guarda, otro usuario pudo tomar
 * el horario.
 */
export function FormularioTurno({
  clientes,
  servicios,
  profesionales,
  fecha,
}: {
  clientes: Cliente[];
  servicios: Servicio[];
  profesionales: Profesional[];
  /** Dia que se esta mirando en la agenda. Es el que mas probablemente se quiere. */
  fecha: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [lineas, setLineas] = useState<LineaServicio[]>([LINEA_VACIA(0)]);

  const agregar = () =>
    setLineas((l) => [...l, LINEA_VACIA(Math.max(...l.map((x) => x.clave)) + 1)]);
  const quitar = (clave: number) => setLineas((l) => l.filter((x) => x.clave !== clave));
  const cambiar = (clave: number, campo: keyof LineaServicio, valor: string) =>
    setLineas((l) => l.map((x) => (x.clave === clave ? { ...x, [campo]: valor } : x)));

  const porId = new Map(servicios.map((s) => [String(s.id_servicio), s]));
  const elegidos = lineas.map((l) => porId.get(l.idServicio)).filter(Boolean) as Servicio[];
  const duracion = elegidos.reduce((s, x) => s + x.duracion_min, 0);
  const total = elegidos.reduce((s, x) => s + x.precio_base, 0);

  return (
    <>
      <Boton variante="primario" icono="plus" onClick={() => setAbierto(true)}>
        Nuevo turno
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        ancho="lg"
        titulo="Nuevo turno"
        descripcion="El sistema avisa si el barbero ya tiene otro turno a esa hora."
        accion={guardarTurno}
        textoGuardar="Agendar turno"
      >
        {(errores) => (
          <>
            <GrupoCampos titulo="Cliente y horario">
              <CampoSelector
                etiqueta="Cliente"
                name="id_cliente"
                opciones={clientes.map((c) => ({ valor: c.id_cliente, etiqueta: c.nombre }))}
                marcador="Elija un cliente"
                error={errores.id_cliente}
                required
              />
              <FilaCampos>
                <Campo
                  etiqueta="Fecha"
                  name="fecha"
                  type="date"
                  defaultValue={fecha}
                  error={errores.fecha}
                  required
                />
                <Campo
                  etiqueta="Hora"
                  name="hora"
                  type="time"
                  step={300}
                  error={errores.hora}
                  required
                />
              </FilaCampos>
            </GrupoCampos>

            <GrupoCampos titulo="Servicios">
              <div className="flex flex-col gap-3">
                {lineas.map((linea, i) => (
                  <div key={linea.clave} className="flex items-end gap-3">
                    <CampoSelector
                      etiqueta={i === 0 ? 'Servicio' : ''}
                      aria-label={i === 0 ? undefined : `Servicio ${i + 1}`}
                      name="id_servicio"
                      value={linea.idServicio}
                      onChange={(e) => cambiar(linea.clave, 'idServicio', e.target.value)}
                      opciones={servicios.map((s) => ({
                        valor: s.id_servicio,
                        etiqueta: `${s.nombre} · ${s.duracion_min} min · ${guaranies(s.precio_base)}`,
                      }))}
                      marcador="Elija un servicio"
                      error={i === 0 ? errores.id_servicio : undefined}
                      claseContenedor="flex-1"
                    />
                    <CampoSelector
                      etiqueta={i === 0 ? 'Barbero' : ''}
                      aria-label={i === 0 ? undefined : `Barbero del servicio ${i + 1}`}
                      name="id_profesional"
                      value={linea.idProfesional}
                      onChange={(e) => cambiar(linea.clave, 'idProfesional', e.target.value)}
                      opciones={profesionales.map((p) => ({
                        valor: p.id_profesional,
                        etiqueta: p.nombre,
                      }))}
                      marcador="Elija un barbero"
                      error={i === 0 ? errores.id_profesional : undefined}
                      claseContenedor="flex-1"
                    />
                    <div className="pb-1">
                      <BotonIcono
                        icono="trash-2"
                        etiqueta={`Quitar el servicio ${i + 1}`}
                        variante="terciario"
                        tamano="sm"
                        onClick={() => quitar(linea.clave)}
                        disabled={lineas.length === 1}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <Boton variante="secundario" icono="plus" tamano="sm" onClick={agregar}>
                  Agregar otro servicio
                </Boton>
              </div>
            </GrupoCampos>

            {elegidos.length > 0 && (
              <div className="border-marca bg-elevado flex items-baseline justify-between rounded-md border-l-2 px-3 py-2">
                <span className="text-terciario text-cuerpo-sm">
                  {duracion} min en total
                </span>
                <span className="font-display text-principal text-display-sm tabular-nums">
                  {guaranies(total)}
                </span>
              </div>
            )}

            <GrupoCampos titulo="Observaciones">
              <CampoArea
                etiqueta="Notas del turno"
                name="observaciones"
                placeholder="Viene con su hijo, prefiere la máquina del 2"
              />
            </GrupoCampos>
          </>
        )}
      </PanelFormulario>
    </>
  );
}
