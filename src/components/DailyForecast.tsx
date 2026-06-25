import React, { useState } from 'react';
import { DailyForecastItem } from '../types';
import { getWeatherUI } from '../utils/weatherUtils';
import { Calendar, Share2, Check } from 'lucide-react';
import { generateElementDataUrl, copyDataUrlToClipboard, downloadDataUrl } from '../utils/shareUtils';
import SharePreviewModal from './SharePreviewModal';

interface DailyForecastProps {
  dailyData: DailyForecastItem[];
  cityName?: string;
  selectedDayIndex: number;
  onSelectDay: (index: number) => void;
}

export default function DailyForecast({ dailyData, cityName, selectedDayIndex, onSelectDay }: DailyForecastProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'copied' | 'downloaded' | 'error' | null>(null);

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
        className="glass-premium rounded-3xl p-5 shadow-lg select-none space-y-4 text-white"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-white/80" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-sky-200">
              Prévisions sur 7 Jours
            </h3>
          </div>
          <button
            onClick={handleShareWeek}
            data-html2canvas-ignore="true"
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center justify-center transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Partager les prévisions sur 7 jours sous forme d'image"
          >
            <Share2 className="w-4 h-4 text-sky-200" />
          </button>
        </div>

      <div className="space-y-3.5">
        {dailyData.map((day, index) => {
          const weatherUI = getWeatherUI(day.weatherCode, false);
          const WeatherIcon = weatherUI.icon;

          // Calculate left offset & width percentage for Apple-Weather style inline temperature spectrum bars
          const minLeftPercentage = ((day.tempMin - absoluteMin) / temperatureSpan) * 100;
          const maxRightPercentage = ((day.tempMax - absoluteMin) / temperatureSpan) * 100;
          const barWidth = Math.max(8, maxRightPercentage - minLeftPercentage);

          return (
            <div 
              key={index} 
              onClick={() => onSelectDay(index)}
              className={`flex items-center justify-between text-xs font-semibold cursor-pointer p-2 rounded-2xl transition-all duration-200 hover:bg-white/10 active:scale-[0.98] ${
                selectedDayIndex === index 
                  ? 'bg-white/15 border-l-4 border-sky-400 pl-3 pr-2 shadow-sm scale-[1.01]' 
                  : 'border-l-4 border-transparent pl-3 pr-2 hover:border-l-white/20'
              }`}
              title="Cliquez pour afficher la météo heure par heure de ce jour"
            >
              {/* Day Name */}
              <span className="w-20 min-w-[80px] text-white font-bold text-left whitespace-nowrap">
                {day.date}
              </span>

              {/* Weather Status mini icon + desc */}
              <div className="flex items-center gap-1.5 w-10 justify-center">
                <WeatherIcon className={`w-5 h-5 ${weatherUI.colorClass} drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]`} />
              </div>

              {/* Min Temperature label */}
              <span className="w-8 text-right text-white/60 font-bold pr-1">
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
              <span className="w-8 text-right text-white font-bold">
                {Math.round(day.tempMax)}°
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-white/50 border-t border-white/10 pt-2 text-center font-semibold">
        Modèles Météo-France à maille fine (AROME / ARPEGE)
      </div>
    </div>

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
    </>
  );
}
