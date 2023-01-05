import { ChartJSNodeCanvas } from 'chartjs-node-canvas'
import 'chartjs-adapter-moment'
import { ReadingSession } from './book'

export async function drawProgressChart(sessions: ReadingSession[]) {
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 1000, height: 600 })

  const image = await chartJSNodeCanvas.renderToBuffer(
    {
      type: 'line',
      data: {
        datasets: [
          {
            label: `Progress`,
            data: sessions.map(({ endPage, date }) => {
              return {
                x: date,
                y: endPage,
              }
            }) as any,
            borderColor: '#0f4c81',
          },
        ],
      },
      options: {
        backgroundColor: '#fff',
        scales: {
          x: {
            type: 'time',
          },
        },
      },
    },
    'image/png'
  )

  return image
}
