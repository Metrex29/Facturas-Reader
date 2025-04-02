import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { ResponsiveBump } from '@nivo/bump';

// Datos de ejemplo para el gráfico
const data = [
  {
    "id": "Gastos Mensuales",
    "data": [
      { "x": "Ene", "y": 3 },
      { "x": "Feb", "y": 2 },
      { "x": "Mar", "y": 2 },
      { "x": "Abr", "y": 4 },
      { "x": "May", "y": 3 }
    ]
  },
  {
    "id": "Ingresos",
    "data": [
      { "x": "Ene", "y": 2 },
      { "x": "Feb", "y": 3 },
      { "x": "Mar", "y": 4 },
      { "x": "Abr", "y": 3 },
      { "x": "May", "y": 5 }
    ]
  }
];

export default function Hero() {
  return (
    <section
      className="flex w-full items-start justify-center bg-[url('https://tailframes.com/images/squares-bg.webp')] bg-cover bg-center bg-no-repeat"
    >
      <div className="flex max-w-screen-2xl grow flex-col items-start justify-start gap-12 px-3 py-12 md:pt-24 lg:px-0 xl:flex-row">
        <div className="sm:pl-8 lg:pl-16 xl:pl-32 mb-0 flex flex-1 flex-col items-start gap-12 px-0 xl:mb-24">
          <Badge size="large" variant="secondary">
            Facturas IA
          </Badge>
          <div className="flex max-w-lg flex-col gap-6">
            <h3 className="text-4xl font-semibold text-slate-950 md:text-6xl">
              Bienvenido a tu gestor de facturas inteligente
            </h3>
            <p className="text-lg font-normal leading-7 text-slate-500">
              Gestiona tus facturas de manera eficiente y obtén análisis detallados de tus gastos.
            </p>
          </div>
          <div className="flex gap-4">
            <Button size="large">
              Comenzar
            </Button>
            <Button size="large" variant="text" endAdornment={<ArrowRightIcon className="size-6 stroke-inherit" />}>
              Ver más
            </Button>
          </div>
        </div>
        <div className="relative flex flex-1 flex-col h-[400px] lg:px-16">
          <ResponsiveBump
            data={data}
            xPadding={0.5}
            xOuterPadding={0.35}
            yOuterPadding={1}
            colors={{ scheme: 'purpleRed_green' }}
            lineWidth={5}
            opacity={0.95}
            inactiveOpacity={0.15}
            startLabelTextColor={{ from: 'color', modifiers: [] }}
            pointSize={0}
            activePointSize={4}
            inactivePointSize={0}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={3}
            activePointBorderWidth={3}
            pointBorderColor={{ from: 'serie.color' }}
            enableGridX={false}
            axisTop={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              // aqui se puede editar la x
              legend: 'Meses',
              legendPosition: 'middle',
              legendOffset: 32,
              truncateTickAt: 0
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              // aqui se puede editar la y
              legend: 'Valor',
              legendPosition: 'middle',
              legendOffset: -40,
              truncateTickAt: 0
            }}
            
            margin={{ top: 40, right: 100, bottom: 40, left: 60 }}
            axisRight={null}
          />
        </div>
      </div>
    </section>
  );
}