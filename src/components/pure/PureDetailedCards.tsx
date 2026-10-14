import React, { Suspense, lazy } from 'react';
import {
  Clock,
  Loader2,
  AlertCircle,
  Share2,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WeatherData, Commune } from '../../types';
import { formatCacheTime } from '../../utils/weatherCache';
import { calculateCurrentUv, getMoonPhase } from '../../utils/weatherUtils';

// Child components
import RainForecast from '../RainForecast';
import VigilanceCard from '../VigilanceCard';
import HourlyForecast from '../HourlyForecast';
import DailyForecast from '../DailyForecast';
import ClimateComparison from '../ClimateComparison';
import AirQualityCard from '../AirQualityCard';
import TiltCard from '../TiltCard';
import InfoBadge from '../ui/InfoBadge';

const WeatherStats = lazy(() => import('../WeatherStats'));
const RainRadar = lazy(() => import('../RainRadar'));

interface PureDetailedCardsProps {
  weather: WeatherData;
  currentCommune: Commune;
  favorites: Commune[];
  toggleFavorite: (c: Commune) => void;
  todayShare: { openShare: (id: string) => void };
  frenchDate: string;
  saintDuJour: string | null;
  currentTime: string;
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
}

export default function PureDetailedCards({
  weather,
  currentCommune,
  favorites,
  toggleFavorite,
  todayShare,
  frenchDate,
  saintDuJour,
  currentTime,
  staleSince,
  refreshing,
  currentCode,
  isNightTimeNow,
  weatherStyle,
  ActiveWeatherIcon,
  selectedDayIndex,
  setSelectedDayIndex,
  setShowMoonModal,
  airQuality,
}: PureDetailedCardsProps) {
  const isFavorite = favorites.some((fav) => fav.code === currentCommune.code);
  const temp = Math.round(weather.current.temperature);
  const isBurning = temp >= 30;
  const isFreezing = temp < 10;

  return (
    <div className="relative z-10 w-full flex flex-col space-y-4 text-white">
      <div id="today-weather-widget" className="w-full flex flex-col space-y-4">
        {/* Header info (City & Date) */}
        <div className="pt-2 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="font-display text-[34px] font-normal tracking-tight leading-none" id="city-name">
                {currentCommune.nom}
              </h2>
              <button
                onClick={() => toggleFavorite(currentCommune)}
                aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                className="p-1 px-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 active:scale-95 transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-white/70 hover:text-white'}`} />
              </button>
              <button
                onClick={() => todayShare.openShare('today-weather-widget')}
                data-html2canvas-ignore="true"
                aria-label="Partager la météo du jour"
                className="p-1 px-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 active:scale-95 transition-all text-white cursor-pointer shadow-sm shrink-0 flex items-center justify-center mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                title="Partager la météo du jour"
              >
                <Share2 className="w-4 h-4 text-sky-200" />
              </button>
            </div>
            <p className="text-[14px] text-white/80 font-normal mt-0.5 flex flex-wrap items-center gap-2" id="current-date">
              <span>{frenchDate || "Aujourd'hui"}</span>
              {saintDuJour && (
                <>
                  <span className="text-white/60 text-xs font-light">•</span>
                  <span className="text-[12px] text-white/60 font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full" title="Saint(e) du jour">
                    ✨ Fête : {saintDuJour}
                  </span>
                </>
              )}
            </p>
            <p className="text-[12px] text-white/50 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5 flex-wrap">
              <Clock className="w-3.5 h-3.5 text-white/70" />
              <span>{currentTime || '00:00'} CEST</span>
              {staleSince && (
                <span className="normal-case tracking-normal text-[10px] font-semibold text-amber-300/90 bg-amber-500/15 border border-amber-400/30 rounded-full px-2 py-0.5">
                  Hors-ligne · relevé de {formatCacheTime(staleSince)}
                </span>
              )}
              {refreshing && !staleSince && (
                <span className="flex items-center gap-1 normal-case tracking-normal text-[10px] font-semibold text-white/50" role="status" aria-live="polite">
                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                  Actualisation…
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Temperature & Condition block */}
        <div className="flex items-center justify-between gap-2 py-2 px-1 select-none">
          <div className="flex flex-col items-start pl-2 min-w-0">
            <div className="relative flex items-start">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={temp}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`text-[80px] font-extralight tracking-tighter leading-none drop-shadow-sm inline-block ${
                    isBurning ? 'burning-temp' : isFreezing ? 'freezing-temp' : 'text-white'
                  }`}
                  id="main-temp"
                >
                  {temp}
                </motion.span>
              </AnimatePresence>
              <span className="text-3xl font-light mt-1 ml-1 text-white/80">°C</span>
            </div>

            {weather.current.observed ? (
              <InfoBadge
                className="-mt-1 ml-1 px-2 py-0.5 rounded-full bg-emerald-400/25 text-[11px] font-medium text-white/95 whitespace-nowrap"
                label={
                  `Relevé de la station ${weather.current.observed.station}, à ${weather.current.observed.distanceKm} km` +
                  (weather.current.observed.lapseCorrected ? `, ajusté de ${weather.current.observed.altitudeDeltaM} m de dénivelé` : '') +
                  `. Mesuré à ${new Date(weather.current.observed.observedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                }
              >
                Relevé · {weather.current.observed.distanceKm} km
              </InfoBadge>
            ) : weather.current.confidence === 'low' && weather.current.modelSpread !== undefined ? (
              <InfoBadge
                className="-mt-1 ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-medium text-white/90 whitespace-nowrap"
                label={`Prévision. Les trois modèles s'écartent de ${weather.current.modelSpread} °C sur cette heure ; la valeur affichée est leur médiane.`}
              >
                ± {Math.round(weather.current.modelSpread / 2)}°
              </InfoBadge>
            ) : null}
          </div>

          <div className="flex flex-col items-center shrink-0 pr-3 space-y-1">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <ActiveWeatherIcon className={`w-14 h-14 ${weatherStyle.colorClass} drop-shadow-md`} />
            </div>
            <span className="text-[13px] font-semibold text-white/95">{weather.current.weatherDesc}</span>
          </div>
        </div>

        {/* Rain Forecast & Vigilance */}
        <div className="grid grid-cols-2 gap-3">
          <TiltCard>
            <RainForecast
              rainData={weather.rainInTheHour}
              precipitationProbability={weather.hourly[0]?.precipitationProbability || 0}
            />
          </TiltCard>
          <TiltCard>
            <VigilanceCard
              vigilance={weather.vigilance}
              uvIndex={
                selectedDayIndex === 0
                  ? calculateCurrentUv(weather.daily[0]?.uvIndex, weather.sunrise, weather.sunset)
                  : weather.daily[selectedDayIndex]?.uvIndex
              }
            />
          </TiltCard>
        </div>

        {/* Hourly Forecast */}
        <TiltCard>
          <HourlyForecast
            hourlyData={selectedDayIndex === 0 ? weather.hourly : (weather.daily[selectedDayIndex]?.hourly || [])}
            humidity={weather.current.humidity}
            sunrise={weather.sunrise}
            sunset={weather.sunset}
          />
        </TiltCard>

        {/* Daily Forecast */}
        <TiltCard>
          <DailyForecast
            dailyData={weather.daily}
            selectedDayIndex={selectedDayIndex}
            onSelectDay={setSelectedDayIndex}
          />
        </TiltCard>

        {/* Moon Phase Preview */}
        <TiltCard>
          <div
            onClick={() => setShowMoonModal(true)}
            className="glass-card rounded-3xl p-4 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl filter drop-shadow-sm">{getMoonPhase().emoji}</span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/60">Éphéméride</p>
                <p className="text-sm font-semibold text-white">{getMoonPhase().name}</p>
              </div>
            </div>
            <span className="text-xs text-white/50 bg-white/10 px-2.5 py-1 rounded-full font-medium">
              Calendrier lunaire →
            </span>
          </div>
        </TiltCard>

        {/* Weather Stats */}
        <TiltCard>
          <Suspense fallback={<div className="glass-card rounded-3xl p-4 h-48 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>}>
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
        </TiltCard>

        {/* Air Quality */}
        {airQuality && (
          <TiltCard>
            <AirQualityCard data={airQuality} />
          </TiltCard>
        )}
      </div>

      {/* Climatology Comparison */}
      <TiltCard>
        <ClimateComparison
          latitude={weather.latitude}
          longitude={weather.longitude}
          currentMin={weather.daily[0]?.tempMin ?? Math.round(weather.current.temperature - 4)}
          currentMax={weather.daily[0]?.tempMax ?? Math.round(weather.current.temperature + 4)}
        />
      </TiltCard>

      {/* Rain Radar */}
      <Suspense fallback={<div className="glass-premium rounded-3xl h-[280px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-sky-400" /></div>}>
        <RainRadar
          latitude={weather.latitude}
          longitude={weather.longitude}
          cityName={weather.city}
        />
      </Suspense>
    </div>
  );
}
