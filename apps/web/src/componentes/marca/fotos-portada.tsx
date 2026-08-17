import Image from 'next/image';

import { cn } from '@barber-shop/ui';

/**
 * Composición fotográfica de la portada.
 *
 * Dos retratos del oficio superpuestos: el perfilado de barba detrás, más
 * grande, y el corte de pelo adelante a la derecha. Cumplen la sección 8.5 del
 * sistema de diseño: luz cálida, fondo del local desenfocado, nada de banco de
 * imágenes genérico.
 *
 * Los archivos viven en `apps/web/public/imagenes/`, recortados a 3:4 y
 * convertidos a WebP de 900 × 1200 px (81 y 76 KB, por debajo de los 200 KB
 * que fija la sección 8.1). Los originales sin procesar quedaron en
 * `apps/web/imagenes-originales/`, fuera de lo que se publica y fuera de git.
 *
 * Para cambiarlas: reemplazar los archivos conservando nombre, proporción 3:4
 * y peso, y actualizar el texto alternativo si cambia lo que se ve.
 */

export function FotosPortada({ className }: { className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Foto principal. Lleva `priority` porque es el elemento más grande de
          la primera pantalla y define el tiempo de carga percibido. */}
      <div className="border-borde-sutil relative aspect-[3/4] w-[62%] overflow-hidden rounded-xl border">
        <Image
          src="/imagenes/barba.webp"
          alt="Barbero perfilando la barba de un cliente con navaja"
          fill
          sizes="(max-width: 640px) 60vw, (max-width: 1024px) 240px, 320px"
          className="object-cover"
          priority
        />
      </div>

      {/* Foto secundaria, desplazada y superpuesta. El borde grueso del color
          del fondo la separa de la de atrás sin necesidad de sombra, que sobre
          carbón no se percibiría. */}
      <div className="border-borde-sutil bg-fondo absolute right-0 bottom-0 aspect-[3/4] w-[52%] overflow-hidden rounded-xl border-4">
        <Image
          src="/imagenes/corte.webp"
          alt="Barbero cortando el pelo a un cliente con tijera y peine"
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 200px, 260px"
          className="object-cover"
        />
      </div>
    </div>
  );
}
