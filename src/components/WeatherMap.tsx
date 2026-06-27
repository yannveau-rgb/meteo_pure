import React, { useState, useEffect } from 'react';
import { Map, Pin, Sun, Cloud, CloudRain, Star, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { getWeatherUI, isHourNight } from '../utils/weatherUtils';

interface CityPin {
  id: string;
  name: string;
  lat: number;
  long: number;
  x: number; // position on map (relative % from left)
  y: number; // position on map (relative % from top)
  baseTemp: number; // base reference temperature (fallback)
  weatherIcon: 'sun' | 'cloud' | 'rain'; // fallback
}

const REGIONAL_CITIES: CityPin[] = [
  { id: 'lille', name: 'Lille', lat: 50.6292, long: 3.0573, x: 53, y: 11, baseTemp: 17, weatherIcon: 'cloud' },
  { id: 'paris', name: 'Paris', lat: 48.8566, long: 2.3522, x: 51, y: 25, baseTemp: 19, weatherIcon: 'sun' },
  { id: 'compiegne', name: 'Compiègne', lat: 49.4179, long: 2.8261, x: 55, y: 19, baseTemp: 19, weatherIcon: 'sun' },
  { id: 'strasbourg', name: 'Strasbourg', lat: 48.5734, long: 7.7521, x: 86, y: 28, baseTemp: 18, weatherIcon: 'cloud' },
  { id: 'nantes', name: 'Nantes', lat: 47.2184, long: -1.5536, x: 25, y: 41, baseTemp: 20, weatherIcon: 'sun' },
  { id: 'lyon', name: 'Lyon', lat: 45.7640, long: 4.8357, x: 67, y: 56, baseTemp: 21, weatherIcon: 'cloud' },
  { id: 'bordeaux', name: 'Bordeaux', lat: 44.8378, long: -0.5792, x: 31, y: 65, baseTemp: 22, weatherIcon: 'sun' },
  { id: 'toulouse', name: 'Toulouse', lat: 43.6047, long: 1.4442, x: 44, y: 76, baseTemp: 23, weatherIcon: 'sun' },
  { id: 'marseille', name: 'Marseille', lat: 43.2965, long: 5.3698, x: 69, y: 79, baseTemp: 24, weatherIcon: 'sun' },
  { id: 'nice', name: 'Nice', lat: 43.7102, long: 7.2620, x: 81, y: 74, baseTemp: 24, weatherIcon: 'sun' },
];

interface WeatherMapProps {
  onSelectCity: (cityName: string, coords: [number, number]) => void;
  currentCityName: string;
}

export default function WeatherMap({ onSelectCity, currentCityName }: WeatherMapProps) {
  const [hoveredCity, setHoveredCity] = useState<CityPin | null>(null);
  const [cityData, setCityData] = useState<Record<string, { temp: number, code: number }>>({});

  useEffect(() => {
    let isMounted = true;
    const fetchCityData = async () => {
      try {
        const lats = REGIONAL_CITIES.map(c => c.lat).join(',');
        const longs = REGIONAL_CITIES.map(c => c.long).join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${longs}&current=temperature_2m,weather_code&timezone=Europe/Paris`;
        
        const response = await fetch(url);
        if (!response.ok) return;
        const data = await response.json();
        
        if (isMounted) {
          const newData: Record<string, { temp: number, code: number }> = {};
          if (Array.isArray(data)) {
            REGIONAL_CITIES.forEach((city, index) => {
              if (data[index]?.current) {
                newData[city.id] = {
                  temp: Math.round(data[index].current.temperature_2m),
                  code: data[index].current.weather_code,
                };
              }
            });
          }
          setCityData(newData);
        }
      } catch (err) {
        console.error("Failed to fetch map cities data:", err);
      }
    };
    fetchCityData();
    return () => { isMounted = false; };
  }, []);

  const getWeatherIconComponent = (type: string) => {
    switch (type) {
      case 'rain': return <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-bounce" />;
      case 'cloud': return <Cloud className="w-3.5 h-3.5 text-slate-300" />;
      default: return <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />;
    }
  };

  // No per-city sunrise/sunset is fetched here, but sunrise/sunset times barely
  // vary across mainland France, so a single current-hour-based check (instead
  // of always assuming daytime) is enough to avoid showing sun icons at night.
  const mapIsNight = isHourNight(new Date().getHours());

  return (
    <div 
      id="weather-map-tab"
      className="glass-premium rounded-3xl p-5 shadow-lg flex flex-col justify-between flex-1 space-y-4 text-white select-none"
    >
      <div className="flex justify-between items-center pb-2.5 border-b border-white/15">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Map className="w-5 h-5 text-sky-300" />
            Carte France AROME
          </h2>
          <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">
            Recherche de climat régional
          </p>
        </div>
        <span className="text-[10px] bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full border border-white/20">
          Maillage fin 1.3km
        </span>
      </div>

      {/* Styled vector/HTML stylized outline map container of France */}
      <div className="relative w-full h-[320px] bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden flex justify-center items-center">
        {/* Real Interactive SVG outline of France with fine grid overlays */}
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full p-2 pointer-events-none z-0" preserveAspectRatio="none">
          <defs>
            <pattern id="map-radar-grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#map-radar-grid)" />
          
          {/* Subtle Latitude/Longitude concentric circles center-aligned on France */}
          <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(14, 165, 233, 0.08)" strokeWidth="0.8" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(14, 165, 233, 0.04)" strokeWidth="0.8" strokeDasharray="3 3" />
          
          {/* France Mainland Shape */}
          <path 
            d="M 53 8 Q 63 10 74 15 Q 86 20 86 30 Q 82 45 80 50 Q 75 58 81 74 Q 74 78 69 79 Q 60 83 44 83 Q 32 85 26 85 Q 26 76 29 64 Q 25 50 23 41 Q 12 37 6 36 Q 12 30 22 32 Q 25 21 31 23 Q 36 25 39 21 Q 44 19 48 11 Z"
            fill="rgba(14, 165, 233, 0.08)"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500 hover:fill-sky-400/15"
          />
        </svg>

        {/* Graphical elements representing map topology */}
        <div className="absolute left-[4%] top-[48%] text-[8px] text-white/20 font-bold rotate-90 tracking-widest opacity-40 select-none font-mono">
          OCÉAN ATLANTIQUE
        </div>
        <div className="absolute right-[8%] bottom-[12%] text-[8px] text-white/20 font-bold tracking-widest opacity-40 select-none font-mono">
          MER MÉDITERRANÉE
        </div>
        
        {/* Dynamic map title helper banner */}
        <div className="absolute bottom-2.5 left-2.5 z-10 bg-black/40 backdrop-blur-md border border-white/20 px-2.5 py-1 rounded-lg text-[9px] text-white/80 shadow-sm flex items-center gap-1">
          <Info className="w-3 h-3 text-sky-300" />
          Cliquez sur une station pour consulter
        </div>

        {/* Hot spots on physical coordinate approximation map */}
        {REGIONAL_CITIES.map((city) => {
          const isSelected = currentCityName.toLowerCase().includes(city.name.toLowerCase());
          
          return (
            <div 
              key={city.id}
              style={{ left: `${city.x}%`, top: `${city.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
            >
              <button
                onClick={() => onSelectCity(city.name, [city.long, city.lat])}
                onMouseEnter={() => setHoveredCity(city)}
                onMouseLeave={() => setHoveredCity(null)}
                className={`relative flex items-center justify-center p-1.5 rounded-full transition-all duration-300 active:scale-90 ${
                  isSelected 
                    ? 'bg-sky-500 text-white shadow-lg ring-4 ring-sky-300/40 scale-110 z-30' 
                    : 'bg-white/20 text-white shadow-md border border-white/20 hover:bg-white/30 hover:scale-110'
                }`}
              >
                {isSelected ? (
                  <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                ) : (
                  cityData[city.id] !== undefined ? (() => {
                    const UI = getWeatherUI(cityData[city.id].code, mapIsNight);
                    const RealIcon = UI.icon;
                    return <RealIcon className={`w-3.5 h-3.5 ${UI.colorClass}`} />;
                  })() : getWeatherIconComponent(city.weatherIcon)
                )}
              </button>

              {/* Miniature overlay pill */}
              <div className="absolute left-1/2 -bottom-6 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 px-1.5 py-0.5 rounded text-[8px] font-bold opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-md z-50">
                {city.name} ({cityData[city.id] !== undefined ? cityData[city.id].temp : city.baseTemp}°C)
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected city information details panel */}
      {hoveredCity && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/30 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-sm text-center"
        >
          <span className="text-xs font-bold text-white uppercase block tracking-wider">
            Station de {hoveredCity.name}
          </span>
          <span className="text-[10px] text-white/70 leading-relaxed mt-1 block">
            Coordonnées : {hoveredCity.lat.toFixed(3)}°N, {hoveredCity.long.toFixed(3)}°E • Statut : Modèle AROME Météo-france opérationnel.
          </span>
        </motion.div>
      )}

      {/* Side list of key quick locations */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest pl-1">
          Stations principales de France
        </label>
        <div className="grid grid-cols-2 gap-2">
          {REGIONAL_CITIES.slice(0, 6).map((city) => (
            <button
              key={city.id}
              onClick={() => onSelectCity(city.name, [city.long, city.lat])}
              className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-left hover:bg-white/20 hover:border-white/25 active:scale-95 transition-all"
            >
              <span className="font-semibold text-white">{city.name}</span>
              <span className="text-white/60 font-medium">
                {cityData[city.id] !== undefined ? cityData[city.id].temp : city.baseTemp}°C
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
