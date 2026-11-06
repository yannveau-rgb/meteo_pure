import React, { useState, lazy, Suspense, useMemo } from 'react';
import { motion } from 'motion/react';
import { DailyForecastItem } from '../types';
import { getWeatherUI } from '../utils/weatherUtils';
import { CONFIDENCE_LABELS } from '../utils/forecastConfidence';
import { getDaylightInfo } from '../utils/ephemeris';
import { Calendar, Share2, Sun } from 'lucide-react';
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

  // Per-day daylight duration and daily minutes gained/lost
  const dailyDaylight = useMemo(
    () =>
      dailyData.map((d, idx) =>
        getDaylightInfo(latitude, longitude, idx, d.sunrise, d.sunset)
      ),
    [dailyData, latitude, longitude]
  );

  const weeklyDelta = dailyDaylight[0]?.weeklyDeltaMinutes ?? 0;
  const weeklySign = weeklyDelta >= 0 ? '+' : '';

  // Find global min and max temperature across all 7 days to calibrate custom temperature line meters
  const temperaturesMax = dailyData.map(d => d.tempMax);
  const temperaturesMin = dailyData.map(d => d.tempMin);
  const absoluteMax = Math.max(...temperaturesMax, 35);
  const absoluteMin = Math.min(...temperaturesMin, -5);
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
        className="glass-premium rounded-3xl p-4 sm:p-5 shadow-lg select-none space-y-3.5 text-white"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-white/80 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky-200 truncate">
              Prévisions sur 7 Jours
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 tabular-figures ${
                weeklyDelta >= 0
                  ? 'bg-emerald-500/20 border-emerald-400/35 text-emerald-200'
                  : 'bg-amber-500/20 border-amber-400/35 text-amber-200'
              }`}
              title="Cumul des minutes d'ensoleillement gagnées ou perdues sur les 7 prochains jours"
            >
              <Sun className="w-3 h-3" />
              <span>{weeklySign}{weeklyDelta} min / 7j</span>
            </span>
            <button
              onClick={handleShareWeek}
              data-html2canvas-ignore="true"
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Partager les prévisions sur 7 jours sous forme d'image"
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

          return (
            <motion.button
              type="button"
              key={index}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4), ease: 'easeOut' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelectDay(index)}
              aria-pressed={selectedDayIndex === index}
              className={`w-full flex items-center justify-between text-xs font-semibold cursor-pointer py-2 px-2 rounded-2xl transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                selectedDayIndex === index
                  ? 'bg-white/15 border-l-4 border-sky-400 pl-3 pr-2 shadow-sm'
                  : 'border-l-4 border-transparent pl-3 pr-2 hover:border-l-white/20'
              }`}
              title="Cliquez pour afficher la météo heure par heure et l'éphéméride de ce jour"
            >
              {/* Day Name + Daylight Delta */}
              <div className="w-24 min-w-[92px] text-left flex flex-col leading-tight">
                <span className="text-white font-bold whitespace-nowrap">
                  {day.date}
                </span>
                {dayLight && (
                  <span
                    className={`text-[10px] font-bold tabular-figures mt-0.5 flex items-center gap-1 ${
                      dayLight.isGaining ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    <span>☀ {dayLight.shortDeltaLabel}/j</span>
                    <span className="text-white/45 font-normal">({dayLight.dayLengthFormatted})</span>
                  </span>
                )}
              </div>

              {/* Weather Status mini icon + desc */}
              <div className="flex items-center gap-1.5 w-9 justify-center shrink-0">
                <WeatherIcon className={`w-5 h-5 ${weatherUI.colorClass} drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`} />
              </div>

              {/* Min Temperature label */}
              <span className="w-8 text-right text-white/60 font-bold pr-1 tabular-figures">
                {Math.round(day.tempMin)}°
              </span>

              {/* Temperature custom spectrum bar */}
              <div className="flex-1 mx-2 h-[4px] rounded-full bg-white/15 relative overflow-hidden">
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
              <span className="w-3 flex justify-center">
                {day.confidence && day.confidence !== 'high' && (
                  <span
                    title={`${CONFIDENCE_LABELS[day.confidence]} · écart ${day.modelSpread}°C entre modèles`}
                    className={`w-1.5 h-1.5 rounded-full ${
                      day.confidence === 'low' ? 'bg-orange-400/80' : 'bg-white/30'
                    }`}
                  />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="text-[10px] text-white/50 border-t border-white/10 pt-2 text-center font-semibold space-y-1">
        <p>Modèles Météo-France à maille fine (AROME / ARPEGE)</p>
        {dailyData.some(d => d.confidence && d.confidence !== 'high') && (
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
