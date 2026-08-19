import { listarRoles, listarUsuarios } from '@barber-shop/api';
import { ROLES } from '@barber-shop/tipos';
import {
  BarraFiltros,
  CampoBusqueda,
  ChipEstado,
  EstadoVacio,
  FiltrosActivos,
  SelectorFiltro,
  SelectorMultiple,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  Td,
  TdCompleta,
  Th,
  Tr,
  fechaCorta,
  plural,
} from '@barber-shop/ui';

import { EncabezadoVista } from '@/componentes/armazon/encabezado-vista';
import { FormularioUsuario } from '@/componentes/formularios/formulario-usuario';
import { ETIQUETAS_ACTIVO, OPCIONES_ACTIVO, comunes, texto, type Parametros } from '@/lib/filtros';

export const metadata = { title: 'Usuarios' };

const ETIQUETA_ROL: Record<string, string> = {
  administrador: 'Administrador',
  recepcionista: 'Recepcionista',
  profesional: 'Profesional',
  cliente: 'Cliente',
};
const OPCIONES_ROL = ROLES.filter((r) => r !== 'cliente').map((r) => ({
  valor: r,
  etiqueta: ETIQUETA_ROL[r]!,
}));

/**
 * CU-019 — Gestionar Usuarios y Roles. Exclusiva del Administrador
 * (`v_admin` en la base): no aparece en el menú de ningún otro rol.
 */
export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const filtro = { ...comunes(params), rol: texto(params, 'rol') };

  const [usuarios, roles] = await Promise.all([listarUsuarios(filtro), listarRoles()]);

  return (
    <>
      <EncabezadoVista
        titulo="Usuarios"
        descripcion={plural(usuarios.length, 'usuario', 'usuarios')}
        accion={<FormularioUsuario roles={roles} />}
      />

      <Tarjeta>
        <BarraFiltros>
          <CampoBusqueda placeholder="Nombre o correo" />
          <SelectorFiltro nombre="rol" etiqueta="Rol" textoTodos="Todos los roles" opciones={OPCIONES_ROL} />
          <SelectorMultiple nombre="estado" etiqueta="Estado" opciones={OPCIONES_ACTIVO} />
        </BarraFiltros>

        <FiltrosActivos
          total={usuarios.length}
          sustantivo={['usuario', 'usuarios']}
          etiquetas={{
            q: { titulo: 'Búsqueda' },
            rol: { titulo: 'Rol', valores: ETIQUETA_ROL },
            estado: { titulo: 'Estado', valores: ETIQUETAS_ACTIVO },
          }}
        />

        <Tabla titulo="Usuarios del sistema">
          <TablaEncabezado>
            <Th>Usuario</Th>
            <Th>Correo</Th>
            <Th>Rol</Th>
            <Th>Alta</Th>
            <Th>Estado</Th>
            <Th>
              <span className="solo-lectores">Acciones</span>
            </Th>
          </TablaEncabezado>
          <TablaCuerpo>
            {usuarios.length === 0 ? (
              <TdCompleta colSpan={6}>
                <EstadoVacio
                  icono="shield-check"
                  titulo="No se encontraron usuarios"
                  descripcion="Ningún usuario cumple con los filtros aplicados."
                />
              </TdCompleta>
            ) : (
              usuarios.map((u) => (
                <Tr key={u.id_usuario} interactiva>
                  <Td className="font-medium" etiqueta="Usuario">
                    {u.nombre}
                    {u.es_barbero && (
                      <span className="text-cuerpo-sm text-terciario block font-normal">Barbero</span>
                    )}
                  </Td>
                  <Td className="text-secundario" etiqueta="Correo">
                    {u.email}
                  </Td>
                  <Td etiqueta="Rol">{ETIQUETA_ROL[u.rol] ?? u.rol}</Td>
                  <Td className="text-secundario" etiqueta="Alta">
                    {fechaCorta(u.created_at)}
                  </Td>
                  <Td etiqueta="Estado">
                    <ChipEstado
                      presentacion={
                        u.estado
                          ? { etiqueta: 'Activo', tono: 'exito', icono: 'circle-check' }
                          : { etiqueta: 'Inactivo', tono: 'neutro', icono: 'ban' }
                      }
                    />
                  </Td>
                  <Td etiqueta="Acciones" className="text-right">
                    <FormularioUsuario usuario={u} roles={roles} />
                  </Td>
                </Tr>
              ))
            )}
          </TablaCuerpo>
        </Tabla>
      </Tarjeta>

      <p className="text-cuerpo-sm text-terciario mt-4">
        El alta manda una invitación de Supabase Auth; la persona elige su propia contraseña
        (RN-047). Desactivar (RN-003) conserva la cuenta y el historial de acciones.
      </p>
    </>
  );
}
