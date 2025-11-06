// Reservoir data service
// Generates mock reservoir data

function generateMockReservoirs() {
  const names = [
    'Lake Superior',
    'Lake Michigan',
    'Lake Huron',
    'Lake Erie',
    'Lake Ontario',
    'Great Salt Lake',
    'Lake Tahoe',
    'Crater Lake',
  ];

  return names.map((name, index) => ({
    id: `reservoir-${index + 1}`,
    name,
    // latitude: 40 + Math.random() * 10,
    // longitude: -100 + Math.random() * 20,
    // capacity: Math.floor(50000 + Math.random() * 200000),
    // current_level: Math.floor(30 + Math.random() * 60),
    // depth: Math.floor(20 + Math.random() * 80),
    // temperature: Math.floor(10 + Math.random() * 20),
    // ph_level: parseFloat((6.5 + Math.random() * 2).toFixed(1)),
    // measurement_date: new Date().toISOString().split('T')[0],
  }));
}

export async function fetchReservoirs() {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return generateMockReservoirs();//testing push just
}

