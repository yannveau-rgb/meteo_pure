import React, { Suspense, lazy } from 'react';
import {
  Clock,
  Loader2,
  Share2,
  Star
} from 'lucide-react';
import { WeatherData, Commune, HourlyForecastItem } from '../../types';
import { formatCacheTime } from '../../utils/weatherCache';
import { calculateCurrentUv, getMoonPhase } from '../../utils/weatherUtils';
import { useFrenchClock } from '../../hooks/useFrenchClock';

// Child components
import RainForecast from '../RainForecast';
import VigilanceCard from '../VigilanceCard';
import HourlyForecast from '../HourlyForecast';
import DailyForecast from '../DailyForecast';
import ClimateComparison from '../ClimateComparison';
import AirQualityCard from '../AirQualityCard';
import InfoBadge from '../ui/InfoBadge';

const WeatherStats = lazy(() => import('../WeatherStats'));
const RainRadar = lazy(() => import('../RainRadar'));

interface PureDetailedCardsProps {
  weather: WeatherData;
  currentCommune: Commune;
  favorites: Commune[];
  toggleFavorite: (c: Commune) => void;
  todayShare: { openShare: (id: string) => void };
  frenchDate?: string;
  saintDuJour: string | null;
  currentTime?: string;
  staleSince: number | null;
  refreshing: boolean;
  currentCode: number;
  isNightTimeNow: boolean;
  weatherStyle: { colorClass: string };
  ActiveWeatherIcon: React.ComponentType<{ className?: string }>;
  selectedDayIndex: number;
  setSelectedDayIndex: (idx: number) => void;
  setShowMoonModal: (show: boolean) => void;
  airQuality: any;
  selectedHour?: HourlyForecastItem;
}

export default function PureDetailedCards({
  weather,
  currentCommune,
  favorites,
  toggleFavorite,
  todayShare,
  frenchDate: propFrenchDate,
  saintDuJour,
  currentTime: propCurrentTime,
  staleSince,
  refreshing,
  selectedDayIndex,
  setSelectedDayIndex,
  setShowMoonModal,
  airQuality,
}: PureDetailedCardsProps) {
  const internalClock = useFrenchClock();
  const frenchDate = propFrenchDate || internalClock.frenchDate;
  const currentTime = propCurrentTime || internalClock.currentTime;

  const isFavorite = favorites.some((fav) => fav.code === currentCommune.code);
  const moon = getMoonPhase();

  return (
    <div id="today-weather-widget" className="relative z-10 w-full flex flex-col space-y-3.5 text-white">
      
      {/* 1. BARRE CONTEXTUELLE MINIMALISTE (Éphéméride, Relevé station, Favori & Partage) */}
      <div className="glass-premium rounded-3xl px-4 py-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-medium text-white/90 flex flex-wrap items-center gap-1.5">
            <span className="capitalize">{frenchDate || "Aujourd'hui"}</span>
            {saintDuJour && (
              <>
                <span className="text-white/40">•</span>
                <span className="text-white/75 font-display italic text-sm">
                  Sainte / Saint {saintDuJour}
                </span>
              </>
            )}
          </div>

          <div className="text-[11px] text-white/60 mt-1 flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 tabular-figures">
              <Clock className="w-3 h-3 text-white/60" />
              {currentTime || '00:00'}
            </span>

            {weather.current.observed && (
              <InfoBadge
                className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-400/30 text-[10px] font-medium text-emerald-200 whitespace-nowrap"
                label={
                  `Relevé de la station ${weather.current.observed.station}, à ${weather.current.observed.distanceKm} km` +
                  (weather.current.observed.lapseCorrected ? `, ajusté de ${weather.current.observed.altitudeDeltaM} m de dénivelé` : '')
                }
              >
                Station à {weather.current.observed.distanceKm} km
              </InfoBadge>
            )}

            {staleSince && (
              <span className="text-[10px] font-medium text-amber-200 bg-amber-500/20 border border-amber-400/30 rounded-full px-2 py-0.5">
                Hors-ligne · {formatCacheTime(staleSince)}
              </span>
            )}

            {refreshing && !staleSince && (
              <span className="flex items-center gap-1 text-[10px] text-white/60">
                <Loader2 className="w-3 h-3 animate-spin" />
                Actualisation…
              </span>
            )}
          </div>
        </div>

        {/* Actions rapides : Favori & Partage */}
        <div className="flex items-center gap-1.5 shrink-0" data-html2canvas-ignore="true">
          <button
            onClick={() => toggleFavorite(currentCommune)}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-300 fill-amber-300' : 'text-white/80'}`} />
          </button>
          <button
            onClick={() => todayShare.openShare('today-weather-widget')}
            aria-label="Partager la météo"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all text-white cursor-pointer flex items-center justify-center"
            title="Partager en image"
          >
            <Share2 className="w-4 h-4 text-white/85" />
          </button>
        </div>
      </div>

      {/* 2. PRÉVISIONS SUR 7 JOURS (En accès immédiat !) */}
      <DailyForecast
        dailyData={weather.daily}
        cityName={currentCommune.nom}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
      />

      {/* 3. ÉVOLUTION HORAIRE DU JOUR SÉLECTIONNÉ */}
      <HourlyForecast
        hourlyData={selectedDayIndex === 0 ? weather.hourly : (weather.daily[selectedDayIndex]?.hourly || [])}
        humidity={weather.current.humidity}
        sunrise={weather.sunrise}
        sunset={weather.sunset}
      />

      {/* 4. PLUIE DANS L'HEURE & VIGILANCE */}
      <div className="grid grid-cols-2 gap-3">
        <RainForecast
          rainData={weather.rainInTheHour}
          precipitationProbability={weather.hourly[0]?.precipitationProbability || 0}
        />
        <VigilanceCard
          vigilance={weather.vigilance}
          uvIndex={
            selectedDayIndex === 0
              ? calculateCurrentUv(weather.daily[0]?.uvIndex, weather.sunrise, weather.sunset)
              : weather.daily[selectedDayIndex]?.uvIndex
          }
        />
      </div>

      {/* 5. QUALITÉ DE L'AIR & POLLENS */}
      {airQuality && <AirQualityCard data={airQuality} />}

      {/* 6. MÉTRIQUES DÉTAILLÉES (Vent, Pression, UV, Visibilité...) */}
      <Suspense fallback={<div className="glass-premium rounded-3xl p-4 h-44 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>}>
        <WeatherStats
          current={weather.current}
          uvIndex={
            selectedDayIndex === 0
              ? calculateCurrentUv(weather.daily[0]?.uvIndex, weather.sunrise, weather.sunset)
              : weather.daily[selectedDayIndex]?.uvIndex
          }
          hourlyData={selectedDayIndex === 0 ? weather.hourly : (weather.daily[selectedDayIndex]?.hourly || [])}
          dailyData={weather.daily}
        />
      </Suspense>

      {/* 7. NORMALES DE SAISON & LUNE */}
      <ClimateComparison
        latitude={weather.latitude}
        longitude={weather.longitude}
        currentMin={weather.daily[0]?.tempMin ?? Math.round(weather.current.temperature - 4)}
        currentMax={weather.daily[0]?.tempMax ?? Math.round(weather.current.temperature + 4)}
      />

      <button
        type="button"
        onClick={() => setShowMoonModal(true)}
        className="glass-premium rounded-3xl p-4 w-full flex items-center justify-between cursor-pointer hover:bg-white/15 active:scale-[0.99] transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl filter drop-shadow-sm">{moon.emoji}</span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Cycle Lunaire</p>
            <p className="text-sm font-medium text-white">{moon.name}</p>
          </div>
        </div>
        <span className="text-xs text-white/80 bg-white/10 border border-white/15 px-3 py-1 rounded-full font-medium">
          Calendrier →
        </span>
      </button>

      {/* 8. RADAR DE PLUIE */}
      <Suspense fallback={<div className="glass-premium rounded-3xl h-[260px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>}>
        <RainRadar
          latitude={weather.latitude}
          longitude={weather.longitude}
          cityName={weather.city}
        />
      </Suspense>
    </div>
  );
}
