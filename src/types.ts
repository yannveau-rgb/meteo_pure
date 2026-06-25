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

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  weatherDesc: string;
  iconName: string;
  precipitation: number;
  time: string;
}

export interface HourlyForecastItem {
  time: string; // "14:00"
  temp: number;
  weatherCode: number;
  iconName: string;
  precipitationProbability: number;
  precipitation: number;
}

export interface DailyForecastItem {
  date: string; // "Lundi 22"
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  iconName: string;
  uvIndex: number;
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
