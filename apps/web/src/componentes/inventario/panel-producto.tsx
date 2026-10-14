'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';

import type { MovimientoDeLista, ProductoConNivel } from '@barber-shop/tipos';
import {
  AvisoFormulario,
  Boton,
  BotonIcono,
  Campo,
  CampoArea,
  CampoSelector,
  ChipEstado,
  Esqueleto,
  GrupoCampos,
  Icono,
  PRESENTACION_STOCK,
  PanelLateral,
  cantidad,
  fechaHora,
  guaranies,
} from '@barber-shop/ui';

import { guardarMovimiento, movimientosDelProducto } from '@/acciones/inventario';

/**
 * Ficha del producto con sus movimientos (vista 65) y la carga manual de
 * stock (vistas 66 y 67; 15/10/2026).
 *
 * El stock solo se movía solo: entraba al recibir una orden y salía al cerrar
 * un servicio. No había cómo cargar mercadería que llegó sin orden, dar de baja
 * un frasco roto, ni corregir el número después de contar la estantería. Las
 * tres cosas se hacen acá; la base cambia el stock y deja el movimiento en la
 * misma transacción (`fn_movimiento_manual`).
 */

type Tipo = 'entrada' | 'salida' | 'ajuste';

const TIPOS: Array<{ valor: Tipo; etiqueta: string }> = [
  { valor: 'entrada', etiqueta: 'Entrada: llegó mercadería sin orden de compra' },
  { valor: 'salida', etiqueta: 'Salida: merma, rotura o uso interno' },
  { valor: 'ajuste', etiqueta: 'Ajuste: corregir según lo que se contó' },
];

const ETIQUETA_TIPO: Record<string, string> = { entrada: 'Entrada', salida: 'Salida', ajuste: 'Ajuste' };
const ICONO_TIPO = { entrada: 'trending-up', salida: 'trending-down', ajuste: 'arrow-left-right' } as const;

export function PanelProducto({
  producto,
  categoria,
}: {
  producto: ProductoConNivel;
  categoria: string | null;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<'ver' | 'mover'>('ver');
  const [tipo, setTipo] = useState<Tipo>('entrada');
  const [movimientos, setMovimientos] = useState<MovimientoDeLista[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [ocupado, iniciar] = useTransition();

  const unidad = producto.unidad_uso ?? producto.unidad_medida ?? 'u.';

  function cargar() {
    iniciar(async () => setMovimientos(await movimientosDelProducto(producto.id_producto)));
  }

  function abrir() {
    setAbierto(true);
    setModo('ver');
    cargar();
  }

  function cerrar() {
    setAbierto(false);
    setError(null);
    setErrores({});
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);
    datos.set('id_producto', String(producto.id_producto));
    setError(null);
    setErrores({});
    iniciar(async () => {
      const r = await guardarMovimiento(datos);
      if (!r.ok) {
        setError(r.error);
        setErrores(r.campos ?? {});
        return;
      }
      setModo('ver');
      setMovimientos(await movimientosDelProducto(producto.id_producto));
      router.refresh();
    });
  }

  return (
    <>
      <BotonIcono
        icono="eye"
        etiqueta={`Ver la ficha de ${producto.nombre}`}
        variante="terciario"
        tamano="sm"
        onClick={abrir}
      />

      <PanelLateral
        abierto={abierto}
        onCerrar={cerrar}
        titulo={modo === 'mover' ? 'Registrar movimiento' : producto.nombre}
        descripcion={modo === 'mover' ? producto.nombre : (categoria ?? 'Sin categoría')}
        pie={
          modo === 'ver' ? (
            <div className="flex w-full justify-end">
              <Boton variante="primario" icono="arrow-left-right" onClick={() => setModo('mover')}>
                Registrar movimiento
              </Boton>
            </div>
          ) : (
            <div className="flex w-full justify-end gap-2">
              <Boton variante="secundario" disabled={ocupado} onClick={() => setModo('ver')}>
                Volver
              </Boton>
              <Boton type="submit" form={`form-mov-${producto.id_producto}`} variante="primario" cargando={ocupado}>
                Guardar movimiento
              </Boton>
            </div>
          )
        }
      >
        <div className="flex flex-col gap-6">
          {error && <AvisoFormulario mensaje={error} />}

          {modo === 'ver' ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Stock', `${cantidad(producto.stock_actual)} ${unidad}`],
                  ['Mínimo', `${cantidad(producto.stock_minimo)} ${unidad}`],
                  ['Máximo', producto.stock_maximo === null ? '—' : `${cantidad(producto.stock_maximo)} ${unidad}`],
                ].map(([etiqueta, valor]) => (
                  <div key={etiqueta} className="border-borde-sutil rounded-md border p-3">
                    <p className="text-titulillo text-terciario uppercase">{etiqueta}</p>
                    <p className="text-cuerpo text-principal mt-1 font-semibold tabular-nums">{valor}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <ChipEstado presentacion={PRESENTACION_STOCK[producto.nivel]} />
                <span className="text-cuerpo-sm text-secundario">
                  {guaranies(producto.precio_unitario)} por {producto.unidad_medida ?? 'unidad'}
                  {producto.cantidad_uso_estandar !== null &&
                    ` · cada ${producto.unidad_medida ?? 'unidad'} rinde ${cantidad(producto.cantidad_uso_estandar)} ${unidad}`}
                </span>
              </div>

              {producto.descripcion && (
                <GrupoCampos titulo="Descripción">
                  <p className="text-cuerpo-sm text-secundario">{producto.descripcion}</p>
                </GrupoCampos>
              )}

              <GrupoCampos titulo="Últimos movimientos">
                {!movimientos ? (
                  <Esqueleto className="h-24 w-full" />
                ) : movimientos.length === 0 ? (
                  <p className="text-cuerpo-sm text-terciario">Este producto todavía no tuvo movimientos.</p>
                ) : (
                  <ul className="divide-borde-sutil divide-y">
                    {movimientos.slice(0, 30).map((m) => (
                      <li key={m.id_movimiento} className="flex items-start justify-between gap-3 py-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <Icono nombre={ICONO_TIPO[m.tipo]} tamano="xs" className="text-secundario mt-1" />
                          <div className="min-w-0">
                            <p className="text-cuerpo-sm text-principal">{m.motivo ?? ETIQUETA_TIPO[m.tipo]}</p>
                            <p className="text-titulillo text-terciario">
                              {fechaHora(m.fecha)}
                              {m.nombre_usuario && ` · ${m.nombre_usuario}`}
                            </p>
                          </div>
                        </div>
                        <span
                          className={
                            m.tipo === 'entrada'
                              ? 'text-cuerpo-sm text-exito tabular-nums'
                              : m.tipo === 'salida'
                                ? 'text-cuerpo-sm text-peligro tabular-nums'
                                : 'text-cuerpo-sm text-secundario tabular-nums'
                          }
                        >
                          {m.tipo === 'entrada' ? '+' : m.tipo === 'salida' ? '−' : '±'}
                          {cantidad(m.cantidad)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </GrupoCampos>
            </>
          ) : (
            <form id={`form-mov-${producto.id_producto}`} onSubmit={enviar} noValidate className="flex flex-col gap-5">
              <p className="text-cuerpo-sm text-secundario">
                Hoy hay {cantidad(producto.stock_actual)} {unidad}. El movimiento queda registrado con su
                motivo y su usuario.
              </p>
              <CampoSelector
                etiqueta="Tipo"
                name="tipo"
                opciones={TIPOS}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as Tipo)}
                error={errores.tipo}
                required
              />
              <Campo
                etiqueta={
                  tipo === 'ajuste'
                    ? `Cantidad que contó (${unidad})`
                    : tipo === 'entrada'
                      ? `Cantidad que entra (${unidad})`
                      : `Cantidad que sale (${unidad})`
                }
                name="cantidad"
                inputMode="decimal"
                ayuda={
                  tipo === 'ajuste'
                    ? 'Lo que hay en la estantería. Se registra la diferencia con el sistema.'
                    : undefined
                }
                error={errores.cantidad}
                required
              />
              <CampoArea
                etiqueta="Motivo"
                name="motivo"
                rows={2}
                placeholder={
                  tipo === 'entrada'
                    ? 'Por ejemplo: compra en el supermercado'
                    : tipo === 'salida'
                      ? 'Por ejemplo: se rompió un frasco'
                      : 'Por ejemplo: conteo de fin de mes'
                }
                error={errores.motivo}
                required
              />
            </form>
          )}
        </div>
      </PanelLateral>
    </>
  );
}
