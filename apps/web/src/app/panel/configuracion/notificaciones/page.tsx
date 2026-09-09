import { obtenerConfiguracion } from '@barber-shop/api';
import { EstadoVacio, Tarjeta } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { AjustesNotificaciones } from '@/componentes/formularios/ajustes-notificaciones';

export const metadata = { title: 'Notificaciones' };

/** CU-020 - parametros del recordatorio de turno (RN-042). */
export default async function PaginaNotificaciones() {
  const config = await obtenerConfiguracion();

  return (
    <>
      <EncabezadoVista
        titulo="Notificaciones"
        descripcion="Los parámetros del recordatorio automático de turno."
      />

      {config ? (
        <AjustesNotificaciones configuracion={config} />
      ) : (
        <Tarjeta>
          <EstadoVacio
            icono="triangle-alert"
            titulo="No hay una configuración cargada"
            descripcion="La instalación crea una única fila de configuración y no se encontró. Verifique que las migraciones y los datos iniciales se hayan aplicado en la base."
          />
        </Tarjeta>
      )}
    </>
  );
}
