import Link from 'next/link';

import { Boton, Icono, type NombreIcono } from '@barber-shop/ui';

import { FotosPortada } from '@/componentes/marca/fotos-portada';
import { LogoHorizontal } from '@/componentes/marca/logo';
import { SelectorTema } from '@/componentes/armazon/selector-tema';

export const metadata = {
  title: 'Gestión para barberías',
};

const CAPACIDADES: Array<{ icono: NombreIcono; titulo: string; texto: string }> = [
  {
    icono: 'calendar-days',
    titulo: 'Agenda sin superposiciones',
    texto:
      'La base rechaza dos turnos del mismo barbero en el mismo horario. No es una ' +
      'validación de pantalla que se pueda saltear: es una regla de la base de datos.',
  },
  {
    icono: 'user-round',
    titulo: 'Historial completo del cliente',
    texto:
      'Cada servicio queda registrado con su barbero, su precio y sus observaciones. ' +
      'El cliente que vuelve a los tres meses no tiene que explicar cómo se corta.',
  },
  {
    icono: 'receipt',
    titulo: 'Cobros y comisiones enlazados',
    texto:
      'Al cerrar un servicio se genera la comisión del barbero automáticamente. ' +
      'Una comisión liquidada ya no se puede modificar.',
  },
  {
    icono: 'package',
    titulo: 'Inventario que descuenta solo',
    texto:
      'Cada servicio consume los productos de su receta. El stock admite consumos ' +
      'parciales, porque medio frasco es medio frasco.',
  },
  {
    icono: 'chart-column',
    titulo: 'Indicadores del negocio',
    texto:
      'Ingresos del período, ticket promedio, tasa de cancelación y comisiones ' +
      'pendientes, calculados por la base y no a mano.',
  },
  {
    icono: 'brain',
    titulo: 'Recomendaciones aprendidas',
    texto:
      'Un motor de agrupamiento y filtrado colaborativo sugiere el próximo servicio ' +
      'a partir del historial real de cada cliente.',
  },
];

const PROBLEMAS = [
  {
    titulo: 'El cuaderno se pierde',
    texto: 'Los turnos anotados a mano no se pueden consultar, ni buscar, ni respaldar.',
  },
  {
    titulo: 'Nadie sabe cuánto se ganó',
    texto: 'Sin registro de cobros no hay forma de saber si el mes fue mejor que el anterior.',
  },
  {
    titulo: 'El producto se acaba sin aviso',
    texto: 'El faltante se descubre con el cliente sentado en el sillón.',
  },
  {
    titulo: 'La comisión se calcula de memoria',
    texto: 'Y se discute a fin de mes, que es cuando ya nadie recuerda los detalles.',
  },
];

export default function Portada() {
  return (
    <div className="bg-fondo min-h-screen">
      {/* ------------------------------------------------ barra superior */}
      <header className="border-borde-sutil bg-navegacion sticky top-0 z-40 border-b">
        <nav
          className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-6"
          aria-label="Principal"
        >
          <LogoHorizontal />

          <div className="hidden items-center gap-8 md:flex">
            <a href="#problemas" className="text-cuerpo text-secundario hover:text-principal">
              El problema
            </a>
            <a href="#capacidades" className="text-cuerpo text-secundario hover:text-principal">
              Qué resuelve
            </a>
          </div>

          <div className="flex items-center gap-2">
            <SelectorTema />
            <Link href="/ingresar">
              <Boton variante="primario" tamano="sm">
                Ingresar
              </Boton>
            </Link>
          </div>
        </nav>
      </header>

      <main id="contenido">
        {/* -------------------------------------------------------- hero */}
        <section className="mx-auto max-w-[1440px] px-6 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-titulillo text-marca font-semibold tracking-[0.08em] uppercase">
                Trabajo de Conclusión de Curso
              </p>

              <h1 className="font-display text-principal mt-4 text-[2.75rem] leading-[1.05] font-semibold sm:text-[3.5rem]">
                La barbería funciona.
                <br />
                <span className="text-marca">La gestión, también.</span>
              </h1>

              <p className="text-cuerpo-lg text-secundario medida-lectura mt-6">
                Barber Shop reúne agenda, clientes, cobros, comisiones e inventario en un solo
                sistema, y usa el historial de cada cliente para recomendar el próximo servicio.
              </p>

              {/* Una sola acción primaria, según la sección 4.9 del sistema de
                  diseño. Las cifras internas del proyecto (tablas, políticas,
                  vistas) y el enlace al sistema de diseño se quitaron de aquí:
                  son detalles de construcción que no le dicen nada a quien va
                  a usar la barbería. La galería sigue disponible escribiendo
                  /sistema-de-diseno, para revisiones y capturas del TCC. */}
              <div className="mt-8">
                <Link href="/ingresar">
                  <Boton variante="primario" tamano="lg" icono="log-out">
                    Ingresar al sistema
                  </Boton>
                </Link>
              </div>
            </div>

            {/* Composición fotográfica del oficio. En móvil se muestra debajo
                del texto, centrada y con ancho acotado: a pantalla completa la
                foto superpuesta quedaría desproporcionada frente al titular. */}
            <FotosPortada className="mx-auto w-full max-w-xs sm:max-w-sm lg:mx-0 lg:max-w-none" />
          </div>
        </section>

        {/* --------------------------------------------------- problemas */}
        <section id="problemas" className="border-borde-sutil bg-superficie border-y">
          <div className="mx-auto max-w-[1440px] px-6 py-20">
            <h2 className="font-display text-principal text-display-xl text-center font-semibold">
              Lo que pasa cuando no hay sistema
            </h2>
            <p className="text-cuerpo-lg text-secundario mx-auto mt-4 max-w-2xl text-center">
              Cuatro problemas que aparecen en toda barbería que crece y sigue anotando en papel.
            </p>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PROBLEMAS.map((p) => (
                <li
                  key={p.titulo}
                  className="border-borde-sutil bg-fondo rounded-lg border p-6"
                >
                  <Icono nombre="circle-alert" tamano="md" className="text-peligro" />
                  <h3 className="text-titulo-3 text-principal mt-4 font-semibold">{p.titulo}</h3>
                  <p className="text-cuerpo-sm text-terciario mt-2">{p.texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* -------------------------------------------------- capacidades */}
        <section id="capacidades" className="mx-auto max-w-[1440px] px-6 py-20">
          <h2 className="font-display text-principal text-display-xl text-center font-semibold">
            Qué resuelve Barber Shop
          </h2>

          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {CAPACIDADES.map((c) => (
              <li
                key={c.titulo}
                className="border-borde-sutil bg-superficie rounded-lg border p-6"
              >
                <span className="bg-elevado inline-flex h-10 w-10 items-center justify-center rounded-md">
                  <Icono nombre={c.icono} tamano="md" className="text-marca" />
                </span>
                <h3 className="text-titulo-3 text-principal mt-4 font-semibold">{c.titulo}</h3>
                <p className="text-cuerpo-sm text-secundario mt-2">{c.texto}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* ------------------------------------------------------- pie */}
      <footer className="border-borde-sutil bg-navegacion border-t">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <LogoHorizontal />
            <p className="text-cuerpo-sm text-terciario mt-3 max-w-md">
              Plataforma web para la gestión de clientes y recomendaciones basadas en aprendizaje
              automático para barberías en Paraguay.
            </p>
          </div>

          <div className="text-cuerpo-sm text-terciario sm:text-right">
            <p>Universidad Columbia del Paraguay — Filial San Lorenzo</p>
            <p className="mt-1">Angel Rolón Martínez · William Giménez Delvalle</p>
            <p className="mt-1">Directora: Prof. Dra. Mirtha Graciela Villagra Ferreira</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
