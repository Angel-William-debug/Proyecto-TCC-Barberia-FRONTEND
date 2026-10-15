import Link from 'next/link';
import { redirect } from 'next/navigation';

import { usuarioActual } from '@barber-shop/api';
import { ChipEstado, PRESENTACION_ROL, Tarjeta, TarjetaEncabezado } from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { FormularioCambiarContrasena } from '@/componentes/sesion/formulario-cambiar-contrasena';

export const metadata = { title: 'Mi perfil' };

/**
 * Mi perfil (vistas 3 y 4 del anexo; 15/10/2026): la cuenta de quien está
 * usando el panel y el cambio de contraseña. Se llega tocando el nombre al pie
 * de la barra lateral. Lo ven todos los roles del panel.
 *
 * El nombre, el correo y el rol los cambia el administrador desde Usuarios:
 * dejar que cada uno se cambie el rol a sí mismo no tendría sentido, y el
 * correo es con el que se ingresa.
 */
export default async function PaginaPerfil() {
  const usuario = await usuarioActual();
  if (!usuario) redirect('/ingresar');

  return (
    <>
      <EncabezadoVista titulo="Mi perfil" descripcion="Su cuenta en el sistema" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Tarjeta>
          <TarjetaEncabezado titulo="Datos de la cuenta" />
          <dl className="text-cuerpo grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 px-4 pb-6 sm:px-6">
            <dt className="text-terciario">Nombre</dt>
            <dd className="text-principal font-medium">{usuario.nombre}</dd>
            <dt className="text-terciario">Correo</dt>
            <dd className="text-principal break-all">{usuario.email}</dd>
            <dt className="text-terciario">Rol</dt>
            <dd>
              <ChipEstado presentacion={PRESENTACION_ROL[usuario.rol]} />
            </dd>
            {usuario.idProfesional !== null && (
              <>
                <dt className="text-terciario">Barbero</dt>
                <dd>
                  <Link href="/panel/mi-dia" className="text-marca">
                    Ver mi día, mis servicios y mis comisiones
                  </Link>
                </dd>
              </>
            )}
          </dl>
          <p className="text-cuerpo-sm text-terciario border-borde-sutil border-t px-4 py-4 sm:px-6">
            Para cambiar el nombre, el correo o el rol, pídaselo al administrador.
          </p>
        </Tarjeta>

        <Tarjeta>
          <TarjetaEncabezado
            titulo="Cambiar contraseña"
            descripcion="Se pide la actual para que nadie pueda cambiarla con la sesión abierta"
          />
          <div className="px-4 pb-6 sm:px-6">
            <FormularioCambiarContrasena email={usuario.email} />
          </div>
        </Tarjeta>
      </div>
    </>
  );
}
