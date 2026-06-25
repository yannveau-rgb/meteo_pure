/**
 * Climatology utility for comparing current weather with historical normals (1991-2020) in France.
 */

interface MonthlyNormal {
  min: number;
  max: number;
}

interface ClimateStation {
  name: string;
  lat: number;
  lon: number;
  normals: MonthlyNormal[]; // 12 months, 0 = January, 11 = December
}

// 5 Key Climate Stations representing geographical regions of France with 1991-2020 normals
const CLIMATE_STATIONS: ClimateStation[] = [
  {
    name: "Nord-Ouest (Brest)",
    lat: 48.44,
    lon: -4.41,
    normals: [
      { min: 6.3, max: 9.8 },   // Jan
      { min: 5.9, max: 9.8 },   // Feb
      { min: 6.6, max: 11.4 },  // Mar
      { min: 7.4, max: 13.2 },  // Apr
      { min: 9.7, max: 15.6 },  // May
      { min: 11.9, max: 18.0 }, // Jun
      { min: 13.7, max: 19.8 }, // Jul
      { min: 13.7, max: 20.0 }, // Aug
      { min: 12.3, max: 18.7 }, // Sep
      { min: 10.4, max: 15.3 }, // Oct
      { min: 8.2, max: 12.1 },  // Nov
      { min: 6.8, max: 10.3 }   // Dec
    ]
  },
  {
    name: "Nord-Est / Centre (Paris)",
    lat: 48.85,
    lon: 2.35,
    normals: [
      { min: 2.7, max: 7.6 },
      { min: 2.8, max: 8.7 },
      { min: 4.8, max: 12.7 },
      { min: 7.2, max: 16.3 },
      { min: 10.6, max: 19.9 },
      { min: 13.8, max: 23.3 },
      { min: 15.8, max: 25.8 },
      { min: 15.7, max: 25.9 },
      { min: 12.4, max: 21.8 },
      { min: 9.5, max: 16.6 },
      { min: 5.8, max: 11.1 },
      { min: 3.4, max: 8.2 }
    ]
  },
  {
    name: "Sud-Ouest (Bordeaux)",
    lat: 44.83,
    lon: -0.58,
    normals: [
      { min: 2.8, max: 10.4 },
      { min: 3.0, max: 11.9 },
      { min: 5.0, max: 15.1 },
      { min: 7.2, max: 17.8 },
      { min: 10.8, max: 21.4 },
      { min: 14.2, max: 24.8 },
      { min: 16.0, max: 27.1 },
      { min: 15.9, max: 27.4 },
      { min: 12.7, max: 24.1 },
      { min: 10.1, max: 19.2 },
      { min: 6.0, max: 13.9 },
      { min: 3.5, max: 10.8 }
    ]
  },
  {
    name: "Midi-Pyrénées (Toulouse)",
    lat: 43.60,
    lon: 1.44,
    normals: [
      { min: 2.6, max: 9.7 },
      { min: 2.9, max: 11.2 },
      { min: 5.0, max: 14.7 },
      { min: 7.1, max: 17.4 },
      { min: 10.9, max: 21.1 },
      { min: 14.5, max: 25.3 },
      { min: 16.6, max: 28.0 },
      { min: 16.6, max: 27.9 },
      { min: 13.2, max: 24.6 },
      { min: 10.4, max: 19.4 },
      { min: 6.0, max: 13.6 },
      { min: 3.3, max: 10.2 }
    ]
  },
  {
    name: "Sud-Est / Méditerranée (Marseille)",
    lat: 43.29,
    lon: 5.38,
    normals: [
      { min: 3.0, max: 11.8 },
      { min: 3.4, max: 12.7 },
      { min: 5.8, max: 15.9 },
      { min: 8.4, max: 18.6 },
      { min: 12.2, max: 22.8 },
      { min: 16.2, max: 27.1 },
      { min: 18.8, max: 30.2 },
      { min: 18.6, max: 29.8 },
      { min: 15.1, max: 25.7 },
      { min: 11.9, max: 20.7 },
      { min: 7.1, max: 15.5 },
      { min: 4.1, max: 12.3 }
    ]
  }
];

export interface LocalClimatology {
  monthName: string;
  normalMin: number;
  normalMax: number;
  normalMean: number;
  deviationMin: number;
  deviationMax: number;
  comparisonText: string;
  seasonStatus: 'warmer' | 'colder' | 'normal';
}

/**
 * Calculates local monthly temperature normals using IDW interpolation.
 * Then compares it with today's actual Min & Max temperatures.
 */
export function getLocalClimatology(
  lat: number,
  lon: number,
  currentTempMin: number,
  currentTempMax: number
): LocalClimatology {
  const date = new Date();
  const monthIdx = date.getMonth(); // 0-11
  
  const FrenchMonths = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  
  const monthName = FrenchMonths[monthIdx];
  
  let totalWeight = 0;
  let interpolatedMin = 0;
  let interpolatedMax = 0;
  
  // Inverse Distance Weighting
  for (const station of CLIMATE_STATIONS) {
    // Euclidean approximation is sufficient for continental scale distances
    const distSq = Math.pow(lat - station.lat, 2) + Math.pow(lon - station.lon, 2);
    
    // Exact match safeguard
    if (distSq < 0.001) {
      interpolatedMin = station.normals[monthIdx].min;
      interpolatedMax = station.normals[monthIdx].max;
      totalWeight = 1;
      break;
    }
    
    const weight = 1 / distSq;
    totalWeight += weight;
    interpolatedMin += station.normals[monthIdx].min * weight;
    interpolatedMax += station.normals[monthIdx].max * weight;
  }
  
  // Compute final interpolated climatological normal temperatures bounded to 1 decimal place
  const normalMin = Math.round((interpolatedMin / totalWeight) * 10) / 10;
  const normalMax = Math.round((interpolatedMax / totalWeight) * 10) / 10;
  const normalMean = Math.round(((normalMin + normalMax) / 2) * 10) / 10;
  
  // Calculate deviations
  const deviationMin = Math.round((currentTempMin - normalMin) * 10) / 10;
  const deviationMax = Math.round((currentTempMax - normalMax) * 10) / 10;
  
  // Average deviation
  const avgDeviation = (deviationMin + deviationMax) / 2;
  
  let comparisonText = "";
  let seasonStatus: 'warmer' | 'colder' | 'normal' = 'normal';
  
  if (avgDeviation >= 1.5) {
    seasonStatus = 'warmer';
    comparisonText = `Températures nettement au-dessus des normales de saison (${avgDeviation > 0 ? '+' : ''}${avgDeviation.toFixed(1)}°C par rapport à la moyenne historique de ${monthName}).`;
  } else if (avgDeviation <= -1.5) {
    seasonStatus = 'colder';
    comparisonText = `Températures nettement en dessous des normales de saison (${avgDeviation.toFixed(1)}°C par rapport à la moyenne historique de ${monthName}).`;
  } else {
    seasonStatus = 'normal';
    comparisonText = `Températures conformes aux normales de saison (écart léger de ${avgDeviation > 0 ? '+' : ''}${avgDeviation.toFixed(1)}°C par rapport à la moyenne historique de ${monthName}).`;
  }
  
  return {
    monthName,
    normalMin,
    normalMax,
    normalMean,
    deviationMin,
    deviationMax,
    comparisonText,
    seasonStatus
  };
}
