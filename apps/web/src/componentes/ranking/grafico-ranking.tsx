'use client';

import { Bar } from 'react-chartjs-2';

import { COLORES_GRAFICO, cantidad, duracion, guaraniesSinSimbolo } from '@barber-shop/ui';
import {
  TITULOS_CRITERIO,
  valorPorCriterio,
  type CriterioRanking,
  type FilaRanking,
} from '@barber-shop/tipos';

import '../graficos/registro-chartjs';
import { usarColoresChart } from '../graficos/usar-colores-chart';

function formatearValor(valor: number, criterio: CriterioRanking): string {
  if (criterio === 'facturado' || criterio === 'ticket') return `Gs. ${guaraniesSinSimbolo(valor)}`;
  if (criterio === 'ocupacion') return duracion(valor);
  return cantidad(valor);
}

export function GraficoRanking({
  filas,
  criterio,
}: {
  filas: FilaRanking[];
  criterio: CriterioRanking;
}) {
  const colores = usarColoresChart();
  const valor = valorPorCriterio[criterio];
  const alto = Math.max(160, filas.length * 36);

  return (
    <div style={{ height: alto }} className="px-2 pb-2">
      <Bar
        data={{
          labels: filas.map((f) => f.nombre),
          datasets: [
            {
              label: TITULOS_CRITERIO[criterio],
              data: filas.map(valor),
              backgroundColor: COLORES_GRAFICO[0],
              borderRadius: 4,
              maxBarThickness: 22,
            },
          ],
        }}
        options={{
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: colores.tooltipFondo,
              titleColor: colores.texto,
              bodyColor: colores.texto,
              borderColor: colores.grilla,
              borderWidth: 1,
              padding: 10,
              callbacks: {
                label: (contexto) => {
                  const fila = filas[contexto.dataIndex]!;
                  return `${TITULOS_CRITERIO[criterio]}: ${formatearValor(valor(fila), criterio)}`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: colores.texto },
              grid: { color: colores.grilla },
              beginAtZero: true,
            },
            y: {
              ticks: { color: colores.texto },
              grid: { display: false },
            },
          },
        }}
      />
    </div>
  );
}
