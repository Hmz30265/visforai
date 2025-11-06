import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Slider } from '../ui/slider';
import { Label } from '../ui/label';
import { Droplets, Gauge, Thermometer, TestTube } from 'lucide-react';

export default function ControlPanel({ filters, setFilters, reservoirs }) {
  const maxCapacity = reservoirs.length > 0 
    ? Math.max(...reservoirs.map(r => r.capacity || 0), 100000)
    : 100000;
  const maxDepth = reservoirs.length > 0
    ? Math.max(...reservoirs.map(r => r.depth || 0), 100)
    : 100;
  const maxTemp = reservoirs.length > 0
    ? Math.max(...reservoirs.map(r => r.temperature || 0), 30)
    : 30;

  return (
    <Card className="h-full shadow-lg border-none bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader className="border-b border-blue-100">
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Gauge className="w-5 h-5" />
          Data Controls
        </CardTitle>
        <p className="text-xs text-gray-600 mt-1">Adjust parameters to filter chart data</p>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        {/* Capacity Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Droplets className="w-4 h-4 text-blue-600" />
              Capacity Range
            </Label>
            <span className="text-xs text-gray-500">
              {filters.capacityRange[0].toLocaleString()} - {filters.capacityRange[1].toLocaleString()} m³
            </span>
          </div>
          <Slider
            value={filters.capacityRange}
            onValueChange={(value) => setFilters({ ...filters, capacityRange: value })}
            min={0}
            max={maxCapacity}
            step={1000}
            className="w-full"
          />
        </div>

        {/* Water Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Gauge className="w-4 h-4 text-cyan-600" />
              Water Level
            </Label>
            <span className="text-xs text-gray-500">
              {filters.levelRange[0]}% - {filters.levelRange[1]}%
            </span>
          </div>
          <Slider
            value={filters.levelRange}
            onValueChange={(value) => setFilters({ ...filters, levelRange: value })}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>

        {/* Depth Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Droplets className="w-4 h-4 text-indigo-600" />
              Depth Range
            </Label>
            <span className="text-xs text-gray-500">
              {filters.depthRange[0]}m - {filters.depthRange[1]}m
            </span>
          </div>
          <Slider
            value={filters.depthRange}
            onValueChange={(value) => setFilters({ ...filters, depthRange: value })}
            min={0}
            max={maxDepth}
            step={1}
            className="w-full"
          />
        </div>

        {/* Temperature Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Thermometer className="w-4 h-4 text-orange-600" />
              Temperature Range
            </Label>
            <span className="text-xs text-gray-500">
              {filters.temperatureRange[0]}°C - {filters.temperatureRange[1]}°C
            </span>
          </div>
          <Slider
            value={filters.temperatureRange}
            onValueChange={(value) => setFilters({ ...filters, temperatureRange: value })}
            min={0}
            max={maxTemp}
            step={0.5}
            className="w-full"
          />
        </div>

        {/* pH Range */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <TestTube className="w-4 h-4 text-purple-600" />
              pH Level Range
            </Label>
            <span className="text-xs text-gray-500">
              {filters.phRange[0]} - {filters.phRange[1]}
            </span>
          </div>
          <Slider
            value={filters.phRange}
            onValueChange={(value) => setFilters({ ...filters, phRange: value })}
            min={0}
            max={14}
            step={0.1}
            className="w-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
