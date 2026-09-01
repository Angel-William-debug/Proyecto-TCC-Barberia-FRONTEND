import { horariosPublicos, miPerfil } from '@barber-shop/api';
import { Icono, diaSemana, fechaCorta } from '@barber-shop/ui';

import { FormularioPerfil } from '@/componentes/portal/formulario-perfil';

export const metadata = {
  title: 'Mi perfil',
};

/** `09:00:00` -> `09:00`. Los segundos del `time` de la base no dicen nada. */
function hhmm(valor: string): string {
  return valor.slice(0, 5);
}

export default async function Perfil() {
  const [perfil, horarios] = await Promise.all([miPerfil(), horariosPublicos()]);

  return (
    <div className="mt-2 flex flex-col gap-10">
      <section>
        <h1 className="font-display text-principal text-display-sm font-semibold">Mi perfil</h1>
        <p className="text-cuerpo-sm text-terciario mt-2">
          Cliente desde el {fechaCorta(perfil.fechaRegistro)}.
        </p>

        <FormularioPerfil perfil={perfil} />
      </section>

      {/* El horario vive aca y no en una pantalla propia: es un dato que se
          consulta una vez y no justifica una seccion en la navegacion. */}
      <section className="border-borde-sutil border-t pt-8">
        <h2 className="font-display text-principal text-titulo-1 font-semibold">
          Horario de atención
        </h2>

        <ul className="border-borde-sutil bg-superficie mt-4 divide-y divide-[var(--borde-sutil)] overflow-hidden rounded-lg border">
          {horarios.map((h) => (
            <li
              key={h.dia_semana}
              className="flex items-center justify-between gap-4 px-4 py-3"
            >
              <span className="text-cuerpo text-principal capitalize">
                {diaSemana(h.dia_semana)}
              </span>

              {h.activo ? (
                <span className="text-cuerpo text-secundario tabular-nums">
                  {hhmm(h.hora_apertura)} a {hhmm(h.hora_cierre)}
                </span>
              ) : (
                <span className="text-cuerpo-sm text-terciario flex items-center gap-1.5">
                  <Icono nombre="x" tamano="xs" />
                  Cerrado
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
