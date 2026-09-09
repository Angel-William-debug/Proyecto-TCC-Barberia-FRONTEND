import { obtenerConfiguracion } from '@barber-shop/api';
import { EstadoVacio, Tarjeta } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { AjustesEstablecimiento } from '@/componentes/configuracion/ajustes-establecimiento';

export const metadata = { title: 'Datos del establecimiento' };

/**
 * CU-020 - portada del area de configuracion.
 *
 * Hasta el 9/9/2026 esta ruta mostraba las tres cosas juntas -datos, horarios
 * y metodos de pago- y solo la primera se podia editar. Ahora cada una tiene
 * su pantalla en la barra del area, y esta se queda con la que le da nombre.
 */
export default async function PaginaDatosEstablecimiento() {
  const config = await obtenerConfiguracion();

  return (
    <>
      <EncabezadoVista
        titulo="Datos del establecimiento"
        descripcion="Cómo se identifica la barbería en comprobantes, reportes y en el portal del cliente."
      />

      {config ? (
        <AjustesEstablecimiento configuracion={config} />
      ) : (
        // La fila la crea la instalacion. Si falta, no es un caso vacio
        // normal: es una base a medio poblar, y decirlo asi ahorra buscar el
        // problema en la pantalla equivocada.
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
