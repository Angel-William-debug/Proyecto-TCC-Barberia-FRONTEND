import type { ReactNode } from 'react';

import type { NombreRol } from '@barber-shop/tipos';

import { MarcoLateral } from '@/componentes/armazon/marco-lateral';
import type { EntradaBarra } from '@/componentes/armazon/barra-lateral';

/**
 * Armazon del portal del cliente.
 *
 * Usa el MISMO armazon que el panel: barra lateral fija de 264 px en
 * escritorio, cajon desde el boton de menu por debajo de `lg`, y solo el
 * contenido se desplaza. Antes tenia uno propio -navegacion superior en
 * escritorio, inferior en el telefono-; se unifico a pedido del equipo.
 *
 * QUE SIGUE SIENDO DISTINTO, Y POR QUE
 *
 * Compartir el armazon no es lo mismo que ser la misma pantalla. El portal
 * conserva tres diferencias, y las tres tienen que ver con quien lo usa y no
 * con el gusto:
 *
 *   - CUATRO ENTRADAS, sin agrupar. El panel llega a diecisiete y por eso
 *     necesita los cinco grupos de la seccion 6.5.1; encabezar cuatro
 *     entradas seria ponerle un titulo a una lista que se lee entera de un
 *     vistazo.
 *   - CONTENIDO ANGOSTO, hasta 768 px. Una tabla de veinte filas necesita
 *     ancho; una lista de dos turnos, no: estirarla solo separa el dato de su
 *     etiqueta.
 *   - TARJETAS, NUNCA TABLAS. La tabla sirve para comparar registros entre
 *     si, y el cliente no compara: mira el suyo.
 *
 * El resto -paleta, tipografia, componentes, comportamiento de la barra-
 * es el mismo, que es justamente lo que se buscaba: quien pasa de una mitad
 * a la otra no tiene que aprender dos formas de moverse.
 */

export const ENTRADAS_PORTAL: EntradaBarra[] = [
  { etiqueta: 'Reservar', ruta: '/mi-cuenta/reservar', icono: 'calendar-days' },
  // `exacta` porque `/mi-cuenta` es prefijo de las otras tres: sin eso
  // quedaria resaltada tambien estando en Reservar, Historial o Mi perfil.
  { etiqueta: 'Mis turnos', ruta: '/mi-cuenta', icono: 'clipboard-list', exacta: true },
  { etiqueta: 'Historial', ruta: '/mi-cuenta/historial', icono: 'file-text' },
  { etiqueta: 'Mi perfil', ruta: '/mi-cuenta/perfil', icono: 'user-round' },
];

export function MarcoPortal({
  usuario,
  acciones,
  aviso,
  children,
}: {
  usuario: { nombre: string; rol: NombreRol };
  acciones: ReactNode;
  aviso?: ReactNode;
  children: ReactNode;
}) {
  return (
    <MarcoLateral
      grupos={[{ entradas: ENTRADAS_PORTAL }]}
      usuario={usuario}
      inicio="/mi-cuenta"
      anchoContenido="max-w-3xl"
      aviso={aviso}
      acciones={acciones}
    >
      <p className="text-cuerpo-sm text-terciario">Hola, {usuario.nombre.split(' ')[0]}</p>
      {children}
    </MarcoLateral>
  );
}
