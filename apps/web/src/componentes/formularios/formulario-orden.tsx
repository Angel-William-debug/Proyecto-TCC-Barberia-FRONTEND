'use client';

import { useState } from 'react';

import { ESTADOS_PEDIDO, type Proveedor } from '@barber-shop/tipos';
import {
  Boton, BotonIcono, Campo, CampoSelector, FilaCampos, GrupoCampos, guaranies,
} from '@barber-shop/ui';

import { guardarOrden } from '@/acciones/operaciones';
import { PanelFormulario } from './panel-formulario';

/** Producto del catalogo, con lo minimo que el formulario necesita. */
export interface ProductoParaOrden {
  id_producto: number;
  nombre: string;
  precio_unitario: number;
}

interface LineaProducto {
  clave: number;
  idProducto: string;
  cantidad: string;
  precio: string;
}

const LINEA_VACIA = (clave: number): LineaProducto => ({
  clave,
  idProducto: '',
  cantidad: '1',
  precio: '',
});

const ETIQUETA_ESTADO: Record<string, string> = {
  pedido: 'Pedido',
  recibido: 'Recibido',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

/**
 * CU-016 - alta de una orden de compra.
 *
 * Mismo patron que el turno: cabecera arriba, lista de lineas abajo, campos
 * repetidos que la accion empareja por posicion.
 *
 * El precio se propone desde el catalogo pero queda editable: el proveedor
 * cotiza lo que quiere, y forzar el precio registrado obligaria a editar el
 * producto antes de poder cargar la orden.
 */
export function FormularioOrden({
  proveedores,
  productos,
  fechaHoy,
}: {
  proveedores: Proveedor[];
  productos: ProductoParaOrden[];
  fechaHoy: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const [lineas, setLineas] = useState<LineaProducto[]>([LINEA_VACIA(0)]);

  const agregar = () =>
    setLineas((l) => [...l, LINEA_VACIA(Math.max(...l.map((x) => x.clave)) + 1)]);
  const quitar = (clave: number) => setLineas((l) => l.filter((x) => x.clave !== clave));
  const cambiar = (clave: number, campo: keyof LineaProducto, valor: string) =>
    setLineas((l) => l.map((x) => (x.clave === clave ? { ...x, [campo]: valor } : x)));

  // Al elegir un producto se propone su precio, salvo que ya se haya escrito uno.
  const elegirProducto = (clave: number, idProducto: string) => {
    const p = productos.find((x) => String(x.id_producto) === idProducto);
    setLineas((l) =>
      l.map((x) =>
        x.clave === clave
          ? { ...x, idProducto, precio: x.precio || (p ? String(p.precio_unitario) : '') }
          : x,
      ),
    );
  };

  const aNumero = (s: string) => {
    const n = Number(s.replace(/\./g, '').replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  const total = lineas.reduce((s, l) => s + aNumero(l.cantidad) * aNumero(l.precio), 0);

  return (
    <>
      <Boton variante="primario" icono="plus" onClick={() => setAbierto(true)}>
        Nueva orden
      </Boton>

      <PanelFormulario
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        ancho="lg"
        titulo="Nueva orden de compra"
        descripcion="Al marcarla como recibida, el stock de cada producto se actualiza solo."
        accion={guardarOrden}
        textoGuardar="Crear orden"
      >
        {(errores) => (
          <>
            <GrupoCampos titulo="Proveedor y fecha">
              <CampoSelector
                etiqueta="Proveedor"
                name="id_proveedor"
                opciones={proveedores.map((p) => ({
                  valor: p.id_proveedor,
                  etiqueta: p.nombre,
                }))}
                marcador="Elija un proveedor"
                error={errores.id_proveedor}
                required
              />
              <FilaCampos>
                <Campo
                  etiqueta="Fecha del pedido"
                  name="fecha_pedido"
                  type="date"
                  defaultValue={fechaHoy}
                  error={errores.fecha_pedido}
                  required
                />
                <CampoSelector
                  etiqueta="Estado"
                  name="estado"
                  defaultValue="pedido"
                  opciones={ESTADOS_PEDIDO.map((e) => ({
                    valor: e,
                    etiqueta: ETIQUETA_ESTADO[e] ?? e,
                  }))}
                  marcador="Elija un estado"
                  error={errores.estado}
                  required
                />
              </FilaCampos>
            </GrupoCampos>

            <GrupoCampos titulo="Productos">
              <div className="flex flex-col gap-3">
                {lineas.map((linea, i) => (
                  <div key={linea.clave} className="flex items-end gap-3">
                    <CampoSelector
                      etiqueta={i === 0 ? 'Producto' : ''}
                      aria-label={i === 0 ? undefined : `Producto ${i + 1}`}
                      name="id_producto"
                      value={linea.idProducto}
                      onChange={(e) => elegirProducto(linea.clave, e.target.value)}
                      opciones={productos.map((p) => ({
                        valor: p.id_producto,
                        etiqueta: p.nombre,
                      }))}
                      marcador="Elija un producto"
                      error={i === 0 ? errores.id_producto : undefined}
                      claseContenedor="flex-[2]"
                    />
                    <Campo
                      etiqueta={i === 0 ? 'Cantidad' : ''}
                      aria-label={i === 0 ? undefined : `Cantidad del producto ${i + 1}`}
                      name="cantidad"
                      inputMode="numeric"
                      value={linea.cantidad}
                      onChange={(e) => cambiar(linea.clave, 'cantidad', e.target.value)}
                      error={i === 0 ? errores.cantidad : undefined}
                      claseContenedor="w-24"
                    />
                    <Campo
                      etiqueta={i === 0 ? 'Precio unitario' : ''}
                      aria-label={i === 0 ? undefined : `Precio del producto ${i + 1}`}
                      name="precio_unitario"
                      inputMode="numeric"
                      value={linea.precio}
                      onChange={(e) => cambiar(linea.clave, 'precio', e.target.value)}
                      sufijo="Gs."
                      error={i === 0 ? errores.precio_unitario : undefined}
                      claseContenedor="w-44"
                    />
                    <div className="pb-1">
                      <BotonIcono
                        icono="trash-2"
                        etiqueta={`Quitar el producto ${i + 1}`}
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
                  Agregar otro producto
                </Boton>
              </div>
            </GrupoCampos>

            {total > 0 && (
              <div className="border-marca bg-elevado flex items-baseline justify-between rounded-md border-l-2 px-3 py-2">
                <span className="text-titulillo text-terciario font-semibold tracking-[0.08em] uppercase">
                  Total de la orden
                </span>
                <span className="font-display text-principal text-display-sm tabular-nums">
                  {guaranies(total)}
                </span>
              </div>
            )}
          </>
        )}
      </PanelFormulario>
    </>
  );
}
