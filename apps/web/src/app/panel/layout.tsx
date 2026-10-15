import Link from 'next/link';
import { redirect } from 'next/navigation';

import { listarAlertas, listarNotificaciones, MODO_DEMO, usuarioActual } from '@barber-shop/api';
import { usaElPortal } from '@barber-shop/tipos';
import { Boton, EstadoVacio, Tarjeta } from '@barber-shop/ui';

import { AvisoDemo } from '@/componentes/armazon/aviso-demo';
import { BotonSalir } from '@/componentes/armazon/boton-salir';
import { BusquedaGlobal } from '@/componentes/armazon/busqueda-global';
import { CampanaAlertas } from '@/componentes/armazon/campana-alertas';
import { GuardaRuta } from '@/componentes/armazon/guarda-ruta';
import { MarcoLateral } from '@/componentes/armazon/marco-lateral';
import { SelectorTema } from '@/componentes/armazon/selector-tema';
import {
  RUTAS_AREA_CONFIGURACION,
  SALIDA_AREA_CONFIGURACION,
  gruposConfiguracionPara,
  gruposPara,
  menuPara,
  rutasPorPermiso,
} from '@/lib/navegacion';

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

  // El cliente no tiene lugar en el panel: `MODULOS_POR_ROL.cliente` esta
  // vacio, asi que veria una barra lateral sin una sola entrada. Su zona es el
  // portal. Aca se hace la separacion por rol que el middleware evita hacer
  // para no consultar la base en cada peticion; ver `middleware.ts`.
  if (usaElPortal(usuario.rol)) {
    redirect('/mi-cuenta');
  }

  const entradas = menuPara(usuario.rol);
  const grupos = gruposPara(usuario.rol);

  // El area de configuracion existe solo para quien tiene el modulo. La
  // recepcionista alcanza la Papelera y nada mas: encerrarle esa unica
  // pantalla detras de una puerta -con su barra propia y su «Volver al
  // sistema»- seria un paso de mas para llegar al mismo lado. La ve suelta en
  // la barra del sistema, como estaba antes. Ver `gruposPara`.
  const tieneConfiguracion = entradas.some((e) => e.modulo === 'configuracion');
  const areaConfiguracion = tieneConfiguracion ? gruposConfiguracionPara(usuario.rol) : [];

  // La campanita lleva a la bandeja de Notificaciones (vista 95) y cuenta lo
  // mismo que ella: alertas de stock sin resolver y recordatorios que no
  // salieron. Solo se ofrece a quien tiene ese modulo en el menu.
  const tieneBandeja = entradas.some((e) => e.modulo === 'notificaciones');
  const [alertasSinResolver, recordatoriosCaidos] = tieneBandeja
    ? await Promise.all([
        listarAlertas({ soloNoResueltas: true }).catch(() => []),
        listarNotificaciones({ soloPorAtender: true }).catch(() => []),
      ])
    : [[], []];

  return (
    <MarcoLateral
      grupos={grupos}
      area={
        areaConfiguracion.length > 0
          ? {
              rutas: RUTAS_AREA_CONFIGURACION,
              grupos: areaConfiguracion,
              volver: { etiqueta: 'Volver al sistema', ruta: SALIDA_AREA_CONFIGURACION },
            }
          : undefined
      }
      usuario={{ nombre: usuario.nombre, rol: usuario.rol }}
      inicio="/panel"
      aviso={MODO_DEMO ? <AvisoDemo /> : undefined}
      acciones={
        <>
          <BusquedaGlobal />
          {tieneBandeja && (
            <CampanaAlertas cantidad={alertasSinResolver.length + recordatoriosCaidos.length} />
          )}
          <SelectorTema />
          <BotonSalir />
        </>
      }
    >
      <GuardaRuta {...rutasPorPermiso(usuario.rol)} inicio="/panel">
        {children}
      </GuardaRuta>
    </MarcoLateral>
  );
}
