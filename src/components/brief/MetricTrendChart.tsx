import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Observation } from '../../screens/BriefScreen';

interface MetricTrendChartProps {
  observations: Observation[];
  metric: string;
  now: string;
}

export const MetricTrendChart: React.FC<MetricTrendChartProps> = ({ observations, metric, now }) => {
  const chartData = useMemo(() => {
    // Filter and sort observations for the specific metric
    const metricObs = observations
      .filter((o) => o.metric === metric)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return metricObs.map((obs) => ({
      date: new Date(obs.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      timestamp: new Date(obs.timestamp).getTime(),
      value: obs.value,
    }));
  }, [observations, metric]);

  if (chartData.length === 0) return null;

  const nowTime = new Date(now).getTime();
  const DAY = 24 * 60 * 60 * 1000;
  const baselineStart = nowTime - 28 * DAY;
  const baselineEnd = nowTime - 8 * DAY;

  return (
    <div className="h-48 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af" 
            fontSize={12} 
            tickMargin={8} 
            minTickGap={30} 
          />
          <YAxis 
            stroke="#9ca3af" 
            fontSize={12} 
            domain={['dataMin - 5', 'dataMax + 5']}
            tickFormatter={(val) => (typeof val === 'number' ? val.toFixed(1) : val)}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '4px', color: '#f3f4f6' }}
            itemStyle={{ color: '#fbbf24' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <ReferenceArea 
            x1={new Date(baselineStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
            x2={new Date(baselineEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} 
            fill="#374151" 
            fillOpacity={0.15} 
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#fbbf24" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#fbbf24' }} 
            activeDot={{ r: 5 }} 
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
        <span>Shaded: Baseline (Days 28-8)</span>
        <span>Line: Recent (Last 7 Days)</span>
      </div>
    </div>
  );
};
