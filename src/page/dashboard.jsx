import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchReservoirs } from '../services/reservoirService';
import { Skeleton } from '../components/ui/skeleton';
import MapView from '../components/reservoir/MapView';
import ControlPanel from '../components/reservoir/ControlPanel';
import ChartsPanel from '../components/reservoir/ChartsPanel';

export default function Dashboard() {
  const { data: reservoirs, isLoading } = useQuery({
    queryKey: ['reservoirs'],
    queryFn: fetchReservoirs,
    initialData: [],
  });

  // Calculate initial filter ranges based on data
  const initialFilters = useMemo(() => {
    if (reservoirs.length === 0) {
      return {
        capacityRange: [0, 100000],
        levelRange: [0, 100],
        depthRange: [0, 100],
        temperatureRange: [0, 30],
        phRange: [0, 14],
      };
    }

    const maxCapacity = Math.max(...reservoirs.map(r => r.capacity || 0), 100000);
    const maxDepth = Math.max(...reservoirs.map(r => r.depth || 0), 100);
    const maxTemp = Math.max(...reservoirs.map(r => r.temperature || 0), 30);

    return {
      capacityRange: [0, maxCapacity],
      levelRange: [0, 100],
      depthRange: [0, maxDepth],
      temperatureRange: [0, maxTemp],
      phRange: [0, 14],
    };
  }, [reservoirs]);

  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Filter reservoirs based on slider values
  const filteredData = useMemo(() => {
    return reservoirs.filter(reservoir => {
      const capacity = reservoir.capacity || 0;
      const level = reservoir.current_level || 0;
      const depth = reservoir.depth || 0;
      const temp = reservoir.temperature || 0;
      const ph = reservoir.ph_level || 7;

      return (
        capacity >= filters.capacityRange[0] &&
        capacity <= filters.capacityRange[1] &&
        level >= filters.levelRange[0] &&
        level <= filters.levelRange[1] &&
        depth >= filters.depthRange[0] &&
        depth <= filters.depthRange[1] &&
        temp >= filters.temperatureRange[0] &&
        temp <= filters.temperatureRange[1] &&
        ph >= filters.phRange[0] &&
        ph <= filters.phRange[1]
      );
    });
  }, [reservoirs, filters]);

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 p-6">
        <div className="h-full grid grid-cols-2 grid-rows-2 gap-6">
          <Skeleton className="h-full" />
          <Skeleton className="h-full" />
          <Skeleton className="h-full col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">
          Water Reservoir Analytics
        </h1>
        <p className="text-gray-600 mt-2">Real-time monitoring and analysis of reservoir systems</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ height: 'calc(100vh - 180px)' }}>
        {/* Top Left - Control Panel */}
        <div className="h-96 lg:h-full">
          <ControlPanel 
            filters={filters} 
            setFilters={setFilters}
            reservoirs={filteredData}
          />
        </div>

        {/* Top Right - Map */}
        <div className="h-96 lg:h-full">
          <MapView 
            reservoirs={filteredData}
          />
        </div>

        {/* Bottom - Charts (Full Width) */}
        <div className="lg:col-span-2 h-auto lg:h-full">
          <ChartsPanel filteredData={filteredData} />
        </div>
      </div>
    </div>
  );
}