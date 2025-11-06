import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  LineChart, Line, ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart
} from 'recharts';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ChartsPanel({ filteredData }) {
  // Prepare data for different chart types - using empty arrays to remove all data points
  const lineChartData = [];

  const scatterData = [];

  const areaChartData = [];

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Activity className="w-5 h-5" />
          Reservoir Analytics
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs defaultValue="line" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="line" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Line Chart
            </TabsTrigger>
            <TabsTrigger value="scatter" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Scatter Plot
            </TabsTrigger>
            <TabsTrigger value="area" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Area Chart
            </TabsTrigger>
          </TabsList>

          <TabsContent value="line" className="mt-0">
            <div className="space-y-4">
              <div className="bg-blue-50/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Water Level & Temperature Trends</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="level" 
                      stroke="#0ea5e9" 
                      strokeWidth={3}
                      name="Water Level (%)"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="temperature" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      name="Temperature (°C)"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scatter" className="mt-0">
            <div className="bg-purple-50/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Capacity vs Water Level Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    type="number" 
                    dataKey="capacity" 
                    name="Capacity (m³)" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Capacity (m³)', position: 'insideBottom', offset: -5, fontSize: 12 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="level" 
                    name="Level (%)" 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Water Level (%)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <Legend />
                  <Scatter 
                    name="Reservoirs" 
                    data={[]} 
                    fill="#8b5cf6"
                    shape="circle"
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="area" className="mt-0">
            <div className="bg-green-50/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Capacity Utilization Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Volume (1000 m³)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="capacity" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981"
                    fillOpacity={0.3}
                    name="Total Capacity (1000 m³)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="current" 
                    stackId="2"
                    stroke="#0ea5e9" 
                    fill="#0ea5e9"
                    fillOpacity={0.6}
                    name="Current Volume (1000 m³)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}