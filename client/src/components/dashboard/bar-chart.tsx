import { 
  BarChart as RechartsBarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DataItem {
  name: string;
  value: number;
}

interface BarChartProps {
  data: DataItem[];
  dataKey?: string;
  nameKey?: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  showLegend?: boolean;
  legendName?: string;
}

export function BarChart({
  data,
  dataKey = "value",
  nameKey = "name",
  color = "hsl(var(--primary))",
  height = 300,
  showGrid = true,
  showTooltip = true,
  showLegend = false,
  legendName = "Value"
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
        <XAxis 
          dataKey={nameKey} 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        {showTooltip && <Tooltip />}
        {showLegend && <Legend />}
        <Bar 
          dataKey={dataKey} 
          fill={color} 
          radius={[4, 4, 0, 0]} 
          barSize={30}
          name={legendName} 
        />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
