'use client';

import { Bar } from 'react-chartjs-2';

import { COLORES_GRAFICO, guaraniesSinSimbolo } from '@barber-shop/ui';
import type { VistaIngresoPorPeriodo } from '@barber-shop/tipos';

import '../graficos/registro-chartjs';
import { usarColoresChart } from '../graficos/usar-colores-chart';

const MESES = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

export function GraficoIngresos({ datos }: { datos: VistaIngresoPorPeriodo[] }) {
  const colores = usarColoresChart();

  // La consulta trae lo más reciente primero (para la lista de abajo); el
  // gráfico se lee de izquierda a derecha, así que va del mes más viejo al
  // más nuevo.
  const ordenado = [...datos].reverse();

  return (
    <div className="h-64 px-2">
      <Bar
        data={{
          labels: ordenado.map((i) => `${MESES[i.mes - 1]} ${String(i.anio).slice(2)}`),
          datasets: [
            {
              label: 'Ingresos',
              data: ordenado.map((i) => i.total_ingresos),
              backgroundColor: COLORES_GRAFICO[0],
              borderRadius: 4,
              maxBarThickness: 40,
            },
          ],
        }}
        options={{
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
                  const fila = ordenado[contexto.dataIndex]!;
                  return [
                    `Gs. ${guaraniesSinSimbolo(fila.total_ingresos)}`,
                    `${fila.cantidad_servicios} servicios · ticket promedio Gs. ${guaraniesSinSimbolo(fila.ticket_promedio)}`,
                  ];
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: colores.texto },
              grid: { display: false },
            },
            y: {
              ticks: {
                color: colores.texto,
                callback: (valor) => `Gs. ${guaraniesSinSimbolo(Number(valor))}`,
              },
              grid: { color: colores.grilla },
              beginAtZero: true,
            },
          },
        }}
      />
    </div>
  );
}
