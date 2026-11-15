import React, { Suspense, lazy, useMemo } from 'react';
import {
  Clock,
  Loader2,
  Share2,
  Star,
  Sunrise,
  Sunset,
  Sun,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { WeatherData, Commune } from '../../types';
import { formatCacheTime } from '../../utils/weatherCache';
import { calculateCurrentUv, getMoonPhase } from '../../utils/weatherUtils';
import { getDaylightInfo } from '../../utils/ephemeris';
import { useFrenchClock } from '../../hooks/useFrenchClock';

// Child components
import RainForecast from '../RainForecast';
import VigilanceCard from '../VigilanceCard';
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

  const selectedDay = weather.daily[selectedDayIndex] || weather.daily[0];
  const activeSunrise = (selectedDayIndex === 0 ? weather.sunrise : selectedDay?.sunrise) || weather.sunrise;
  const activeSunset = (selectedDayIndex === 0 ? weather.sunset : selectedDay?.sunset) || weather.sunset;

  const daylight = useMemo(
    () =>
      getDaylightInfo(
        weather.latitude,
        weather.longitude,
        selectedDayIndex,
        activeSunrise,
        activeSunset
      ),
    [weather.latitude, weather.longitude, selectedDayIndex, activeSunrise, activeSunset]
  );

  const formatSignedMin = (m: number) => (m > 0 ? `+${m} min` : m < 0 ? `${m} min` : '±0 min');
  const weeklySign = daylight.weeklyDeltaMinutes >= 0 ? '+' : '';

  return (
    <div id="today-weather-widget" className="relative z-10 w-full flex flex-col space-y-3.5 text-white">
      
      {/* 1. PRÉVISIONS SUR 7 JOURS (Accès direct sur la même page) */}
      <DailyForecast
        dailyData={weather.daily}
        cityName={currentCommune.nom}
        selectedDayIndex={selectedDayIndex}
        onSelectDay={setSelectedDayIndex}
        latitude={weather.latitude}
        longitude={weather.longitude}
      />

      {/* 2. CARTE LUMIÈRE DU JOUR, MINUTES GAGNÉES/PERDUES & ÉPHÉMÉRIDE */}
      <div
        id="daylight-ephemeris-card"
        className="card space-y-3.5 select-none"
      >
        {/* Top contextual row: Date, Saint du jour, Station & Quick Actions */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-white/90 flex flex-wrap items-center gap-1.5">
              <span className="capitalize font-semibold">
                {selectedDayIndex === 0 ? (frenchDate || "Aujourd'hui") : selectedDay?.date}
              </span>
              {saintDuJour && selectedDayIndex === 0 && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80 font-display italic text-sm">
                    {saintDuJour}
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
                  className="pill !py-0.5 !bg-emerald-400/20 !border-emerald-400/30 !text-emerald-200"
                  label={
                    `Relevé de la station ${weather.current.observed.station}, à ${weather.current.observed.distanceKm} km` +
                    (weather.current.observed.lapseCorrected ? `, ajusté de ${weather.current.observed.altitudeDeltaM} m de dénivelé` : '')
                  }
                >
                  Station à {weather.current.observed.distanceKm} km
                </InfoBadge>
              )}

              {staleSince && (
                <span className="pill !bg-amber-500/20 !border-amber-400/30 !text-amber-200">
                  Hors-ligne · {formatCacheTime(staleSince)}
                </span>
              )}

              {refreshing && !staleSince && (
                <span className="flex items-center gap-1 text-[11px] text-white/60">
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
              className="icon-btn"
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-300 fill-amber-300' : 'text-white/80'}`} />
            </button>
            <button
              onClick={() => todayShare.openShare('today-weather-widget')}
              aria-label="Partager la météo"
              className="icon-btn"
              title="Partager en image"
            >
              <Share2 className="w-4 h-4 text-white/85" />
            </button>
          </div>
        </div>

        {/* Day-length summary: one headline, one weekly total. The precise
            morning/evening split lives in the three tiles below, so nothing
            is said twice here. */}
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="flex items-start gap-2 min-w-0">
            <div
              className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                daylight.isGaining ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
              }`}
            >
              {daylight.isGaining ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <p
                className={`text-[12px] font-semibold tracking-tight ${
                  daylight.isGaining ? 'text-emerald-200/90' : 'text-amber-200/90'
                }`}
              >
                {daylight.headline}
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                {daylight.solsticeContext}
              </p>
            </div>
          </div>

          <span
            className="text-[11px] text-white/50 shrink-0 tabular-figures whitespace-nowrap"
            title={`Cumul sur 7 jours : ${weeklySign}${daylight.weeklyDeltaMinutes} min`}
          >
            7 j ·{' '}
            <strong className={daylight.weeklyDeltaMinutes >= 0 ? 'text-emerald-300/80' : 'text-amber-300/80'}>
              {weeklySign}{daylight.weeklyDeltaMinutes} min
            </strong>
          </span>
        </div>

        {/* 3-Column Solar Breakdown: Lever / Durée du jour / Coucher */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          {/* Lever */}
          <div className="tile flex flex-col items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/65">
              <Sunrise className="w-3.5 h-3.5 text-amber-300" />
              <span>Lever</span>
            </div>
            <span className="text-base font-extrabold text-white mt-1 tabular-figures">
              {daylight.sunrise}
            </span>
            <span
              className={`text-[11px] font-medium mt-1 tabular-figures ${
                daylight.morningDeltaMinutes >= 0 ? 'text-emerald-300/75' : 'text-amber-300/75'
              }`}
              title="Minutes de clarté gagnées ou perdues le matin"
            >
              Matin {formatSignedMin(daylight.morningDeltaMinutes)}
            </span>
          </div>

          {/* Durée du jour */}
          <div className="tile flex flex-col items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/65">
              <Sun className="w-3.5 h-3.5 text-yellow-300" />
              <span>Durée</span>
            </div>
            <span className="text-base font-extrabold text-white mt-1 tabular-figures">
              {daylight.dayLengthFormatted}
            </span>
            <span className="text-[11px] font-semibold text-white/60 mt-1">
              d'ensoleillement
            </span>
          </div>

          {/* Coucher */}
          <div className="tile flex flex-col items-center justify-between">
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white/65">
              <Sunset className="w-3.5 h-3.5 text-indigo-300" />
              <span>Coucher</span>
            </div>
            <span className="text-base font-extrabold text-white mt-1 tabular-figures">
              {daylight.sunset}
            </span>
            <span
              className={`text-[11px] font-medium mt-1 tabular-figures ${
                daylight.eveningDeltaMinutes >= 0 ? 'text-emerald-300/75' : 'text-amber-300/75'
              }`}
              title="Minutes de clarté gagnées ou perdues le soir"
            >
              Soir {formatSignedMin(daylight.eveningDeltaMinutes)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. PLUIE DANS L'HEURE & VIGILANCE */}
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
      <Suspense fallback={<div className="card h-44 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/40" /></div>}>
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
        className="card w-full flex items-center justify-between cursor-pointer hover:bg-white/10 active:scale-[0.99] transition-all text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl filter drop-shadow-sm">{moon.emoji}</span>
          <div>
            <p className="kicker text-white/60">Cycle lunaire</p>
            <p className="text-sm font-medium text-white">{moon.name}</p>
          </div>
        </div>
        <span className="pill hover:bg-white/20">
          Calendrier →
        </span>
      </button>

      {/* 8. RADAR DE PLUIE */}
      <Suspense fallback={<div className="card h-[260px] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-white/50" /></div>}>
        <RainRadar
          latitude={weather.latitude}
          longitude={weather.longitude}
          cityName={weather.city}
        />
      </Suspense>
    </div>
  );
}
