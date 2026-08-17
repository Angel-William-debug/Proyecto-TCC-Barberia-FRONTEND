import Link from 'next/link';
import { redirect } from 'next/navigation';

import { MODO_DEMO, usuarioActual } from '@barber-shop/api';
import { Boton, EstadoVacio, Tarjeta } from '@barber-shop/ui';

import { AvisoDemo } from '@/componentes/sistema/aviso-demo';
import { BotonSalir } from '@/componentes/sistema/boton-salir';
import { MarcoPanel } from '@/componentes/navegacion/marco-panel';
import { SelectorTema } from '@/componentes/sistema/selector-tema';
import { menuPara } from '@/lib/navegacion';

/**
 * Ninguna vista del panel se puede prerenderizar: todas dependen de la sesión
 * del usuario y de datos que cambian a cada minuto. Declararlo aquí evita que
 * la compilación intente generarlas como páginas estáticas.
 */
export const dynamic = 'force-dynamic';

/** Pantalla que se muestra cuando falta `apps/web/.env.local`. */
function ConfiguracionPendiente({ detalle }: { detalle: string }) {
  return (
    <div className="bg-fondo flex min-h-dvh items-center justify-center p-6">
      <Tarjeta className="max-w-2xl">
        <EstadoVacio
          icono="settings"
          titulo="Falta configurar la conexión con la base de datos"
          descripcion={detalle}
          accion={
            <Link href="/sistema-de-diseno">
              <Boton variante="secundario" iconoDerecha="chevron-right">
                Mientras tanto, ver el sistema de diseño
              </Boton>
            </Link>
          }
        />
      </Tarjeta>
    </div>
  );
}

/**
 * Armazón de las vistas internas (sección 6.5 del sistema de diseño).
 *
 * La sesión se resuelve aquí, en el servidor, y no en cada página. Si no hay
 * usuario se redirige antes de renderizar nada, de modo que ninguna vista
 * tiene que preguntarse si hay sesión.
 */
export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  // El límite `error.tsx` de un segmento NO captura los errores lanzados por
  // el layout de ese mismo segmento, solo los de sus hijos. Por eso la falta
  // de configuración se atiende aquí: de lo contrario, quien clona el
  // repositorio sin .env.local recibe un 500 sin explicación.
  let usuario;
  try {
    usuario = await usuarioActual();
  } catch (causa) {
    if (causa instanceof Error && causa.message.includes('variable de entorno')) {
      return <ConfiguracionPendiente detalle={causa.message} />;
    }
    throw causa;
  }

  if (!usuario) {
    redirect('/ingresar');
  }

  const entradas = menuPara(usuario.rol);

  return (
    <MarcoPanel
      entradas={entradas}
      usuario={{ nombre: usuario.nombre, rol: usuario.rol }}
      aviso={MODO_DEMO ? <AvisoDemo /> : undefined}
      acciones={
        <>
          <SelectorTema />
          <BotonSalir />
        </>
      }
    >
      {children}
    </MarcoPanel>
  );
}
