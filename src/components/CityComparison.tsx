import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ArrowRightLeft,
  Thermometer,
  Wind,
  Droplets,
  Sparkles,
  ThumbsUp,
  MapPin,
  Loader2,
  Building2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Commune, WeatherData } from '../types';
import { fetchWeatherData, searchFrenchCommunes } from '../utils/weatherApi';
import { getWeatherUI, isNightTime } from '../utils/weatherUtils';

interface CityComparisonProps {
  currentCommune: Commune;
  currentWeather: WeatherData;
}

// Preset communes for quick single-click comparisons
const PRESET_COMMUNES: Commune[] = [
  { nom: 'Paris', code: '75056', codesPostaux: ['75001'], centre: { type: 'Point', coordinates: [2.3522, 48.8566] }, codeDepartement: '75' },
  { nom: 'Marseille', code: '13055', codesPostaux: ['13001'], centre: { type: 'Point', coordinates: [5.3698, 43.2965] }, codeDepartement: '13' },
  { nom: 'Lyon', code: '69123', codesPostaux: ['69001'], centre: { type: 'Point', coordinates: [4.8357, 45.7640] }, codeDepartement: '69' },
  { nom: 'Lille', code: '59350', codesPostaux: ['59000'], centre: { type: 'Point', coordinates: [3.0573, 50.6292] }, codeDepartement: '59' },
  { nom: 'Nice', code: '06088', codesPostaux: ['06000'], centre: { type: 'Point', coordinates: [7.2620, 43.7102] }, codeDepartement: '06' },
  { nom: 'Bordeaux', code: '33063', codesPostaux: ['33000'], centre: { type: 'Point', coordinates: [-0.5792, 44.8378] }, codeDepartement: '33' },
];

export default function CityComparison({ currentCommune, currentWeather }: CityComparisonProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Commune[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Comparison State
  const [comparedCommune, setComparedCommune] = useState<Commune | null>(null);
  const [comparedWeather, setComparedWeather] = useState<WeatherData | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Async search search bar logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchFrenchCommunes(searchQuery);
        setSearchResults(results);
        setShowDropdown(results.length > 0);
      } catch (err) {
        console.error('Failed to search communes in comparison', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle selection of a commune 
  const handleSelectCommune = async (commune: Commune) => {
    setSearchQuery('');
    setShowDropdown(false);
    setComparedCommune(commune);
    setIsLoadingWeather(true);
    setErrorMsg(null);

    try {
      const data = await fetchWeatherData(commune);
      setComparedWeather(data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Impossible de récupérer la météo de cette ville.");
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Preset comparison triggers
  const handlePresetClick = (commune: Commune) => {
    if (commune.nom.toLowerCase() === currentCommune.nom.toLowerCase()) return;
    handleSelectCommune(commune);
  };

  // Helper function to render Weather Icon
  const renderWeatherIcon = (code: number, isNight = false, className = "w-10 h-10") => {
    const ui = getWeatherUI(code, isNight);
    const IconComponent = ui.icon;
    return <IconComponent className={`${className} ${ui.colorClass} drop-shadow-md`} />;
  };

  const getVerdict = () => {
    if (!comparedWeather || !comparedCommune) return null;

    const t1 = Math.round(currentWeather.current.temperature);
    const t2 = Math.round(comparedWeather.current.temperature);
    const diff = Math.abs(t1 - t2);

    const code1 = currentWeather.current.weatherCode;
    const code2 = comparedWeather.current.weatherCode;
    const isRaining1 = code1 >= 51 && code1 <= 82;
    const isRaining2 = code2 >= 51 && code2 <= 82;

    if (t1 > 30 && t2 > 30) {
      return {
        title: "🔥 Double canicule critique !",
        text: `C'est une fournaise générale à ${currentCommune.nom} (${t1}°C) comme à ${comparedCommune.nom} (${t2}°C) ! Notre station conseille instamment de s'hydrater de manière... récréative ou glacée à l'ombre.`
      };
    }

    if (t1 < 10 && t2 < 10) {
      return {
        title: "❄️ Ambiance pingouins polaire !",
        text: `Alerte grand froid : ${currentCommune.nom} se gèle à ${t1}°C et ${comparedCommune.nom} greffe des glaçons à ${t2}°C. Notre algorithme recommande de fusionner les stocks de plaids.`
      };
    }

    if (isRaining1 && !isRaining2) {
      return {
        title: `🌧️ Douche écossaise pour ${currentCommune.nom}`,
        text: `Aïe, vous prenez la flotte à ${currentCommune.nom} alors qu'à ${comparedCommune.nom}, ils friment bien au sec ! Vengez-vous en leur envoyant des mèmes de grenouilles.`
      };
    }

    if (!isRaining1 && isRaining2) {
      return {
        title: `🌞 Privilège météo pour ${currentCommune.nom} !`,
        text: `Victoire suprême ! Il pleut à torrents sur ${comparedCommune.nom} pendant que vous profitez de la douceur de ${currentCommune.nom}. Sortez les insolentes lunettes de soleil !`
      };
    }

    if (diff < 1.5) {
      return {
        title: "🤝 Match nul climatique !",
        text: `À peine ${diff}°C de différence entre ${currentCommune.nom} et ${comparedCommune.nom}. Vous respirez exactement le même air à l'instant t. C'est presque fusionnel.`
      };
    }

    if (t1 > t2) {
      return {
        title: `🏆 ${currentCommune.nom} l'emporte haut la main !`,
        text: `${currentCommune.nom} humilie fièrement ${comparedCommune.nom} avec ${diff}°C de plus ! Il fait ${t1}°C chez vous contre seulement ${t2}°C là-bas. L'application décerne la médaille d'or du thermomètre.`
      };
    } else {
      return {
        title: `🥶 ${comparedCommune.nom} affiche une supériorité thermique !`,
        text: `Défaite tragique de ${currentCommune.nom}... Il fait ${t2}°C à ${comparedCommune.nom}, soit ${diff}°C de plus que chez vous (${t1}°C). Jalousez-les en silence ou réservez un billet de train !`
      };
    }
  };

  const verdict = getVerdict();

  return (
    <div 
      id="city-comparison-tab" 
      className="glass-premium rounded-3xl p-5 shadow-lg flex flex-col flex-1 space-y-4 text-white select-none"
    >
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-white/15">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-sky-400 rotate-45" />
            Double Station AROME
          </h2>
          <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1">
            Comparatif instantané multi-villes
          </p>
        </div>
        <span className="text-[10px] bg-sky-500/20 text-sky-300 font-bold px-2.5 py-1 rounded-full border border-sky-500/30 flex items-center gap-1">
          <Zap className="w-3 h-3 text-sky-300 animate-pulse" />
          Temps Réel
        </span>
      </div>

      {/* Search Input Container */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            type="text"
            className="w-full bg-white/5 border border-white/15 rounded-2xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/50 transition-all"
            placeholder="Rechercher une seconde ville à comparer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowDropdown(searchResults.length > 0)}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>
        </div>

        {/* Dropdown list */}
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl max-h-60 overflow-y-auto shadow-2xl divide-y divide-white/5 no-scrollbar"
            >
              {searchResults.map((commune) => (
                <button
                  key={commune.code}
                  className="w-full text-left px-4 py-3 hover:bg-white/10 flex items-center justify-between text-sm transition-all"
                  onClick={() => handleSelectCommune(commune)}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-sky-400" />
                    <div>
                      <span className="font-semibold text-white">{commune.nom}</span>
                      <span className="text-[10px] text-white/50 ml-2 font-mono">({commune.codesPostaux[0]})</span>
                    </div>
                  </div>
                  <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full uppercase font-mono font-bold">
                    {commune.codeDepartement}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preset Suggestions */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-white/50 uppercase tracking-wider font-mono">Comparaisons rapides :</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_COMMUNES.map((preset) => {
            const isSelf = preset.nom.toLowerCase() === currentCommune.nom.toLowerCase();
            const isCompared = comparedCommune?.nom.toLowerCase() === preset.nom.toLowerCase();

            return (
              <button
                key={preset.code}
                disabled={isSelf}
                onClick={() => handlePresetClick(preset)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all duration-200 flex items-center gap-1.5 ${
                  isSelf
                    ? 'hidden'
                    : isCompared
                    ? 'bg-sky-500 text-white border-sky-400 font-semibold shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-white/80 border-white/10 hover:border-white/25'
                }`}
              >
                <MapPin className="w-3 h-3 text-sky-400" />
                {preset.nom}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed side-by-side view */}
      <div className="flex-1 flex flex-col justify-between">
        <AnimatePresence mode="wait">
          {isLoadingWeather ? (
            <motion.div
              key="loading-comp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-12 space-y-3"
            >
              <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
              <p className="text-xs text-white/60 font-mono">Consultation des ballons sondes...</p>
            </motion.div>
          ) : errorMsg ? (
            <motion.div
              key="error-comp"
              className="flex-1 flex flex-col items-center justify-center p-6 text-center text-rose-300"
            >
              <span className="text-sm">{errorMsg}</span>
            </motion.div>
          ) : comparedWeather && comparedCommune ? (
            <motion.div
              key="results-comp"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 pt-1"
            >
              {/* Dual Cards side-by-side */}
              <div className="grid grid-cols-2 gap-3.5">
                {/* Left Card: Main Commune */}
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900/50 border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center space-y-2.5 relative overflow-hidden">
                  <div className="absolute top-2.5 left-2.5 bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                    Ici
                  </div>
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-300 mt-1 truncate max-w-full">
                    {currentCommune.nom}
                  </span>
                  {renderWeatherIcon(currentWeather.current.weatherCode, isNightTime(currentWeather.sunrise, currentWeather.sunset), "w-11 h-11")}
                  <div>
                    <span className="text-3xl font-extralight tracking-tighter text-white">
                      {Math.round(currentWeather.current.temperature)}
                    </span>
                    <span className="text-xs text-white/70 ml-0.5">°C</span>
                  </div>
                  <span className="text-[10px] text-white/60 font-semibold truncate max-w-full">
                    {currentWeather.current.weatherDesc}
                  </span>
                </div>

                {/* Right Card: Compared Commune */}
                <div className="bg-gradient-to-br from-sky-950/40 to-slate-900/50 border border-sky-500/20 p-4 rounded-2xl flex flex-col items-center text-center space-y-2.5 relative overflow-hidden">
                  <div className="absolute top-2.5 right-2.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                    Cible
                  </div>
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-300 mt-1 truncate max-w-full">
                    {comparedCommune.nom}
                  </span>
                  {renderWeatherIcon(comparedWeather.current.weatherCode, isNightTime(comparedWeather.sunrise, comparedWeather.sunset), "w-11 h-11")}
                  <div>
                    <span className="text-3xl font-extralight tracking-tighter text-white">
                      {Math.round(comparedWeather.current.temperature)}
                    </span>
                    <span className="text-xs text-white/70 ml-0.5">°C</span>
                  </div>
                  <span className="text-[10px] text-white/60 font-semibold truncate max-w-full">
                    {comparedWeather.current.weatherDesc}
                  </span>
                </div>
              </div>

              {/* Dynamic scales comparisons */}
              <div className="glass-premium rounded-2xl p-4 space-y-3.5 border border-white/10">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-white/5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                  Indicateurs Comparatifs
                </h3>

                {/* Temperature bars comparison */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="font-mono">{Math.round(currentWeather.current.temperature)}°C</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/60 font-medium uppercase font-mono">
                      <Thermometer className="w-3 h-3 text-red-400" /> Température
                    </span>
                    <span className="font-mono">{Math.round(comparedWeather.current.temperature)}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 relative h-2">
                    {/* Left side progress */}
                    <div className="bg-white/10 rounded-l-full overflow-hidden flex justify-end">
                      <div 
                        className="h-full bg-gradient-to-l from-sky-400 to-indigo-500 rounded-l-full min-w-[2%]" 
                        style={{ width: `${Math.min(100, Math.max(0, ((currentWeather.current.temperature + 10) / 55) * 100))}%` }}
                      />
                    </div>
                    {/* Right side progress */}
                    <div className="bg-white/10 rounded-r-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-sky-400 to-orange-400 rounded-r-full min-w-[2%]" 
                        style={{ width: `${Math.min(100, Math.max(0, ((comparedWeather.current.temperature + 10) / 55) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Humidity Comparison */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="font-mono">{currentWeather.current.humidity}%</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/60 font-medium uppercase font-mono">
                      <Droplets className="w-3 h-3 text-sky-400" /> Humidité
                    </span>
                    <span className="font-mono">{comparedWeather.current.humidity}%</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 relative h-2">
                    {/* Left side progress */}
                    <div className="bg-white/10 rounded-l-full overflow-hidden flex justify-end">
                      <div 
                        className="h-full bg-sky-400 rounded-l-full min-w-[2%]" 
                        style={{ width: `${currentWeather.current.humidity}%` }}
                      />
                    </div>
                    {/* Right side progress */}
                    <div className="bg-white/10 rounded-r-full overflow-hidden">
                      <div 
                        className="h-full bg-sky-400 rounded-r-full min-w-[2%]" 
                        style={{ width: `${comparedWeather.current.humidity}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Wind speed */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="font-mono">{Math.round(currentWeather.current.windSpeed)} km/h</span>
                    <span className="flex items-center gap-1 text-[10px] text-white/60 font-medium uppercase font-mono">
                      <Wind className="w-3 h-3 text-emerald-400" /> Vent
                    </span>
                    <span className="font-mono">{Math.round(comparedWeather.current.windSpeed)} km/h</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 relative h-2">
                    {/* Left side progress */}
                    <div className="bg-white/10 rounded-l-full overflow-hidden flex justify-end">
                      <div 
                        className="h-full bg-emerald-400 rounded-l-full min-w-[2%]" 
                        style={{ width: `${Math.min(100, (currentWeather.current.windSpeed / 100) * 100)}%` }}
                      />
                    </div>
                    {/* Right side progress */}
                    <div className="bg-white/10 rounded-r-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-400 rounded-r-full min-w-[2%]" 
                        style={{ width: `${Math.min(100, (comparedWeather.current.windSpeed / 100) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Humorous Verdict box */}
              {verdict && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-indigo-950/50 border border-indigo-500/25 rounded-2xl p-4 space-y-2 relative overflow-hidden"
                >
                  <div className="absolute -right-3 -top-3 opacity-25">
                    <Sparkles className="w-12 h-12 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
                  </div>
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1">
                    <ThumbsUp className="w-3.5 h-3.5 text-indigo-400" />
                    Le verdict de l'expert
                  </span>
                  <p className="text-sm font-semibold text-white leading-snug">
                    {verdict.title}
                  </p>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">
                    {verdict.text}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="placeholder-comp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-14 text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60">
                <ArrowRightLeft className="w-8 h-8 animate-pulse text-sky-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Aucune ville cible sélectionnée</h3>
                <p className="text-xs text-white/50 px-8 mt-1.5 leading-relaxed">
                  Utilisez la recherche ci-dessus ou choisissez l'une des suggestions rapides pour comparer immédiatement {currentCommune.nom} à une autre ville.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
