import Link from 'next/link';

import {
  Boton,
  BotonIcono,
  Campo,
  ChipEstado,
  EstadoVacio,
  EsqueletoTabla,
  Icono,
  Indicador,
  PRESENTACION_CITA,
  PRESENTACION_COBRO,
  PRESENTACION_PEDIDO,
  PRESENTACION_STOCK,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaCuerpo,
  TarjetaEncabezado,
  Td,
  Th,
  Tr,
  cantidad,
  duracion,
  fechaHora,
  guaranies,
  identificador,
  porcentaje,
  telefono,
} from '@barber-shop/ui';

import { LogoHorizontal, Isotipo } from '@/componentes/marca/logo';
import { SelectorTema } from '@/componentes/sistema/selector-tema';

export const metadata = {
  title: 'Sistema de diseño',
};

/**
 * Galeria viva del sistema de diseno.
 *
 * No consulta la base: sirve para revisar la paleta y los componentes sin
 * depender de nada, y para capturar imagenes que acompanen la documentacion
 * del TCC. Si un componente se ve mal aqui, se ve mal en todo el sistema.
 */

function Seccion({
  numero,
  titulo,
  descripcion,
  children,
}: {
  numero: string;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-borde-sutil border-t py-12">
      <p className="text-titulillo text-marca font-semibold tracking-[0.08em] uppercase">
        Sección {numero}
      </p>
      <h2 className="font-display text-principal text-display-lg mt-2 font-semibold">{titulo}</h2>
      {descripcion && (
        <p className="text-cuerpo text-secundario medida-lectura mt-2">{descripcion}</p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Muestra({ nombre, valor }: { nombre: string; valor: string }) {
  return (
    <div className="border-borde-sutil overflow-hidden rounded-md border">
      <div className="h-16 w-full" style={{ background: `var(${valor})` }} />
      <div className="bg-superficie px-3 py-2">
        <p className="text-cuerpo-sm text-principal font-medium">{nombre}</p>
        <p className="text-etiqueta text-terciario font-mono">{valor}</p>
      </div>
    </div>
  );
}

export default function PaginaSistemaDeDiseno() {
  const ahora = '2026-08-16T14:30:00-03:00';

  return (
    <div className="bg-fondo min-h-screen">
      <header className="border-borde-sutil bg-navegacion sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-6">
          <Link href="/">
            <LogoHorizontal />
          </Link>
          <div className="flex items-center gap-3">
            <SelectorTema />
            <Link href="/" className="text-cuerpo text-secundario hover:text-principal">
              Volver
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto max-w-[1100px] px-6 pb-24">
        <div className="py-16">
          <div className="flex items-center gap-4">
            <Isotipo className="h-14 w-14" />
            <div>
              <h1 className="font-display text-principal text-display-xl font-semibold">
                Sistema de diseño Barber Shop
              </h1>
              <p className="text-cuerpo text-terciario mt-1">
                Versión 1.0 — implementación de los tokens y componentes documentados
              </p>
            </div>
          </div>
          <p className="text-cuerpo-lg text-secundario medida-lectura mt-6">
            Todo lo que se ve en esta página proviene de{' '}
            <code className="text-marca font-mono">packages/ui</code>. Ningún color, tamaño ni
            medida está escrito en la pantalla: si algo se ve distinto de lo documentado, el
            token está mal, no la vista.
          </p>
        </div>

        {/* ------------------------------------------------------ color */}
        <Seccion
          numero="4"
          titulo="Color"
          descripcion="Los tokens semánticos cambian con el tema; los primitivos, nunca. Use el selector de arriba para comprobarlo."
        >
          <h3 className="text-titulo-3 text-principal font-semibold">Escala Carbón</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {['950', '900', '850', '800', '700', '600', '400'].map((t) => (
              <Muestra key={t} nombre={`carbon-${t}`} valor={`--carbon-${t}`} />
            ))}
          </div>

          <h3 className="text-titulo-3 text-principal mt-10 font-semibold">Escala Ámbar</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((t) => (
              <Muestra key={t} nombre={`ambar-${t}`} valor={`--ambar-${t}`} />
            ))}
          </div>

          <h3 className="text-titulo-3 text-principal mt-10 font-semibold">Escala Crema</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {['50', '100', '200', '300', '400', '500'].map((t) => (
              <Muestra key={t} nombre={`crema-${t}`} valor={`--crema-${t}`} />
            ))}
          </div>

          <h3 className="text-titulo-3 text-principal mt-10 font-semibold">
            Semánticos y superficies
          </h3>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Muestra nombre="fondo-base" valor="--fondo-base" />
            <Muestra nombre="fondo-superficie" valor="--fondo-superficie" />
            <Muestra nombre="fondo-elevado" valor="--fondo-elevado" />
            <Muestra nombre="marca" valor="--marca" />
            <Muestra nombre="exito" valor="--exito" />
            <Muestra nombre="advertencia" valor="--advertencia" />
            <Muestra nombre="peligro" valor="--peligro" />
            <Muestra nombre="info" valor="--info" />
          </div>
        </Seccion>

        {/* ------------------------------------------------- tipografia */}
        <Seccion
          numero="5"
          titulo="Tipografía"
          descripcion="Oswald para display, Inter para la interfaz, JetBrains Mono para códigos. La escala es cerrada: cualquier tamaño fuera de esta lista no existe."
        >
          <div className="space-y-4">
            <p className="font-display text-display-2xl text-principal font-semibold">
              display-2xl · 48 px
            </p>
            <p className="font-display text-display-xl text-principal font-semibold">
              display-xl · 36 px
            </p>
            <p className="font-display text-display-lg text-principal font-semibold">
              display-lg · 30 px
            </p>
            <p className="text-titulo-1 text-principal font-semibold">titulo-1 · 24 px</p>
            <p className="text-titulo-2 text-principal font-semibold">titulo-2 · 20 px</p>
            <p className="text-titulo-3 text-principal font-semibold">titulo-3 · 18 px</p>
            <p className="text-cuerpo-lg text-principal">cuerpo-lg · 16 px</p>
            <p className="text-cuerpo text-principal">cuerpo · 14 px — la base del sistema</p>
            <p className="text-cuerpo-sm text-secundario">cuerpo-sm · 13 px</p>
            <p className="text-etiqueta text-secundario font-medium">etiqueta · 12 px</p>
            <p className="text-titulillo text-terciario font-semibold tracking-[0.08em] uppercase">
              titulillo · 11 px
            </p>
          </div>
        </Seccion>

        {/* ---------------------------------------------------- formato */}
        <Seccion
          numero="5.4"
          titulo="Números, moneda y fechas"
          descripcion="Todo pasa por packages/ui/src/formato.ts. La zona horaria se fija en America/Asuncion y no se toma del navegador."
        >
          <Tarjeta>
            <Tabla titulo="Ejemplos de formato" mostrarTitulo={false}>
              <TablaEncabezado>
                <Th>Función</Th>
                <Th>Entrada</Th>
                <Th>Resultado</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {[
                  ['guaranies', '150000', guaranies(150000)],
                  ['cantidad', '12.5', cantidad(12.5)],
                  ['porcentaje', '35.5', porcentaje(35.5)],
                  ['identificador', '142', identificador(142)],
                  ['duracion', '45', duracion(45)],
                  ['duracion', '90', duracion(90)],
                  ['fechaHora', ahora, fechaHora(ahora)],
                  ['telefono', '0981123456', telefono('0981123456')],
                ].map(([fn, entrada, salida], i) => (
                  <Tr key={i}>
                    <Td className="font-mono">{fn}</Td>
                    <Td className="text-terciario font-mono">{entrada}</Td>
                    <Td className="text-principal font-medium">{salida}</Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          </Tarjeta>
        </Seccion>

        {/* --------------------------------------------------- botones */}
        <Seccion
          numero="9.3"
          titulo="Botones"
          descripcion="Una sola acción primaria por pantalla. Navegue con la tecla Tab para ver el anillo de foco."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Boton variante="primario" icono="plus">
              Registrar cliente
            </Boton>
            <Boton variante="secundario" icono="download">
              Exportar
            </Boton>
            <Boton variante="terciario">Cancelar</Boton>
            <Boton variante="peligro" icono="trash-2">
              Eliminar
            </Boton>
            <Boton variante="peligro-sutil" tamano="sm">
              Anular
            </Boton>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Boton variante="primario" tamano="sm">
              Pequeño
            </Boton>
            <Boton variante="primario" tamano="md">
              Mediano
            </Boton>
            <Boton variante="primario" tamano="lg">
              Grande
            </Boton>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Boton variante="primario" cargando>
              Guardando
            </Boton>
            <Boton variante="primario" disabled>
              Deshabilitado
            </Boton>
            <BotonIcono icono="pencil" etiqueta="Editar" variante="secundario" />
            <BotonIcono icono="trash-2" etiqueta="Eliminar" variante="peligro-sutil" />
          </div>
        </Seccion>

        {/* ---------------------------------------------------- campos */}
        <Seccion
          numero="9.4"
          titulo="Campos de formulario"
          descripcion="La etiqueta es siempre visible. El texto interior muestra el formato esperado, nunca reemplaza a la etiqueta."
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Campo etiqueta="Nombre completo" placeholder="Juan Gonzalez" required />
            <Campo
              etiqueta="Teléfono"
              placeholder="0981 123 456"
              ayuda="Se usa para confirmar el turno"
              required
            />
            <Campo etiqueta="Precio del servicio" placeholder="50.000" sufijo="Gs." />
            <Campo etiqueta="Duración" placeholder="45" sufijo="min" />
            <Campo
              etiqueta="Correo electrónico"
              defaultValue="correo-mal-escrito"
              error="Ingrese un correo con el formato nombre@dominio.com"
            />
            <Campo etiqueta="Campo deshabilitado" defaultValue="No editable" disabled />
          </div>
        </Seccion>

        {/* ---------------------------------------------------- estados */}
        <Seccion
          numero="10"
          titulo="Estados del sistema"
          descripcion="Cada valor almacenado en la base tiene aquí su etiqueta, su color y su icono. El chip nunca muestra el valor crudo."
        >
          <div className="space-y-8">
            {[
              ['citas.estado', PRESENTACION_CITA],
              ['cobros_cliente.estado', PRESENTACION_COBRO],
              ['pedidos.estado', PRESENTACION_PEDIDO],
              ['nivel de stock (derivado)', PRESENTACION_STOCK],
            ].map(([titulo, mapa]) => (
              <div key={titulo as string}>
                <p className="text-cuerpo-sm text-terciario font-mono">{titulo as string}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Object.entries(mapa as Record<string, never>).map(([clave, pres]) => (
                    <ChipEstado key={clave} presentacion={pres} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Seccion>

        {/* ------------------------------------------------ indicadores */}
        <Seccion
          numero="9.1"
          titulo="Tarjetas de indicador"
          descripcion="La variación lleva icono además de color, porque el color solo no basta."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Indicador
              etiqueta="Ingresos del mes"
              valor={guaranies(18450000)}
              icono="receipt"
              variacion={{ texto: '12,4 %', tono: 'exito' }}
              contexto="vs. mes anterior"
            />
            <Indicador
              etiqueta="Clientes atendidos"
              valor="184"
              icono="user-round"
              variacion={{ texto: '3,1 %', tono: 'exito' }}
              contexto="vs. mes anterior"
            />
            <Indicador
              etiqueta="Tasa de cancelación"
              valor="6,80 %"
              icono="circle-x"
              variacion={{ texto: '1,9 %', tono: 'peligro' }}
              contexto="vs. mes anterior"
            />
            <Indicador
              etiqueta="Comisiones pendientes"
              valor={guaranies(3120000)}
              icono="hand-coins"
              contexto="8 barberos"
            />
          </div>
        </Seccion>

        {/* ----------------------------------------------------- tabla */}
        <Seccion
          numero="9.5"
          titulo="Tabla"
          descripcion="Sin filas alternadas: sobre fondo oscuro un borde inferior separa mejor. Las columnas numéricas van a la derecha y con cifras tabulares."
        >
          <Tarjeta>
            <TarjetaEncabezado
              titulo="Turnos de hoy"
              descripcion="16 de agosto de 2026"
              accion={
                <Boton variante="primario" tamano="sm" icono="plus">
                  Nuevo turno
                </Boton>
              }
            />
            <Tabla titulo="Turnos agendados para el 16 de agosto de 2026">
              <TablaEncabezado>
                <Th>Hora</Th>
                <Th>Cliente</Th>
                <Th>Servicio</Th>
                <Th>Barbero</Th>
                <Th numerico>Total</Th>
                <Th>Estado</Th>
              </TablaEncabezado>
              <TablaCuerpo>
                {[
                  ['08:30', 'Juan Gonzalez', 'Corte clásico', 'Marcos Ayala', 50000, 'completado'],
                  ['09:15', 'Pedro Benitez', 'Corte y barba', 'Marcos Ayala', 85000, 'completado'],
                  ['10:00', 'Luis Cabrera', 'Perfilado de barba', 'Diego Rojas', 45000, 'en_proceso'],
                  ['11:00', 'Carlos Vera', 'Corte degradado', 'Diego Rojas', 60000, 'confirmado'],
                  ['14:30', 'Marco Duarte', 'Corte clásico', 'Marcos Ayala', 50000, 'pendiente'],
                  ['16:00', 'Hugo Ramirez', 'Corte y barba', 'Diego Rojas', 85000, 'cancelado'],
                ].map((f, i) => (
                  <Tr key={i} interactiva>
                    <Td className="font-mono">{f[0] as string}</Td>
                    <Td className="font-medium">{f[1] as string}</Td>
                    <Td className="text-secundario">{f[2] as string}</Td>
                    <Td className="text-secundario">{f[3] as string}</Td>
                    <Td numerico>{guaranies(f[4] as number)}</Td>
                    <Td>
                      <ChipEstado
                        presentacion={
                          PRESENTACION_CITA[f[5] as keyof typeof PRESENTACION_CITA]
                        }
                      />
                    </Td>
                  </Tr>
                ))}
              </TablaCuerpo>
            </Tabla>
          </Tarjeta>
        </Seccion>

        {/* ------------------------------------------- estados de carga */}
        <Seccion
          numero="9.8"
          titulo="Estado vacío y carga"
          descripcion="Una tabla vacía no es un error, es una oportunidad de orientar. Nunca «Sin datos»."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <Tarjeta>
              <EstadoVacio
                icono="user-round"
                titulo="Todavía no hay clientes registrados"
                descripcion="Cuando registre el primer cliente va a poder ver su historial completo de servicios y las recomendaciones que el sistema genere."
                accion={
                  <Boton variante="primario" icono="plus">
                    Registrar cliente
                  </Boton>
                }
              />
            </Tarjeta>

            <Tarjeta>
              <TarjetaEncabezado titulo="Cargando" descripcion="Esqueleto de tabla" />
              <TarjetaCuerpo className="p-0">
                <EsqueletoTabla filas={5} columnas={5} />
              </TarjetaCuerpo>
            </Tarjeta>
          </div>
        </Seccion>

        {/* --------------------------------------------------- iconos */}
        <Seccion
          numero="7.4"
          titulo="Iconos asignados"
          descripcion="Cada concepto tiene un icono fijo. Reutilizar el mismo símbolo para dos conceptos degrada la interfaz más rápido que cualquier error de color."
        >
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-8">
            {(
              [
                ['calendar-days', 'Agenda'],
                ['user-round', 'Cliente'],
                ['scissors', 'Barbero'],
                ['sparkles', 'Servicio'],
                ['tag', 'Categoría'],
                ['receipt', 'Cobro'],
                ['credit-card', 'Metodo'],
                ['hand-coins', 'Comisión'],
                ['package', 'Inventario'],
                ['box', 'Producto'],
                ['truck', 'Proveedor'],
                ['clipboard-list', 'Compra'],
                ['chart-column', 'Reporte'],
                ['brain', 'ML'],
                ['scroll-text', 'Auditoría'],
                ['settings', 'Config.'],
              ] as const
            ).map(([nombre, etiqueta]) => (
              <div
                key={nombre}
                className="border-borde-sutil bg-superficie flex flex-col items-center gap-2 rounded-md border p-4"
              >
                <Icono nombre={nombre} tamano="lg" className="text-marca" />
                <span className="text-etiqueta text-terciario text-center">{etiqueta}</span>
              </div>
            ))}
          </div>
        </Seccion>
      </main>
    </div>
  );
}
