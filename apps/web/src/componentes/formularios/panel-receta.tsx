'use client';

import { useState, useTransition } from 'react';

import type { RecetaLinea } from '@barber-shop/tipos';
import {
  Boton,
  BotonIcono,
  Campo,
  CampoSelector,
  EstadoVacio,
  FilaCampos,
  GrupoCampos,
  PanelLateral,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Td,
  TdCompleta,
  Th,
  Tr,
  cantidad,
} from '@barber-shop/ui';

import { borrarRegistro } from '@/acciones/catalogo';
import { guardarLineaReceta, obtenerReceta } from '@/acciones/inventario';

export interface ProductoParaReceta {
  id_producto: number;
  nombre: string;
}

/**
 * CU-003 — receta del servicio: que productos consume y en que cantidad.
 *
 * No usa el armazon `PanelFormulario`: ahi cada envio cierra el panel, pero
 * aca se agregan y quitan lineas una por una y conviene que el panel siga
 * abierto entre cada cambio. Los datos se piden al abrir y se vuelven a pedir
 * despues de cada alta o baja, en vez de depender de `revalidatePath`: es la
 * unica pantalla que necesita su propio estado porque nadie mas la muestra.
 */
export function PanelReceta({
  idServicio,
  nombreServicio,
  productos,
}: {
  idServicio: number;
  nombreServicio: string;
  productos: ProductoParaReceta[];
}) {
  const [abierto, setAbierto] = useState(false);
  const [lineas, setLineas] = useState<RecetaLinea[]>([]);
  const [huboCarga, setHuboCarga] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, iniciar] = useTransition();

  const [idProducto, setIdProducto] = useState('');
  const [cantidadNueva, setCantidadNueva] = useState('');
  const [unidad, setUnidad] = useState('');

  function cargar() {
    iniciar(async () => {
      setLineas(await obtenerReceta(idServicio));
      setHuboCarga(true);
    });
  }

  function abrir() {
    setAbierto(true);
    cargar();
  }

  function agregar() {
    setError(null);
    const datos = new FormData();
    datos.set('id_servicio', String(idServicio));
    datos.set('id_producto', idProducto);
    datos.set('cantidad_estandar', cantidadNueva);
    datos.set('unidad_uso', unidad);

    iniciar(async () => {
      const r = await guardarLineaReceta(datos);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setIdProducto('');
      setCantidadNueva('');
      setUnidad('');
      setLineas(await obtenerReceta(idServicio));
    });
  }

  function quitar(idLinea: number, nombreProducto: string) {
    if (!window.confirm(`¿Quitar ${nombreProducto} de la receta de ${nombreServicio}?`)) return;

    iniciar(async () => {
      await borrarRegistro('servicio_producto', idLinea);
      setLineas(await obtenerReceta(idServicio));
    });
  }

  return (
    <>
      <BotonIcono
        icono="box"
        etiqueta={`Receta de ${nombreServicio}`}
        variante="terciario"
        tamano="sm"
        onClick={abrir}
      />

      <PanelLateral
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={`Receta de ${nombreServicio}`}
        descripcion="Productos que este servicio consume. Se proponen al cerrar el turno y ahí se pueden ajustar (CU-011)."
      >
        {error && <p className="text-cuerpo-sm text-peligro mb-4">{error}</p>}

        <Tabla titulo={`Receta de ${nombreServicio}`}>
          <TablaEncabezado>
            <Th>Producto</Th>
            <Th numerico>Cantidad</Th>
            <Th>Unidad</Th>
            <Th>
              <span className="solo-lectores">Acciones</span>
            </Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {lineas.length === 0 ? (
              <TdCompleta colSpan={4}>
                <EstadoVacio
                  icono="box"
                  titulo={!huboCarga && ocupado ? 'Cargando…' : 'Sin productos en la receta'}
                  descripcion="Agregue los productos que este servicio consume habitualmente."
                />
              </TdCompleta>
            ) : (
              lineas.map((l) => (
                <Tr key={l.id_servicio_producto}>
                  <Td className="font-medium" etiqueta="Producto">
                    {l.nombre_producto}
                  </Td>
                  <Td numerico etiqueta="Cantidad">
                    {cantidad(l.cantidad_estandar)}
                  </Td>
                  <Td className="text-secundario" etiqueta="Unidad">
                    {l.unidad_uso ?? '—'}
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <BotonIcono
                      icono="trash-2"
                      etiqueta={`Quitar ${l.nombre_producto} de la receta`}
                      variante="terciario"
                      tamano="sm"
                      onClick={() => quitar(l.id_servicio_producto, l.nombre_producto)}
                      disabled={ocupado}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>

        <div className="mt-6">
          <GrupoCampos titulo="Agregar producto">
            <FilaCampos>
              <CampoSelector
                etiqueta="Producto"
                name="id_producto_nuevo"
                value={idProducto}
                onChange={(e) => setIdProducto(e.target.value)}
                opciones={productos.map((p) => ({ valor: p.id_producto, etiqueta: p.nombre }))}
                marcador="Elija un producto"
                claseContenedor="flex-[2]"
              />
              <Campo
                etiqueta="Cantidad"
                name="cantidad_nueva"
                inputMode="numeric"
                value={cantidadNueva}
                onChange={(e) => setCantidadNueva(e.target.value)}
              />
            </FilaCampos>
            <Campo
              etiqueta="Unidad"
              name="unidad_nueva"
              value={unidad}
              onChange={(e) => setUnidad(e.target.value)}
              placeholder="ml, g, unidad..."
            />
            <Boton
              variante="secundario"
              icono="plus"
              onClick={agregar}
              disabled={!idProducto || !cantidadNueva || ocupado}
              cargando={ocupado}
            >
              Agregar a la receta
            </Boton>
          </GrupoCampos>
        </div>
      </PanelLateral>
    </>
  );
}
