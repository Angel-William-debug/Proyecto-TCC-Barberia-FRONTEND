'use client';

import { useRef, useState, useTransition, type ReactNode } from 'react';

import { AvisoFormulario, Boton, CuerpoFormulario, PanelLateral, type AnchoPanel } from '@barber-shop/ui';

import type { ResultadoAccion } from '@/acciones/comunes';

/**
 * Armazon de todo formulario del sistema (seccion 9.11).
 *
 * Junta el panel lateral, el `form`, el envio y el manejo de errores. Las
 * pantallas solo declaran sus campos; nada de esto se vuelve a escribir por
 * cada entidad.
 *
 * POR QUE NO USA `action={...}` DIRECTO
 *
 * Con la forma nativa, la accion se ejecuta y no hay manera de leer lo que
 * devolvio: no se puede cerrar el panel al guardar bien ni pintar el error del
 * campo cuando falla. Se envia a mano dentro de una transicion, que ademas da
 * el estado «guardando» gratis.
 */

export interface PropsPanelFormulario {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  ancho?: AnchoPanel;
  /** La accion de servidor que guarda. */
  accion: (datos: FormData) => Promise<ResultadoAccion>;
  /** Texto del boton primario. «Guardar» al editar, «Registrar» al dar de alta. */
  textoGuardar?: string;
  /**
   * Los campos reciben los errores por campo que devolvio la accion, de modo
   * que cada uno pinte el suyo debajo en lugar de amontonarlos arriba.
   */
  children: (errores: Record<string, string>) => ReactNode;
}

export function PanelFormulario({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  ancho = 'md',
  accion,
  textoGuardar = 'Guardar',
  children,
}: PropsPanelFormulario) {
  const [enviando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [sucio, setSucio] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  function cerrar() {
    setError(null);
    setErrores({});
    setSucio(false);
    onCerrar();
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);

    iniciar(async () => {
      const r = await accion(datos);

      if (r.ok) {
        cerrar();
        return;
      }

      setError(r.error);
      setErrores(r.campos ?? {});

      // El foco va al primer campo con error. Sin esto, en un formulario largo
      // el usuario ve el aviso de arriba y no sabe donde esta el problema.
      const primero = Object.keys(r.campos ?? {})[0];
      if (primero) {
        formulario.current
          ?.querySelector<HTMLElement>(`[name="${primero}"]`)
          ?.focus();
      }
    });
  }

  return (
    <PanelLateral
      abierto={abierto}
      onCerrar={cerrar}
      titulo={titulo}
      descripcion={descripcion}
      ancho={ancho}
      hayCambios={sucio && !enviando}
      pie={
        <>
          <Boton variante="terciario" onClick={cerrar} disabled={enviando}>
            Cancelar
          </Boton>
          {/* El boton vive en el pie, fuera del `form`, asi que lo alcanza por
              su atributo `form`. Es lo que permite dejarlo siempre a la vista
              sin sacar el formulario de su lugar. */}
          <Boton type="submit" form="formulario-panel" variante="primario" cargando={enviando}>
            {textoGuardar}
          </Boton>
        </>
      }
    >
      <form
        id="formulario-panel"
        ref={formulario}
        onSubmit={enviar}
        onChange={() => setSucio(true)}
        noValidate
      >
        <CuerpoFormulario>
          {error && <AvisoFormulario mensaje={error} />}
          {children(errores)}
        </CuerpoFormulario>
      </form>
    </PanelLateral>
  );
}
