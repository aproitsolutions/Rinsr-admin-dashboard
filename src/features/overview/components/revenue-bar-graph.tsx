'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

export const description = 'An interactive bar chart';

const chartConfig = {
  totalRevenue: {
    label: 'Total Revenue',
    color: 'var(--primary)'
  }
} satisfies ChartConfig;

export function RevenueBarGraph() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>('totalRevenue');
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/analytics/revenue/monthly');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setChartData(json.data);
        }
      } catch (error) {
        console.error('Failed to fetch revenue data', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const total = React.useMemo(
    () => ({
      totalRevenue: chartData.reduce((acc, curr) => acc + curr.totalRevenue, 0)
    }),
    [chartData]
  );

  if (loading) {
    return <div className='p-4'>Loading chart...</div>;
  }

  return (
    <Card className='@container/card !pt-3'>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 !py-0'>
          <CardTitle>Total Order Revenue</CardTitle>
          <CardDescription>
            <span className='hidden @[540px]/card:block'>
              Monthly Order Revenue Analytics
            </span>
            <span className='@[540px]/card:hidden'>Monthly Order Revenue</span>
          </CardDescription>
        </div>
        <div className='flex'>
          <div
            className='data-[active=true]:bg-primary/5 hover:bg-primary/5 relative flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left transition-colors duration-200 even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6'
            data-active={true}
          >
            <span className='text-muted-foreground text-xs'>
              {chartConfig.totalRevenue.label}
            </span>
            <span className='text-lg leading-none font-bold sm:text-3xl'>
              ₹{total.totalRevenue.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer
          config={chartConfig}
          className='aspect-auto h-[250px] w-full'
        >
          <BarChart
            data={chartData}
            margin={{
              left: 12,
              right: 12
            }}
          >
            <defs>
              <linearGradient id='fillRevenue' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='0%'
                  stopColor='var(--primary)'
                  stopOpacity={0.8}
                />
                <stop
                  offset='100%'
                  stopColor='var(--primary)'
                  stopOpacity={0.2}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value + '-01'); // Append day to make it parseable
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric'
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className='w-[150px]'
                  nameKey='totalRevenue'
                  labelFormatter={(value) => {
                    return new Date(value + '-01').toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric'
                    });
                  }}
                />
              }
            />
            <Bar
              dataKey={activeChart}
              fill='url(#fillRevenue)'
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
