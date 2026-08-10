/**
 * Types defining French Commune and Weather structures
 */

export interface Commune {
  nom: string;
  code: string;
  codesPostaux: string[];
  centre: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  codeDepartement: string;
  score?: number;
}

/** A real measurement from a Météo-France station, as served by /api/observation. */
export interface StationObservation {
  station: string;
  stationId: string;
  distanceKm: number;
  observedAt: string;
  temperature?: number;      // °C
  humidity?: number;         // %
  windSpeed?: number;        // km/h
  windGusts?: number;        // km/h
  precipitation1h?: number;  // mm over the past hour
  altitudeDeltaM?: number;   // commune minus station
  lapseCorrected?: boolean;  // temperature adjusted for the altitude gap
}

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGusts?: number;       // km/h
  windDirection?: number;   // degrees 0-360
  cloudCover?: number;      // %
  pressure?: number;        // hPa
  visibility?: number;      // metres
  weatherCode: number;
  weatherDesc: string;
  iconName: string;
  precipitation: number;
  time: string;
  confidence?: 'high' | 'medium' | 'low';  // agreement between the three models on the current temperature
  modelSpread?: number;                    // °C between the warmest and coldest model
  /** Set when the values above are a station measurement rather than a forecast. */
  observed?: StationObservation;
}

export interface HourlyForecastItem {
  time: string; // "14:00"
  temp: number;
  weatherCode: number;
  iconName: string;
  precipitationProbability: number;
  precipitation: number;
  windSpeed?: number;       // km/h
  stormRisk?: boolean;      // true when lightning potential or CAPE elevated but code not yet 95+
}

export interface DailyForecastItem {
  date: string; // "Lundi 22"
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  iconName: string;
  uvIndex: number;
  precipitationSum?: number;  // mm
  precipProbMax?: number;     // %
  windMax?: number;           // km/h
  windGusts?: number;         // km/h
  humidity?: number;          // % average over daytime hours (7h-21h)
  confidence?: 'high' | 'medium' | 'low';  // multi-model agreement
  modelSpread?: number;       // °C between the most and least warm model
  sunrise?: string;           // "06:12" — that day's actual sunrise, not today's
  sunset?: string;            // "21:34" — that day's actual sunset, not today's
  hourly?: HourlyForecastItem[];
}

export interface RainInTheHour {
  minutes: number; // e.g., 0, 10, 20, 30, 40, 50
  intensity: 'none' | 'light' | 'moderate' | 'heavy';
  percentage: number; // For visualization height
}

export interface VigilanceCategory {
  name: string; // "Orages", "Vent violent", "Pluie-Inondation", "Grand Froid", etc.
  level: 'green' | 'yellow' | 'orange' | 'red';
  description: string;
  advice: string;
}

export interface VigilanceStatus {
  globalLevel: 'green' | 'yellow' | 'orange' | 'red';
  globalLabel: string;
  categories: VigilanceCategory[];
}

export interface WeatherData {
  city: string;
  postalCode?: string;
  departmentCode: string;
  latitude: number;
  longitude: number;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  rainInTheHour: RainInTheHour[];
  vigilance: VigilanceStatus;
  sunrise?: string;
  sunset?: string;
}
