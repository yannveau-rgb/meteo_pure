import React, { useState, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DailyForecastItem } from '../types';
import { getWeatherUI, isHourNight } from '../utils/weatherUtils';
import { CONFIDENCE_LABELS } from '../utils/forecastConfidence';
import { getDaylightInfo } from '../utils/ephemeris';
import { Calendar, Share2, Sun, Droplets, Wind, ChevronDown } from 'lucide-react';
import { generateElementDataUrl, copyDataUrlToClipboard, downloadDataUrl } from '../utils/shareUtils';

const SharePreviewModal = lazy(() => import('./SharePreviewModal'));

interface DailyForecastProps {
  dailyData: DailyForecastItem[];
  cityName?: string;
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
  latitude?: number;
  longitude?: number;
}

function DailyForecast({
  dailyData,
  cityName,
  selectedDayIndex,
  onSelectDay,
  latitude = 48.8566,
  longitude = 2.3522,
}: DailyForecastProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'copied' | 'downloaded' | 'error' | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // Per-day daylight duration and daily minutes gained/lost
  const dailyDaylight = useMemo(
    () =>
      dailyData.map((d, idx) =>
        getDaylightInfo(latitude, longitude, idx, d.sunrise, d.sunset)
      ),
    [dailyData, latitude, longitude]
  );

  const weeklyDelta = dailyDaylight[0]?.weeklyDeltaMinutes ?? 0;

  // Calibrate temperature spectrum bars to the week's actual min/max (with a
  // minimum 8°C span so a flat week doesn't exaggerate 1°C differences).
  const temperaturesMax = dailyData.map(d => d.tempMax);
  const temperaturesMin = dailyData.map(d => d.tempMin);
  const rawMax = temperaturesMax.length > 0 ? Math.max(...temperaturesMax) : 25;
  const rawMin = temperaturesMin.length > 0 ? Math.min(...temperaturesMin) : 5;
  const rawSpan = rawMax - rawMin;
  const pad = rawSpan < 8 ? (8 - rawSpan) / 2 : 1;
  const absoluteMax = rawMax + pad;
  const absoluteMin = rawMin - pad;
  const temperatureSpan = absoluteMax - absoluteMin || 1;

  const handleShareWeek = () => {
    setIsModalOpen(true);
    setIsGenerating(true);
    setImageSrc(null);
    setCopyStatus(null);

    // Let the reactive browser loop breathe, then generate the screenshot with html2canvas
    setTimeout(() => {
      generateElementDataUrl('daily-forecast-container')
        .then((dataUrl) => {
          setImageSrc(dataUrl);
          setIsGenerating(false);
          
          // Probe clipboard auto copy silently
          copyDataUrlToClipboard(dataUrl).then((success) => {
            if (success) {
              setCopyStatus('copied');
              setTimeout(() => setCopyStatus(null), 2500);
            }
          });
        })
        .catch((err) => {
          console.error('Erreur lors de la capture de l\'image :', err);
          setIsGenerating(false);
          setCopyStatus('error');
        });
    }, 150);
  };

  const handleCopy = () => {
    if (!imageSrc) return;
    copyDataUrlToClipboard(imageSrc).then((success) => {
      if (success) {
        setCopyStatus('copied');
        setTimeout(() => setCopyStatus(null), 2500);
      } else {
        setCopyStatus('error');
        setTimeout(() => setCopyStatus(null), 3000);
      }
    });
  };

  const handleDownload = () => {
    if (!imageSrc) return;
    const filename = `Meteo_Semaine_${(cityName || 'votre_ville').replace(/\s+/g, '_')}.png`;
    downloadDataUrl(imageSrc, filename);
    setCopyStatus('downloaded');
    setTimeout(() => setCopyStatus(null), 2500);
  };

  return (
    <>
      <div 
        id="daily-forecast-container"
        className="card select-none space-y-3.5"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-sky-200 shrink-0" />
            <h3 className="kicker text-sky-200 truncate">
              Prévisions sur 7 jours
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShareWeek}
              data-html2canvas-ignore="true"
              className="icon-btn icon-btn--sm"
              title="Partager les prévisions sur 7 jours sous forme d'image"
              aria-label="Partager les prévisions sur 7 jours"
            >
              <Share2 className="w-4 h-4 text-sky-200" />
            </button>
          </div>
        </div>

      <div className="space-y-2.5">
        {dailyData.map((day, index) => {
          const weatherUI = getWeatherUI(day.weatherCode, false);
          const WeatherIcon = weatherUI.icon;
          const dayLight = dailyDaylight[index];

          // Calculate left offset & width percentage for Apple-Weather style inline temperature spectrum bars
          const minLeftPercentage = ((day.tempMin - absoluteMin) / temperatureSpan) * 100;
          const maxRightPercentage = ((day.tempMax - absoluteMin) / temperatureSpan) * 100;
          const barWidth = Math.max(8, maxRightPercentage - minLeftPercentage);

          const isExpanded = expandedDay === index;

          return (
            <div key={index} className="space-y-1.5">
            <motion.button
              type="button"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                onSelectDay(index);
                setExpandedDay(isExpanded ? null : index);
              }}
              aria-expanded={isExpanded}
              aria-pressed={selectedDayIndex === index}
              data-selected={selectedDayIndex === index}
              className="day-row justify-between !gap-1.5"
              title="Cliquez pour déplier la météo heure par heure de ce jour"
            >
              {/* Day Name + Daylight Delta */}
              <div className="w-[5.25rem] shrink-0 text-left flex flex-col leading-tight">
                <span className="text-white font-bold whitespace-nowrap flex items-center gap-1">
                  {day.date}
                  <ChevronDown className={`w-3 h-3 text-white/50 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-sky-300' : ''}`} />
                </span>
                {dayLight && (
                  <span className="text-[11px] text-white/65 font-medium tabular-figures mt-0.5">
                    {dayLight.dayLengthFormatted}&nbsp;de jour
                  </span>
                )}
              </div>

              {/* Weather Status mini icon + desc */}
              <div className="flex items-center gap-1.5 w-8 justify-center shrink-0">
                <WeatherIcon className={`w-5 h-5 ${weatherUI.colorClass} drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`} />
              </div>

              {/* Min Temperature label */}
              <span className="w-8 text-right text-white/70 font-bold pr-1 tabular-figures">
                {Math.round(day.tempMin)}°
              </span>

              {/* Temperature custom spectrum bar */}
              <div className="flex-1 min-w-[28px] mx-1 h-[4px] rounded-full bg-white/15 relative overflow-hidden">
                <div 
                  className="absolute h-full rounded-full bg-gradient-to-r from-sky-400 via-yellow-300 to-orange-400"
                  style={{ 
                    left: `${minLeftPercentage}%`, 
                    width: `${barWidth}%` 
                  }}
                />
              </div>

              {/* Max Temperature label */}
              <span className="w-8 text-right text-white font-bold tabular-figures">
                {Math.round(day.tempMax)}°
              </span>

              {/* Model-agreement dot. Only drawn when the three models actually
                  disagree — a badge on every row would be noise, and silence
                  correctly reads as "nothing to worry about". */}
              <span className="w-3 shrink-0 flex justify-center">
                {(() => {
                  const tempFlag = day.confidence && day.confidence !== 'high';
                  const rainFlag = day.rainConfidence && day.rainConfidence !== 'high';
                  if (!tempFlag && !rainFlag) return null;
                  const reasons = [
                    tempFlag ? `${CONFIDENCE_LABELS[day.confidence!]} · écart ${day.modelSpread}°C entre modèles` : null,
                    rainFlag
                      ? (day.rainConfidence === 'low'
                          ? 'Modèles en désaccord sur la pluie (sec ou pluvieux)'
                          : 'Quantités de pluie très différentes selon les modèles')
                      : null,
                  ].filter(Boolean).join(' · ');
                  const strong = day.confidence === 'low' || day.rainConfidence === 'low';
                  return (
                    <span
                      title={reasons}
                      className={`w-1.5 h-1.5 rounded-full ${strong ? 'bg-orange-400/80' : 'bg-white/40'}`}
                    />
                  );
                })()}
              </span>
            </motion.button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="overflow-hidden"
                  data-html2canvas-ignore="true"
                >
                  <div className="tile space-y-2.5 mx-1 mb-1">
                    {/* Day summary metrics */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-white/80 font-medium">
                      <span className="font-semibold text-white">{weatherUI.label}</span>
                      <div className="flex items-center gap-3 tabular-figures">
                        {day.precipitationSum !== undefined && (
                          <span className="flex items-center gap-1 text-sky-200">
                            <Droplets className="w-3 h-3" />
                            {day.precipitationSum.toFixed(1)} mm
                            {day.precipProbMax !== undefined && ` (${Math.round(day.precipProbMax)}%)`}
                          </span>
                        )}
                        {(day.windGusts ?? day.windMax) !== undefined && (
                          <span className="flex items-center gap-1 text-white/75">
                            <Wind className="w-3 h-3" />
                            {Math.round((day.windGusts ?? day.windMax)!)} km/h
                          </span>
                        )}
                        {day.uvIndex !== undefined && (
                          <span className="text-amber-200">UV {day.uvIndex}</span>
                        )}
                      </div>
                    </div>

                    {/* Inline 24h horizontal scroll */}
                    {day.hourly && day.hourly.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                        {day.hourly.map((h, hIdx) => {
                          const hr = parseInt(h.time.split(':')[0], 10);
                          const hNight = isHourNight(hr, day.sunrise, day.sunset);
                          const hUI = getWeatherUI(h.weatherCode, hNight);
                          const HIcon = hUI.icon;
                          return (
                            <div
                              key={hIdx}
                              className="flex flex-col items-center justify-between min-w-[46px] py-1.5 px-1 rounded-xl bg-white/5 border border-white/10 gap-1 shrink-0"
                            >
                              <span className="text-[11px] text-white/65 font-semibold tabular-figures">{h.time}</span>
                              <HIcon className={`w-4 h-4 ${hUI.colorClass}`} />
                              <span className="text-[11px] text-white font-bold tabular-figures">{Math.round(h.temp)}°</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="text-[11px] text-white/50 border-t border-white/10 pt-2 text-center font-semibold space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <Sun className="w-3 h-3 text-amber-300/80" />
          Sur 7 jours, le jour{' '}
          {weeklyDelta >= 0 ? 'gagne' : 'perd'}{' '}
          <strong className={weeklyDelta >= 0 ? 'text-emerald-300/80' : 'text-amber-300/80'}>
            {Math.abs(weeklyDelta)} min
          </strong>
        </p>
        <p>Modèles Météo-France à maille fine (AROME / ARPEGE)</p>
        {dailyData.some(d => (d.confidence && d.confidence !== 'high') || (d.rainConfidence && d.rainConfidence !== 'high')) && (
          <p className="flex items-center justify-center gap-1.5 text-white/60 font-medium normal-case">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400/80" />
            Les modèles divergent sur ces jours
          </p>
        )}
      </div>
    </div>

    <Suspense fallback={null}>
    <SharePreviewModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      imageSrc={imageSrc}
      isGenerating={isGenerating}
      title="Partager les Prévisions"
      copyStatus={copyStatus}
      onCopy={handleCopy}
      onDownload={handleDownload}
    />
    </Suspense>
    </>
  );
}

export default React.memo(DailyForecast);
