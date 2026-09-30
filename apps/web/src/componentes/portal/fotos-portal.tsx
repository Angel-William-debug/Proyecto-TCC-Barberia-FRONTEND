'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

import { cn } from '@barber-shop/ui';

/**
 * Fotos del oficio a los costados del portal del cliente.
 *
 * Pedido de la directora: el contenido del portal mide a lo sumo 768 px
 * (seccion 6.7), y en un monitor ancho quedaban mas de 400 px vacios de cada
 * lado. Esos costados llevan ahora una foto de barberia, fundida hacia el
 * centro con el color de fondo del tema, para que el portal se sienta la
 * barberia y no un formulario suelto. Son decorativas: no reciben clics y el
 * lector de pantalla no las anuncia.
 *
 * CUANTAS, SEGUN EL ANCHO
 *
 *   - Desde 1680 px: una a cada lado, con el contenido centrado.
 *   - De 1280 a 1679 px -las notebooks de 1366 y 1440-: a cada lado
 *     quedarian unos 150 px, una tira que no se lee como foto. Va una sola, a
 *     la derecha, y el contenido se corre a la izquierda (`ANCHO_CONTENIDO`).
 *   - Por debajo de 1280 px, ninguna: le sacarian lugar al formulario.
 *
 * Una pareja distinta por pantalla, para que recorrer el portal no sea ver
 * siempre las mismas dos. La de la derecha es la que queda sola en el modo de
 * una foto.
 *
 * Sin `priority`: ocultas por `display: none` en pantallas angostas, el
 * navegador ni las descarga, y precargarlas lo obligaria a hacerlo.
 */

/**
 * Ancho del contenido del portal, coordinado con los tres modos de arriba.
 *
 * El tramo de una foto se acota con `xl:max-[1679px]:` en lugar de pisarlo
 * despues con `min-[1680px]:`. Tailwind 4 escribe los cortes a medida ANTES
 * que los predefinidos, asi que `xl:` siempre ganaba y a 1920 px el contenido
 * quedaba pegado a la izquierda. Con el rango acotado no depende del orden.
 */
export const ANCHO_CONTENIDO = 'max-w-3xl xl:max-[1679px]:ml-6';

const FOTOS = {
  barba: '/imagenes/barba.webp',
  corte: '/imagenes/corte.webp',
  peine: '/imagenes/peine.webp',
  navaja: '/imagenes/navaja.webp',
} as const;

type Foto = keyof typeof FOTOS;

const PAREJAS: Array<{ ruta: string; izquierda: Foto; derecha: Foto }> = [
  { ruta: '/mi-cuenta/reservar', izquierda: 'peine', derecha: 'corte' },
  { ruta: '/mi-cuenta/historial', izquierda: 'corte', derecha: 'navaja' },
  { ruta: '/mi-cuenta/perfil', izquierda: 'navaja', derecha: 'peine' },
];

/** Mis turnos, y cualquier ruta del portal que no tenga pareja propia. */
const PREDETERMINADA = { izquierda: 'barba' as Foto, derecha: 'navaja' as Foto };

export function FotosPortal() {
  const ruta = usePathname();
  const pareja = PAREJAS.find((p) => ruta.startsWith(p.ruta)) ?? PREDETERMINADA;

  return (
    <>
      <Costado foto={pareja.izquierda} lado="izquierdo" />
      <Costado foto={pareja.derecha} lado="derecho" />
    </>
  );
}

function Costado({ foto, lado }: { foto: Foto; lado: 'izquierdo' | 'derecho' }) {
  return (
    <div
      className={cn(
        'absolute inset-y-0 hidden',
        lado === 'izquierdo'
          ? // Solo en el modo de dos fotos. El ancho es lo que queda al costado
            // del contenido centrado (48rem mas su relleno), menos un respiro.
            'left-0 min-[1680px]:block min-[1680px]:w-[calc((100%-48rem)/2-2rem)]'
          : // Desde xl. En el modo de una foto ocupa lo que deja el contenido
            // corrido a la izquierda; en el de dos, lo mismo que la izquierda.
            'right-0 xl:block xl:max-[1679px]:w-[calc(100%-48rem-4.5rem)] min-[1680px]:w-[calc((100%-48rem)/2-2rem)]',
      )}
    >
      <Image
        src={FOTOS[foto]}
        alt=""
        fill
        sizes="(min-width: 1680px) 25vw, 30vw"
        className="object-cover"
      />
      {/* Funde la foto hacia el contenido con el color de fondo del tema, asi
          que sirve igual en oscuro y en claro. */}
      <div
        className={cn(
          'from-fondo/25 via-fondo/60 to-fondo absolute inset-0',
          lado === 'izquierdo' ? 'bg-linear-to-r' : 'bg-linear-to-l',
        )}
      />
    </div>
  );
}
