import { MODULOS_POR_ROL, ROLES, type Modulo } from '@barber-shop/tipos';
import {
  Icono,
  Tabla,
  TablaCuerpo,
  TablaEncabezado,
  Tarjeta,
  TarjetaEncabezado,
  Td,
  Th,
  Tr,
} from '@barber-shop/ui';

import { MENU, MENU_CONFIGURACION } from '@/lib/navegacion';

const ETIQUETA_ROL: Record<string, string> = {
  administrador: 'Administrador',
  recepcionista: 'Recepcionista',
  profesional: 'Barbero',
  cliente: 'Cliente',
};

/**
 * Roles y permisos (vistas 9 y 11 del anexo, redefinidas el 15/10/2026).
 *
 * El anexo pedía crear roles y asignarles permisos desde una pantalla. En este
 * sistema los cuatro roles son fijos y lo que cada uno puede hacer lo deciden
 * las políticas RLS de la base, no una tabla de permisos editable: una
 * pantalla para crear roles prometería algo que la base no hace. Lo que sí
 * sirve es VER qué alcanza cada rol, y eso muestra esta matriz, armada con la
 * misma lista que arma los menús (`MODULOS_POR_ROL`), así que no puede
 * desalinearse de lo que cada uno ve. El rol de una persona se asigna en su
 * alta o edición (vista 10).
 */
export function MatrizPermisos() {
  const vistos = new Set<Modulo>();
  const filas = [...MENU, ...MENU_CONFIGURACION].filter((e) => {
    if (vistos.has(e.modulo)) return false;
    vistos.add(e.modulo);
    return true;
  });

  return (
    <Tarjeta className="mt-6">
      <TarjetaEncabezado
        titulo="Roles y permisos"
        descripcion="Qué sección del sistema alcanza cada rol. Los roles son fijos; la base hace cumplir estos permisos."
      />
      <Tabla titulo="Permisos por rol">
        <TablaEncabezado>
          <Th>Sección</Th>
          {ROLES.map((r) => (
            <Th key={r}>{ETIQUETA_ROL[r]}</Th>
          ))}
        </TablaEncabezado>
        <TablaCuerpo>
          {filas.map((e) => (
            <Tr key={e.modulo}>
              <Td className="font-medium" etiqueta="Sección">
                {e.etiqueta}
              </Td>
              {ROLES.map((r) => {
                const tiene = MODULOS_POR_ROL[r].includes(e.modulo);
                return (
                  <Td key={r} etiqueta={ETIQUETA_ROL[r]}>
                    {tiene ? (
                      <Icono nombre="check" tamano="sm" className="text-exito" etiqueta="Sí" />
                    ) : (
                      <span className="text-terciario" aria-label="No">
                        —
                      </span>
                    )}
                  </Td>
                );
              })}
            </Tr>
          ))}
          <Tr>
            <Td className="font-medium" etiqueta="Sección">
              Portal del cliente (reservas, historial)
            </Td>
            {ROLES.map((r) => (
              <Td key={r} etiqueta={ETIQUETA_ROL[r]}>
                {r === 'cliente' ? (
                  <Icono nombre="check" tamano="sm" className="text-exito" etiqueta="Sí" />
                ) : (
                  <span className="text-terciario" aria-label="No">
                    —
                  </span>
                )}
              </Td>
            ))}
          </Tr>
        </TablaCuerpo>
      </Tabla>
    </Tarjeta>
  );
}
