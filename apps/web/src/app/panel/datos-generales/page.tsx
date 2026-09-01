import Link from 'next/link';

import {
  listarCategoriasProducto,
  listarCategoriasServicio,
  listarClientes,
  listarMetodosPago,
  listarProductosConNivel,
  listarProfesionales,
  listarProveedores,
  listarServicios,
} from '@barber-shop/api';
import { Icono, plural, type NombreIcono } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';

export const metadata = {
  title: 'Datos generales',
};

/**
 * Datos generales: los catalogos maestros en un solo apartado.
 *
 * Pedido explicito de la Direccion. No mueve ninguna pantalla ni duplica
 * ninguna tabla: reune las siete entidades base, dice cuantos registros tiene
 * cada una y lleva a la pantalla donde se administra.
 *
 * POR QUE UN RESUMEN Y NO UNA PANTALLA CON PESTANAS
 *
 * Con pestanas, cada catalogo perderia su propia direccion. Hoy `/panel/clientes?q=gonzalez`
 * es un enlace que se puede compartir y que el boton Atras deshace, porque el
 * filtro vive en la URL (regla 3 del proyecto). Meterlos todos bajo una sola
 * ruta obligaria a inventar un parametro mas para saber que pestana esta
 * abierta, y a que las siete pantallas compartieran el mismo espacio de
 * nombres de filtros: `q` tendria que volverse `clientes_q`, `productos_q` y
 * asi. El apartado se resuelve en la navegacion -el grupo de la barra
 * lateral- y esta pantalla es su portada.
 */

interface Catalogo {
  nombre: string;
  descripcion: string;
  icono: NombreIcono;
  ruta: string;
  cantidad: number;
  unidad: [string, string];
}

export default async function DatosGenerales() {
  // Todo en paralelo: son siete consultas independientes y encadenarlas
  // multiplicaria por siete la espera de una pantalla que solo cuenta filas.
  const [clientes, servicios, catServicio, profesionales, productos, catProducto, proveedores, metodos] =
    await Promise.all([
      // Solo hace falta el total, no las filas: `porPagina: 1` evita traer
      // veinticinco clientes para mostrar un numero.
      listarClientes({ porPagina: 1 }),
      listarServicios(),
      listarCategoriasServicio(),
      listarProfesionales(),
      listarProductosConNivel(),
      listarCategoriasProducto(),
      listarProveedores(),
      listarMetodosPago(),
    ]);

  const catalogos: Catalogo[] = [
    {
      nombre: 'Clientes',
      descripcion: 'Quiénes se atienden en la barbería, con su historial y sus datos de contacto.',
      icono: 'user-round',
      ruta: '/panel/clientes',
      cantidad: clientes.total,
      unidad: ['cliente', 'clientes'],
    },
    {
      nombre: 'Servicios',
      descripcion: 'Qué ofrece la barbería, con su duración, su precio y los insumos que consume.',
      icono: 'sparkles',
      ruta: '/panel/servicios',
      cantidad: servicios.length,
      unidad: ['servicio', 'servicios'],
    },
    {
      nombre: 'Categorías de servicio',
      descripcion: 'Cómo se agrupan los servicios en el catálogo y en el portal del cliente.',
      icono: 'tag',
      ruta: '/panel/servicios',
      cantidad: catServicio.length,
      unidad: ['categoría', 'categorías'],
    },
    {
      nombre: 'Barberos',
      descripcion: 'El equipo, con su especialidad y su porcentaje de comisión.',
      icono: 'scissors',
      ruta: '/panel/barberos',
      cantidad: profesionales.length,
      unidad: ['barbero', 'barberos'],
    },
    {
      nombre: 'Productos',
      descripcion: 'Los insumos, con su unidad de uso, su stock y su punto de reposición.',
      icono: 'package',
      ruta: '/panel/inventario',
      cantidad: productos.length,
      unidad: ['producto', 'productos'],
    },
    {
      nombre: 'Categorías de producto',
      descripcion: 'Cómo se agrupa el inventario.',
      icono: 'tag',
      ruta: '/panel/inventario',
      cantidad: catProducto.length,
      unidad: ['categoría', 'categorías'],
    },
    {
      nombre: 'Proveedores',
      descripcion: 'A quién se le compran los insumos.',
      icono: 'truck',
      ruta: '/panel/compras',
      cantidad: proveedores.length,
      unidad: ['proveedor', 'proveedores'],
    },
    {
      nombre: 'Métodos de pago',
      descripcion: 'Con qué se puede cobrar un turno y pagarle a un proveedor.',
      icono: 'credit-card',
      ruta: '/panel/configuracion',
      cantidad: metodos.length,
      unidad: ['método', 'métodos'],
    },
  ];

  return (
    <>
      <EncabezadoVista
        titulo="Datos generales"
        descripcion="Los catálogos base del sistema. Cada uno se administra en su propia pantalla; acá están todos juntos con lo que hay cargado."
      />

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {catalogos.map((c) => (
          <li key={c.nombre}>
            <Link
              href={c.ruta}
              className="border-borde-sutil bg-superficie hover:border-borde-control focus-visible:border-marca flex h-full flex-col rounded-lg border p-5 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="bg-elevado inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                  <Icono nombre={c.icono} tamano="md" className="text-marca" />
                </span>
                <Icono nombre="chevron-right" tamano="sm" className="text-terciario mt-2" />
              </div>

              <h2 className="text-titulo-3 text-principal mt-4 font-semibold">{c.nombre}</h2>

              <p className="text-cuerpo-sm text-secundario medida-lectura mt-1 flex-1">
                {c.descripcion}
              </p>

              <p className="text-cuerpo text-principal mt-4 font-medium tabular-nums">
                {plural(c.cantidad, ...c.unidad)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
