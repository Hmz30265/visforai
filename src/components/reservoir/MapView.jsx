import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Droplet, MapPin } from 'lucide-react';

export default function MapView({ reservoirs }) {
  const [selectedReservoir, setSelectedReservoir] = useState(null);

  // You can replace this URL with your own static map image
  const staticMapUrl = "/images/map.jpg";

  return (
    <Card className="h-full overflow-hidden shadow-lg border-none">
      <div className="h-full relative">
        {/* Header */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md">
          <h3 className="font-semibold text-sm text-gray-900">Reservoir Locations</h3>
          <p className="text-xs text-gray-500">{reservoirs.length} reservoirs</p>
        </div>

        {/* Static Map Image */}
        <div className="relative h-full w-full">
          <img 
            src={staticMapUrl}
            alt="Reservoir Map"
            className="w-full h-full object-cover"
          />
          
          {/* Overlay markers on the static map */}
          <div className="absolute inset-0">
            {reservoirs.map((reservoir, index) => {
              // Position markers evenly across the map
              // You can adjust these percentages based on your actual map
              const positions = [
                { top: '50%', left: '65%' },
                // { top: '35%', left: '45%' },
                // { top: '50%', left: '65%' },
                // { top: '60%', left: '30%' },
                // { top: '70%', left: '55%' },
                // { top: '100%', left: '100%' },
              ];
              
              const position = positions[index % positions.length];
              
              return (
                <div
                  key={reservoir.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ top: position.top, left: position.left }}
                  onMouseEnter={() => setSelectedReservoir(reservoir)}
                  onMouseLeave={() => setSelectedReservoir(null)}
                >
                  {/* Marker Pin */}
                  <div className="relative">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white group-hover:scale-110 transition-transform">
                      <Droplet className="w-4 h-4 text-white" fill="white" />
                    </div>
                    
                    {/* Pulse effect */}
                    {/* <div className="absolute inset-0 w-8 h-8 bg-blue-600 rounded-full animate-ping opacity-75" /> */}
                  </div>

                  {/* Popup on hover */}
                  {selectedReservoir?.id === reservoir.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white rounded-lg shadow-xl p-4 border border-gray-200 z-20">
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
                      </div>
                      
                      <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4" />
                        {reservoir.name}
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Capacity:</span>
                          <span className="font-medium">{reservoir.capacity?.toLocaleString()} m³</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Level:</span>
                          <span className="font-medium text-blue-600">{reservoir.current_level}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Depth:</span>
                          <span className="font-medium">{reservoir.depth}m</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Temperature:</span>
                          <span className="font-medium">{reservoir.temperature}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">pH Level:</span>
                          <span className="font-medium">{reservoir.ph_level}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}