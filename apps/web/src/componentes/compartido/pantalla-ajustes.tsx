'use client';

import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';

import { AvisoFormulario, BarraGuardar, CuerpoFormulario } from '@barber-shop/ui';

import type { ResultadoAccion } from '@/acciones/base';

/**
 * Armazon de las pantallas de ajustes (seccion 9.12).
 *
 * Es la contraparte de `PanelFormulario` para el area de configuracion. La
 * diferencia no es de estilo, es de situacion:
 *
 *   Alta y edicion  -> panel lateral. El usuario abrio algo a proposito, lo
 *                      completa y confirma. El panel se cierra al guardar.
 *   Ajustes         -> la pantalla ES el formulario. El usuario llego a mirar
 *                      como esta configurado algo y a veces corrige un dato al
 *                      pasar. No hay nada que abrir ni que cerrar.
 *
 * Meter los ajustes en un panel obligaba a leer los valores en una lista y
 * volver a leerlos, ya como campos, adentro del panel: dos representaciones de
 * lo mismo, y el usuario comparando entre las dos. Con los campos siempre
 * editables hay una sola.
 *
 * QUE APARECE Y CUANDO
 *
 * La barra de guardado no esta desde el principio: aparece al primer cambio.
 * Asi ella misma es el aviso de que hay algo sin guardar, sin necesidad de un
 * segundo cartel que lo diga.
 *
 * Al guardar bien, la barra se va y queda una confirmacion que se retira sola
 * a los cinco segundos. Sin ella, guardar no se distingue de no haber hecho
 * nada: la pantalla se queda exactamente igual, porque los valores ya estaban
 * escritos en los campos.
 */
export interface PropsPantallaAjustes {
  /** Identificador del `form`. La barra alcanza el boton por este atributo. */
  id: string;
  /** La accion de servidor que guarda esta pantalla. */
  accion: (datos: FormData) => Promise<ResultadoAccion>;
  /** Los campos reciben los errores por campo, para pintarlos donde corresponde. */
  children: (errores: Record<string, string>) => ReactNode;
}

export function PantallaAjustes({ id, accion, children }: PropsPantallaAjustes) {
  const [enviando, iniciar] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [sucio, setSucio] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const formulario = useRef<HTMLFormElement>(null);

  // La confirmacion se retira sola. Dejarla fija terminaria diciendo «cambios
  // guardados» sobre una pantalla que el usuario ya volvio a editar.
  useEffect(() => {
    if (!guardado) return;
    const t = setTimeout(() => setGuardado(false), 5000);
    return () => clearTimeout(t);
  }, [guardado]);

  /**
   * Aviso del navegador al cerrar la pestana con cambios sin guardar.
   *
   * En el panel lateral no hace falta porque cerrarlo es un gesto deliberado
   * que el propio panel puede interceptar. Aca el usuario se va de la pagina, y
   * el unico que puede avisar es el navegador.
   */
  useEffect(() => {
    if (!sucio) return;
    const alSalir = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [sucio]);

  function descartar() {
    formulario.current?.reset();
    setSucio(false);
    setError(null);
    setErrores({});
  }

  function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = new FormData(evento.currentTarget);

    iniciar(async () => {
      const r = await accion(datos);

      if (r.ok) {
        setSucio(false);
        setError(null);
        setErrores({});
        setGuardado(true);
        return;
      }

      setError(r.error);
      setErrores(r.campos ?? {});

      // El foco va al primer campo con error. Sin esto, en una pantalla larga
      // el usuario ve el aviso de abajo y no sabe donde esta el problema.
      const primero = Object.keys(r.campos ?? {})[0];
      if (primero) {
        formulario.current?.querySelector<HTMLElement>(`[name="${primero}"]`)?.focus();
      }
    });
  }

  return (
    <form
      id={id}
      ref={formulario}
      onSubmit={enviar}
      onChange={() => {
        setSucio(true);
        setGuardado(false);
      }}
      noValidate
    >
      <CuerpoFormulario>
        {guardado && <AvisoFormulario mensaje="Los cambios se guardaron." tono="info" />}
        {children(errores)}
      </CuerpoFormulario>

      <BarraGuardar
        visible={sucio}
        guardando={enviando}
        formulario={id}
        onDescartar={descartar}
        error={error ?? undefined}
      />
    </form>
  );
}
