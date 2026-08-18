'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { MODO_DEMO } from '@barber-shop/api/demo';
import { clienteNavegador } from '@barber-shop/api/navegador';
import { Boton } from '@barber-shop/ui';

export function BotonSalir() {
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  async function salir() {
    setSaliendo(true);

    // En modo demostracion no hay sesion que cerrar.
    if (MODO_DEMO) {
      router.push('/');
      return;
    }

    await clienteNavegador().auth.signOut();
    // `refresh()` antes de `push()`: fuerza a que el layout del servidor
    // vuelva a resolver la sesion y no sirva la version en cache.
    router.refresh();
    router.push('/ingresar');
  }

  return (
    <Boton variante="terciario" tamano="sm" icono="log-out" cargando={saliendo} onClick={salir}>
      Salir
    </Boton>
  );
}
