'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition } from 'react';

import type { FranjaDisponible, VistaPublicoBarbero, VistaPublicoServicio } from '@barber-shop/tipos';
import {
  AvisoFormulario,
  Boton,
  CampoArea,
  Icono,
  cn,
  duracion,
  guaranies,
  hora,
  plural,
} from '@barber-shop/ui';

import { accionReservarTurno } from '@/acciones/portal';

/**
 * La reserva entera en una sola tarjeta: cuatro selectores y un boton.
 *
 * POR QUE SELECTORES Y NO LISTAS
 *
 * La primera version apilaba una tarjeta por servicio, una grilla con un boton
 * cada quince minutos y una tarjeta por barbero. Todo visible a la vez, y por
 * eso habia que bajar dos pantallas para llegar al boton de reservar. La
 * directora lo marco como tedioso. Con desplegables la pantalla entera cabe
 * sin desplazarse, en la computadora y en el telefono, y lo que no se esta
 * eligiendo no ocupa lugar.
 *
 * Hora y barbero son `select` nativos, igual que `CampoSelector` (9.11.3): en
 * el telefono abren la rueda del sistema. Servicios admite varios valores y
 * ningun control nativo lo resuelve con el pulgar, asi que usa el mismo
 * `<details>` que `SelectorMultiple` en los filtros.
 *
 * SIEMPRE SE VE POR QUE UNA HORA NO SE PUEDE ELEGIR
 *
 * La base devuelve todas las franjas del dia, llenas incluidas
 * (`p_incluir_llenas`). Una hora llena aparece como «Lleno» y deshabilitada,
 * en vez de desaparecer: si desapareciera, el cliente no sabria si esta llena
 * o si a esa hora no se atiende. Con un barbero elegido la lista pasa a ser su
 * agenda -«Libre» u «Ocupado»-, y al reves, con una hora elegida, el selector
 * de barbero marca a los ocupados.
 *
 * EL ESTADO SE PARTE EN DOS
 *
 * Servicios y dia viven en la URL (regla 3, seccion 9.9): de ellos depende que
 * franjas le pide el servidor a la base. Hora, barbero y nota viven en el
 * componente: no cambian la consulta, y en la URL sobrevivirian a un cambio de
 * dia donde ya no tienen sentido.
 */
export function FormularioReserva({
  servicios,
  hoy,
  franjas,
  barberos,
}: {
  /** El catalogo entero. */
  servicios: VistaPublicoServicio[];
  /** aaaa-MM-dd de hoy en la zona de la barberia, calculado en el servidor. */
  hoy: string;
  /** Todas las franjas del dia, llenas incluidas. Vacio si falta servicio o dia. */
  franjas: FranjaDisponible[];
  barberos: VistaPublicoBarbero[];
}) {
  const router = useRouter();
  const ruta = usePathname();
  const params = useSearchParams();
  const [actualizando, iniciarNavegacion] = useTransition();
  const [enviando, iniciarEnvio] = useTransition();

  const idFecha = useId();
  const idBarbero = useId();
  const idHora = useId();

  const [inicio, setInicio] = useState('');
  const [idProfesional, setIdProfesional] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------------ lo que dice la URL
  const elegidos = (params.get('servicio') ?? '')
    .split(',')
    .map((n) => Number(n))
    .filter((n) => Number.isFinite(n) && n > 0);
  const fecha = params.get('fecha') ?? '';

  const seleccionados = elegidos
    .map((id) => servicios.find((s) => s.id_servicio === id))
    .filter((s): s is VistaPublicoServicio => Boolean(s));
  const duracionTotal = seleccionados.reduce((n, s) => n + s.duracion_min, 0);
  const precioTotal = seleccionados.reduce((n, s) => n + s.precio_base, 0);
  const listo = seleccionados.length > 0 && Boolean(fecha);

  function aplicar(cambios: Record<string, string>) {
    const siguientes = new URLSearchParams(params.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguientes.set(clave, valor);
      else siguientes.delete(clave);
    }
    const consulta = siguientes.toString();
    setError(null);
    iniciarNavegacion(() => {
      router.push(consulta ? `${ruta}?${consulta}` : ruta, { scroll: false });
    });
  }

  function alternarServicio(id: number) {
    const siguiente = elegidos.includes(id)
      ? elegidos.filter((n) => n !== id)
      : [...elegidos, id];
    aplicar({ servicio: siguiente.join(',') });
  }

  // --------------------------------------------------- disponibilidad actual
  const libreEn = (f: FranjaDisponible, id: number | null) =>
    id == null ? f.barberos_disponibles > 0 : f.ids_barberos.includes(id);

  // La hora elegida se valida contra las franjas de AHORA, no contra las de
  // cuando se eligio: al cambiar de servicio o de dia llegan otras, y la que
  // estaba elegida puede no existir o haberse llenado. Derivarlo evita un
  // efecto que la borre y el parpadeo de un render con un valor imposible.
  const franja = franjas.find((f) => f.inicio === inicio && libreEn(f, idProfesional)) ?? null;

  // Sin preferencia se asigna el primer barbero libre, que es lo que hacia la
  // version anterior y lo que quiere la mayoria.
  const barberoFinal = idProfesional ?? franja?.ids_barberos[0] ?? null;
  const nombreFinal = barberos.find((b) => b.id_profesional === barberoFinal)?.nombre;

  const libres = franjas.filter((f) => libreEn(f, idProfesional)).length;
  const llenas = franjas.length - libres;

  const manana = franjas.filter((f) => Number(f.hora_local.slice(0, 2)) < 12);
  const tarde = franjas.filter((f) => Number(f.hora_local.slice(0, 2)) >= 12);

  function etiquetaFranja(f: FranjaDisponible) {
    if (idProfesional != null) {
      return `${hora(f.inicio)} · ${libreEn(f, idProfesional) ? 'Libre' : 'Ocupado'}`;
    }
    return f.barberos_disponibles > 0
      ? `${hora(f.inicio)} · ${plural(f.barberos_disponibles, 'lugar libre', 'lugares libres')}`
      : `${hora(f.inicio)} · Lleno`;
  }

  // ------------------------------------------------------------------ envio
  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!franja || barberoFinal == null) return;

    const datos = new FormData(evento.currentTarget);
    datos.set('fechaHora', franja.inicio);
    datos.set('idProfesional', String(barberoFinal));
    // Repetido, no separado por comas: es como el navegador envia una lista y
    // como `datos.getAll('idServicio')` la lee del otro lado.
    for (const s of seleccionados) datos.append('idServicio', String(s.id_servicio));

    setError(null);
    iniciarEnvio(async () => {
      const r = await accionReservarTurno(datos);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      router.push('/mi-cuenta');
    });
  }

  const marcadorHora = !seleccionados.length
    ? 'Elija primero el servicio'
    : !fecha
      ? 'Elija primero el día'
      : actualizando
        ? 'Buscando horarios…'
        : franjas.length === 0
          ? 'No hay horarios ese día'
          : 'Elija una hora';

  return (
    <form
      onSubmit={enviar}
      noValidate
      className="border-borde-sutil bg-superficie rounded-lg border p-4 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* ----------------------------------------------------- servicios */}
        <SelectorServicios
          servicios={servicios}
          elegidos={elegidos}
          seleccionados={seleccionados}
          alternar={alternarServicio}
        />

        {/* ----------------------------------------------------------- dia */}
        <div className="flex flex-col gap-2">
          <label htmlFor={idFecha} className="text-etiqueta text-secundario font-medium">
            Día
          </label>
          <input
            id={idFecha}
            type="date"
            value={fecha}
            // `min` evita el caso mas comun de error antes de que ocurra: el
            // disparador `trg_cita_validar` rechaza una cita en el pasado.
            min={hoy}
            onChange={(e) => aplicar({ fecha: e.target.value })}
            className="bg-fondo border-borde-control text-principal text-cuerpo h-11 w-full rounded-md border px-3"
          />
        </div>

        {/* ------------------------------------------------------- barbero */}
        <div className="flex flex-col gap-2">
          <label htmlFor={idBarbero} className="text-etiqueta text-secundario font-medium">
            Barbero
          </label>
          <select
            id={idBarbero}
            value={idProfesional ?? ''}
            onChange={(e) => {
              setIdProfesional(e.target.value ? Number(e.target.value) : null);
              setError(null);
            }}
            className="bg-fondo border-borde-control text-principal text-cuerpo h-11 w-full rounded-md border px-3"
          >
            <option value="">Cualquiera, el primero libre</option>
            {barberos.map((b) => {
              // Con una hora elegida, el ocupado se ve como tal y no se puede
              // elegir. Sin hora, todos estan disponibles para filtrar.
              const ocupado = franja != null && !franja.ids_barberos.includes(b.id_profesional);
              return (
                <option key={b.id_profesional} value={b.id_profesional} disabled={ocupado}>
                  {b.nombre}
                  {ocupado ? ` · ocupado a las ${hora(franja.inicio)}` : ''}
                </option>
              );
            })}
          </select>
        </div>

        {/* ---------------------------------------------------------- hora */}
        <div className="flex flex-col gap-2">
          <label htmlFor={idHora} className="text-etiqueta text-secundario font-medium">
            Hora
          </label>
          <select
            id={idHora}
            value={franja?.inicio ?? ''}
            disabled={!listo || actualizando || franjas.length === 0}
            onChange={(e) => {
              setInicio(e.target.value);
              setError(null);
            }}
            aria-describedby={`${idHora}-ayuda`}
            className={cn(
              'bg-fondo border-borde-control text-principal text-cuerpo h-11 w-full rounded-md border px-3',
              'disabled:bg-superficie disabled:text-deshabilitado disabled:cursor-not-allowed',
            )}
          >
            <option value="">{marcadorHora}</option>
            {[
              { nombre: 'Mañana', lista: manana },
              { nombre: 'Tarde', lista: tarde },
            ]
              .filter((g) => g.lista.length)
              .map((g) => (
                <optgroup key={g.nombre} label={g.nombre}>
                  {g.lista.map((f) => (
                    <option key={f.inicio} value={f.inicio} disabled={!libreEn(f, idProfesional)}>
                      {etiquetaFranja(f)}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
          <p id={`${idHora}-ayuda`} className="text-cuerpo-sm text-terciario">
            {!listo || actualizando
              ? `Se calcula con la duración de lo que elija${duracionTotal ? `: ${duracion(duracionTotal)}` : ''}.`
              : franjas.length === 0
                ? // Los motivos posibles, porque desde afuera no se distinguen.
                  'Puede que ese día no se atienda o que no quede un hueco tan largo. Pruebe otra fecha.'
                : libres === 0
                  ? idProfesional != null
                    ? 'Ese barbero no tiene horarios libres ese día. Pruebe con «Cualquiera».'
                    : 'Ese día está completo. Pruebe otra fecha.'
                  : `${plural(libres, 'horario libre', 'horarios libres')}${llenas ? ` · ${llenas} ${idProfesional != null ? (llenas === 1 ? 'ocupado' : 'ocupados') : llenas === 1 ? 'lleno' : 'llenos'}` : ''}.`}
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------- nota */}
      <details className="group mt-4">
        <summary className="text-cuerpo-sm text-secundario hover:text-principal inline-flex cursor-pointer list-none items-center gap-1 select-none [&::-webkit-details-marker]:hidden">
          <Icono nombre="chevron-right" tamano="xs" className="transition-transform group-open:rotate-90" />
          Agregar una nota para el barbero (opcional)
        </summary>
        <div className="mt-3">
          <CampoArea
            etiqueta="Nota"
            name="observaciones"
            rows={2}
            ayuda="Por ejemplo, cómo prefiere el corte."
          />
        </div>
      </details>

      {error && (
        <div className="mt-4">
          <AvisoFormulario mensaje={error} />
        </div>
      )}

      {/* ------------------------------------------------------- resumen */}
      <div className="border-borde-sutil mt-4 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-cuerpo-sm text-secundario min-w-0">
          {seleccionados.length ? (
            <>
              <span className="text-principal font-medium">
                {seleccionados.map((s) => s.nombre).join(' + ')}
              </span>{' '}
              · {duracion(duracionTotal)} ·{' '}
              <span className="text-principal font-semibold tabular-nums">
                {guaranies(precioTotal)}
              </span>
            </>
          ) : (
            'Todavía no eligió ningún servicio.'
          )}
        </p>
        <Boton
          type="submit"
          variante="primario"
          tamano="lg"
          cargando={enviando}
          disabled={!franja || barberoFinal == null || actualizando}
        >
          {franja ? `Reservar ${hora(franja.inicio)} con ${nombreFinal ?? 'el barbero'}` : 'Reservar'}
        </Boton>
      </div>
    </form>
  );
}

/**
 * Desplegable de varios servicios. El mismo patron que `SelectorMultiple` de
 * los filtros, pero con precio y duracion en cada opcion y sin escribir en la
 * URL por su cuenta: eso lo decide el formulario.
 */
function SelectorServicios({
  servicios,
  elegidos,
  seleccionados,
  alternar,
}: {
  servicios: VistaPublicoServicio[];
  elegidos: number[];
  seleccionados: VistaPublicoServicio[];
  alternar: (id: number) => void;
}) {
  const contenedor = useRef<HTMLDetailsElement>(null);

  // Cierra al hacer clic fuera. `<details>` no lo hace por su cuenta.
  useEffect(() => {
    function alClicar(evento: MouseEvent) {
      const nodo = contenedor.current;
      if (nodo?.open && !nodo.contains(evento.target as Node)) nodo.open = false;
    }
    document.addEventListener('mousedown', alClicar);
    return () => document.removeEventListener('mousedown', alClicar);
  }, []);

  const resumen =
    seleccionados.length === 0
      ? 'Elija uno o más'
      : seleccionados.length <= 2
        ? seleccionados.map((s) => s.nombre).join(' + ')
        : plural(seleccionados.length, 'servicio', 'servicios');

  return (
    <div className="flex flex-col gap-2">
      <span className="text-etiqueta text-secundario font-medium">Servicios</span>
      <details ref={contenedor} className="relative">
        <summary
          className={cn(
            'bg-fondo border-borde-control text-principal text-cuerpo',
            'flex h-11 cursor-pointer list-none items-center justify-between gap-2',
            'rounded-md border px-3 select-none',
            '[&::-webkit-details-marker]:hidden',
          )}
        >
          <span className={cn('truncate', !seleccionados.length && 'text-terciario')}>
            {resumen}
          </span>
          <Icono nombre="chevron-down" tamano="sm" className="text-terciario" />
        </summary>

        <div
          className={cn(
            'bg-elevado border-borde-sutil absolute z-20 mt-1 w-full',
            'max-h-[28rem] overflow-y-auto rounded-md border p-1 shadow-2',
          )}
        >
          <p className="text-cuerpo-sm text-terciario px-2 pt-1 pb-2">
            Puede elegir más de uno; se atienden seguidos en el mismo turno.
          </p>
          {servicios.map((s) => (
            <label
              key={s.id_servicio}
              className="hover:bg-superficie flex cursor-pointer items-center gap-2.5 rounded-sm px-2 py-2"
            >
              <input
                type="checkbox"
                checked={elegidos.includes(s.id_servicio)}
                onChange={() => alternar(s.id_servicio)}
                className="h-4 w-4 shrink-0 accent-[var(--marca)]"
              />
              <span className="min-w-0 flex-1">
                <span className="text-cuerpo text-principal block">{s.nombre}</span>
                <span className="text-cuerpo-sm text-terciario block">
                  {duracion(s.duracion_min)} · {s.categoria}
                </span>
              </span>
              <span className="text-cuerpo-sm text-secundario shrink-0 tabular-nums">
                {guaranies(s.precio_base)}
              </span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}
