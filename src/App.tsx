import React, { lazy, Suspense, useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  X, 
  CloudSun, 
  Map, 
  ArrowRightLeft,
  Bell, 
  Loader2, 
  Navigation,
  CloudLightning,
  AlertCircle,
  HelpCircle,
  Clock,
  Volume2,
  VolumeX,
  User,
  Settings,
  Trash2,
  Flame,
  ShieldAlert,
  Sparkles,
  Smile,
  AlertTriangle,
  Sunrise,
  Sunset,
  Share2,
  Check,
  CheckCircle2,
  CloudRain,
  Star,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Commune, WeatherData } from './types';
import { getCommuneByCoords } from './utils/weatherApi';
import { getWeatherUI, getMoonPhase, getNext7DaysMoonPhases, calculateCurrentUv, isNightTime, isHourNight } from './utils/weatherUtils';
import { getSaintDuJour } from './utils/ephemeris';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  loadNotificationLogs,
  saveNotificationLogs,
  getFunnyRainMessage,
  detectImminentRain,
  fireSystemNotification,
  checkAndFireFullMoonNotification,
  checkAndFireMorningBrief,
  isSpamProtected,
  updateLastAlertTime,
  syncPushSubscription,
  refreshPushSubscription,
  HumorLevel,
  NotificationLog,
  NotificationSettings,
  NotificationIntensity
} from './utils/notificationService';

// Custom hooks
import { useFavorites } from './hooks/useFavorites';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useFrenchClock } from './hooks/useFrenchClock';
import { useCurrentCommune } from './hooks/useCurrentCommune';
import { useCitySearch } from './hooks/useCitySearch';
import { useWeatherFetch } from './hooks/useWeatherFetch';
import { useMorningBrief } from './hooks/useMorningBrief';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useShareImage } from './hooks/useShareImage';

// Modular child components
import RainForecast from './components/RainForecast';
import VigilanceCard from './components/VigilanceCard';
const WeatherStats = lazy(() => import('./components/WeatherStats'));
import HourlyForecast from './components/HourlyForecast';
import DailyForecast from './components/DailyForecast';
import AmbientWeatherBackground from './components/AmbientWeatherBackground';
import ClimateComparison from './components/ClimateComparison';
const RainRadar = lazy(() => import('./components/RainRadar'));
import TiltCard from './components/TiltCard';

// Lazy-loaded: only fetched when their tab/modal is opened
const CityComparison = lazy(() => import('./components/CityComparison'));
const AlertsView = lazy(() => import('./components/AlertsView'));
const PwaInstallWizard = lazy(() => import('./components/PwaInstallWizard'));
const SharePreviewModal = lazy(() => import('./components/SharePreviewModal'));

const LazyFallback = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
  </div>
);

export default function App() {
  // Navigation & Screen tab state
  const [activeTab, setActiveTab] = useState<'meteo' | 'cartes' | 'alertes' | 'reglages'>('meteo');

  const isAdmin = typeof window !== 'undefined' && !!localStorage.getItem('adminToken');

  // Current commune + welcome prompt (localStorage-synced)
  const { currentCommune, setCurrentCommune, showWelcomePrompt, setShowWelcomePrompt } = useCurrentCommune();

  // City search with debounce
  const {
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    isSearching,
    showSearchList, setShowSearchList,
  } = useCitySearch();

  // Geolocation active indicators
  const [geoLocating, setGeoLocating] = useState(false);

  // Date + clock in French (updated every 10s)
  const { frenchDate, currentTime } = useFrenchClock();

  // Traditional Feast Day lookup (saint du jour)
  const saintDuJour = getSaintDuJour();

  // PWA install prompt
  const { deferredPrompt, isAppInstalled, triggerPwaInstall } = usePwaInstall();

  // Notification States
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => loadNotificationSettings());
  const [notifLogs, setNotifLogs] = useState<NotificationLog[]>(() => loadNotificationLogs());
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    message: string;
    intensity: NotificationIntensity;
  } | null>(null);
  const [testingPush, setTestingPush] = useState<boolean>(false);
  const [testingCron, setTestingCron] = useState<boolean>(false);

  // Weather data (fetch + 10-min refresh)
  const { weather, setWeather, loading, errorMsg, setErrorMsg, prevWeatherRef } = useWeatherFetch(currentCommune, () => {
    if (notifSettings.systemEnabled) {
      checkAndFireFullMoonNotification(notifSettings.humorLevel);
    }
  });

  // Reset selected forecast day whenever commune changes
  useEffect(() => { setSelectedDayIndex(0); }, [currentCommune]);

  // Moon / Morning Brief modals + AI call
  const {
    showMoonModal, setShowMoonModal,
    showMorningBriefModal, setShowMorningBriefModal,
    aiBrief,
    loadingBrief,
    openMorningBrief,
  } = useMorningBrief();

  // Audio playback of the morning brief (text-to-speech)
  const briefSpeech = useSpeechSynthesis();

  // Stop any ongoing speech when the brief modal closes
  useEffect(() => {
    if (!showMorningBriefModal) briefSpeech.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showMorningBriefModal]);

  // Favorites bookmarked cities (synced with localStorage)
  const { favorites, setFavorites, toggleFavorite } = useFavorites();

  // Hero card sharing (today-weather-widget -> PNG)
  const todayShare = useShareImage();

  useEffect(() => {
    if (notifSettings.systemEnabled) {
      checkAndFireFullMoonNotification(notifSettings.humorLevel);
      if (notifSettings.birthDate && weather) {
        checkAndFireMorningBrief(notifSettings.humorLevel, notifSettings.birthDate, weather.current.weatherCode);
      }
    }
  }, [notifSettings.systemEnabled, notifSettings.humorLevel, notifSettings.birthDate, weather]);

  // Synchronize Background push subscription with server for unattended background notifications
  useEffect(() => {
    syncPushSubscription(
      notifSettings.systemEnabled,
      currentCommune,
      notifSettings.humorLevel,
      weather,
      notifSettings.birthDate
    );
  }, [notifSettings.systemEnabled, currentCommune, notifSettings.humorLevel, weather, notifSettings.birthDate]);

  const handleOpenMorningBrief = () =>
    openMorningBrief(
      notifSettings.birthDate || '',
      weather?.current.weatherCode || 0,
      notifSettings.humorLevel,
      currentCommune?.nom || 'Inconnu'
    );

  // Master controller for sending hilarious customized rain/storm notifications
  const triggerFunnyNotification = (intensity: NotificationIntensity, bypassSpam = false) => {
    // Check filters based on user selection preferences
    if (notifSettings.rainNotificationsEnabled === false) {
      if (['light', 'moderate', 'heavy', 'end_rain'].includes(intensity)) {
        console.log("Notification de pluie désactivée par l'utilisateur.");
        return;
      }
    }
    if (notifSettings.stormNotificationsEnabled === false) {
      if (['thunderstorm', 'end_storm'].includes(intensity)) {
        console.log("Notification d'orage désactivée par l'utilisateur.");
        return;
      }
    }
    if (notifSettings.alertNotificationsEnabled === false) {
      if (['alert_yellow', 'alert_orange', 'alert_red'].includes(intensity)) {
        console.log("Notification d'alerte de vigilance désactivée par l'utilisateur.");
        return;
      }
    }

    if (!bypassSpam && isSpamProtected(notifSettings.minMinutesBetweenAlerts)) {
      console.log("Notification filtrée par protection anti-spam.");
      return;
    }

    const { title, message } = getFunnyRainMessage(intensity, notifSettings.humorLevel);

    const newLog: NotificationLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      city: currentCommune.nom,
      title,
      message,
      intensity
    };

    const updatedLogs = [newLog, ...notifLogs];
    setNotifLogs(updatedLogs);
    saveNotificationLogs(updatedLogs);

    if (!bypassSpam) {
      updateLastAlertTime();
    }

    setActiveToast({
      id: newLog.id,
      title,
      message,
      intensity
    });

    if (notifSettings.systemEnabled) {
      fireSystemNotification(title, message);
    }
  };

  // Automatically watch for imminent wet or stormy weather and meteorological transitions
  useEffect(() => {
    if (!weather) return;
    
    // Check present states
    const isRainingNow = weather.current.precipitation > 0;
    const isStormingNow = [95, 96, 99].includes(weather.current.weatherCode);
    const currentVigilance = weather.vigilance.globalLevel;
    const isHotNow = weather.current.temperature >= 30;

    // Run transition checks
    if (prevWeatherRef.current) {
      const prev = prevWeatherRef.current;
      
      // 1. End of rain transition (was raining, now stopped)
      if (prev.wasRaining && !isRainingNow) {
        triggerFunnyNotification('end_rain', false);
      }
      
      // 2. End of storm transition (was storming, now stopped)
      if (prev.wasStorming && !isStormingNow) {
        triggerFunnyNotification('end_storm', false);
      }
      
      // Standard incoming weather warning check (Only if no transitions occurred to avoid spam)
      const imminentThunderstorm = weather.hourly.slice(0, 2).some(item => [95, 96, 99].includes(item.weatherCode));
      
      if (imminentThunderstorm && !prev.wasStorming) {
        triggerFunnyNotification('thunderstorm', false);
      } else if (!imminentThunderstorm) {
        const rainResult = detectImminentRain(weather.rainInTheHour);
        if (rainResult && rainResult.shouldAlert && !prev.wasRaining) {
          triggerFunnyNotification(rainResult.intensity, false);
        }
      }
    }

    // 3. Weather vigilance alert (independent of prev state because guarded by localStorage persistent key to capture alert when loaded)
    if (currentVigilance !== 'green') {
      const lastNotifiedStr = localStorage.getItem('meteo_pure_last_notified_vigilance');
      let alreadyNotified = false;
      if (lastNotifiedStr) {
        try {
          const parsed = JSON.parse(lastNotifiedStr);
          if (parsed.city === currentCommune.nom && parsed.level === currentVigilance) {
            alreadyNotified = true;
          }
        } catch (e) {}
      }

      if (!alreadyNotified) {
        if (currentVigilance === 'yellow') triggerFunnyNotification('alert_yellow', false);
        else if (currentVigilance === 'orange') triggerFunnyNotification('alert_orange', false);
        else if (currentVigilance === 'red') triggerFunnyNotification('alert_red', false);

        try {
          localStorage.setItem('meteo_pure_last_notified_vigilance', JSON.stringify({
            city: currentCommune.nom,
            level: currentVigilance
          }));
        } catch (e) {}
      }
    } else {
      // If vigilance level is back to green, reset the storage value to green for this city so a future warning gets captured
      try {
        const lastNotifiedStr = localStorage.getItem('meteo_pure_last_notified_vigilance');
        if (lastNotifiedStr) {
          const parsed = JSON.parse(lastNotifiedStr);
          if (parsed.city === currentCommune.nom && parsed.level !== 'green') {
            localStorage.setItem('meteo_pure_last_notified_vigilance', JSON.stringify({
              city: currentCommune.nom,
              level: 'green'
            }));
          }
        }
      } catch (e) {}
    }

    // Save current state for next transition check
    prevWeatherRef.current = {
      wasRaining: isRainingNow,
      wasStorming: isStormingNow,
      vigilanceLevel: currentVigilance,
      wasHot: isHotNow
    };
  }, [weather]);

  // Silently refresh push subscription on every app load to keep endpoint fresh
  useEffect(() => {
    if (!weather || !currentCommune || !notifSettings.systemEnabled) return;
    refreshPushSubscription(
      currentCommune,
      notifSettings.humorLevel,
      notifSettings.birthDate
    );
  }, [weather?.city]);

  // Handle Dynamic Geolocation Pin search
  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const nearestCommune = await getCommuneByCoords(latitude, longitude);
          if (nearestCommune) {
            setCurrentCommune(nearestCommune);
            setActiveTab('meteo');
          } else {
            setErrorMsg("Aucune commune française correspondante trouvée.");
          }
        } catch (err) {
          console.error(err);
          setErrorMsg("Échec de la recherche de commune locale.");
        } finally {
          setGeoLocating(false);
        }
      },
      (geoError) => {
        console.warn(geoError);
        setGeoLocating(false);
        setErrorMsg("La géolocalisation a échoué (accès refusé ou bloqué). Si vous êtes sur Safari/iPhone, essayez d'ouvrir l'application en plein écran, ou recherchez votre ville manuellement.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Direct City pin click on the weather map
  const selectCityFromMap = (cityName: string, coords: [number, number]) => {
    // Generate dummy commune object format for trigger
    const matchedCommune: Commune = {
      nom: cityName,
      code: 'custom',
      codesPostaux: [],
      centre: {
        type: 'Point',
        coordinates: coords
      },
      codeDepartement: '00'
    };
    setCurrentCommune(matchedCommune);
    setActiveTab('meteo');
  };

  // Resolve background style from WMO code of active weather
  const currentCode = weather?.current.weatherCode ?? 0;
  // Let's check weather hour is night or not, using real sunrise/sunset when available
  const isNightTimeNow = isNightTime(weather?.sunrise, weather?.sunset);

  const weatherStyle = getWeatherUI(currentCode, isNightTimeNow);
  const ActiveWeatherIcon = weatherStyle.icon;

  return (
    <div className={`min-h-screen w-full flex justify-center items-center p-0 sm:p-6 text-white antialiased overflow-x-hidden bg-gradient-to-br ${isNightTimeNow ? 'from-[#0a1f38] via-[#123a5e] to-[#081b2e]' : 'from-[#123a5e] via-[#2a72a8] to-[#0d2e4a]'}`}>
      
      {/* Container Principal (Mobile-First responsive frame) */}
      <div 
        id="applet-main-frame"
        className="relative w-full max-w-md min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[40px] shadow-2xl overflow-hidden bg-white/5 backdrop-blur-[45px] border border-white/20 flex flex-col justify-between pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] px-6 sm:p-6"
      >
        
        {/* MOON PHASES MODAL */}
        <AnimatePresence>
          {showMoonModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/90 backdrop-blur-md px-6 cursor-pointer"
              onClick={() => setShowMoonModal(false)}
            >
              <div 
                className="glass-premium p-6 rounded-[32px] border border-white/20 shadow-2xl flex flex-col items-center w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center w-full mb-6 relative">
                  <h2 className="text-xl font-bold text-white tracking-wide">Cycles Lunaires</h2>
                  <button onClick={() => setShowMoonModal(false)} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/60">
                    &times;
                  </button>
                </div>

                <div className="flex flex-col gap-3 w-full">
                  {getNext7DaysMoonPhases().map((moon, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{moon.emoji}</span>
                        <div className="flex flex-col">
                          <span className="text-xs text-white/50 font-bold uppercase tracking-wider">
                            {index === 0 ? "Aujourd'hui" : index === 1 ? "Demain" : moon.date.toLocaleDateString('fr-FR', { weekday: 'long' })}
                          </span>
                          <span className="text-sm text-white font-medium capitalize">{moon.name}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">
                        {Math.round(moon.phase * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MORNING BRIEF MODAL */}
        <AnimatePresence>
          {showMorningBriefModal && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/95 backdrop-blur-md px-6 cursor-pointer"
              onClick={() => setShowMorningBriefModal(false)}
            >
              <div 
                className="glass-premium p-6 rounded-[32px] border border-white/20 shadow-2xl flex flex-col items-center w-full max-w-sm relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transform rotate-12 scale-150">
                  <span className="text-6xl">🔮</span>
                </div>
                <div className="flex justify-between items-center w-full mb-6 z-10 relative">
                  <h2 className="text-lg font-bold text-white tracking-wide">Brief Matinal</h2>
                  <button onClick={() => setShowMorningBriefModal(false)} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400/60">
                    &times;
                  </button>
                </div>
                
                <div className="flex flex-col gap-3 w-full text-white/90 z-10 relative">
                  {loadingBrief ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
                      <p className="text-xs text-white/70 animate-pulse text-center">
                        L'IA interroge les constellations et la météo de {currentCommune?.nom || "ta ville"}...
                      </p>
                    </div>
                  ) : aiBrief ? (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="font-bold text-sky-400 text-sm uppercase tracking-widest flex items-center gap-2">
                          {aiBrief.title}
                          {aiBrief.ai !== false && (
                            <span className="text-[9px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded font-mono font-bold tracking-normal uppercase">
                              IA active
                            </span>
                          )}
                        </h3>
                        {briefSpeech.isSupported && (
                          <button
                            onClick={() => {
                              if (briefSpeech.isSpeaking) {
                                briefSpeech.stop();
                              } else {
                                briefSpeech.speak(`${aiBrief.title}. ${aiBrief.body}`);
                              }
                            }}
                            aria-label={briefSpeech.isSpeaking ? "Arrêter la lecture" : "Écouter le brief"}
                            title={briefSpeech.isSpeaking ? "Arrêter la lecture" : "Écouter le brief"}
                            className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full border transition-all active:scale-95 ${
                              briefSpeech.isSpeaking
                                ? 'bg-sky-500/25 border-sky-400/50 text-sky-300 animate-pulse'
                                : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                            }`}
                          >
                            {briefSpeech.isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </button>
                        )}
                      </div>
                      <p className="leading-relaxed text-sm italic">{aiBrief.body}</p>
                    </>
                  ) : !notifSettings.birthDate ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                      <span className="text-4xl animate-pulse">🤫</span>
                      <p className="italic opacity-80 text-sm">
                        Pour lire ton astro-brief quotidien personnalisé par l'IA, renseigne d'abord ta date de naissance.
                      </p>
                      <button
                        onClick={() => {
                          setShowMorningBriefModal(false);
                          setActiveTab('reglages');
                        }}
                        className="mt-2 bg-white/10 hover:bg-white/20 border border-white/20 px-5 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-lg active:scale-95"
                      >
                        Ouvrir les Réglages
                      </button>
                    </div>
                  ) : (
                    <p className="text-center italic opacity-70">Données météo manquantes pour le brief.</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* WELCOME GEOLOCATION PROMPT */}
        <AnimatePresence>
          {showWelcomePrompt && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-[#06102b]/90 backdrop-blur-md px-6 text-center"
            >
              <div className="glass-premium p-8 rounded-[36px] border border-white/20 shadow-2xl flex flex-col items-center max-w-sm w-full mx-auto relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/20 blur-3xl rounded-full translate-x-12 -translate-y-12"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -translate-x-12 translate-y-12"></div>
                
                <div className="bg-white/10 p-5 rounded-full mb-6 z-10 border border-white/10">
                  <MapPin className="w-10 h-10 text-sky-300" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-3 z-10">Météo Locale</h2>
                <p className="text-white/70 text-sm font-medium mb-8 z-10 leading-relaxed">
                  Souhaitez-vous utiliser votre position actuelle pour afficher immédiatement la météo de votre ville ?
                </p>
                
                <div className="flex flex-col gap-3 w-full z-10">
                  <button 
                    onClick={() => {
                      setShowWelcomePrompt(false);
                      handleGeolocation();
                    }}
                    className="w-full bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <MapPin className="w-5 h-5" />
                    Utiliser ma position
                  </button>
                  <button 
                    onClick={() => {
                      setShowWelcomePrompt(false);
                    }}
                    className="w-full bg-white/10 hover:bg-white/15 text-white/90 font-semibold py-3.5 px-6 rounded-2xl transition-all border border-white/10 active:scale-95"
                  >
                    Chercher manuellement
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FLOATING FUNNY TOAST NOTIFICATION */}
        <AnimatePresence>
          {activeToast && (
            <motion.div
              initial={{ opacity: 0, y: -45, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 150, damping: 18 }}
              className="absolute top-[calc(env(safe-area-inset-top,0px)+1rem)] sm:top-4 left-4 right-4 z-50 pointer-events-auto"
            >
              <div className={`glass-premium p-4 rounded-2xl shadow-2xl border flex flex-col gap-1.5 relative overflow-hidden backdrop-blur-2xl ${
                activeToast.intensity === 'heavy' ? 'border-red-500/40 bg-red-950/75 text-red-100' : 
                activeToast.intensity === 'moderate' ? 'border-amber-500/40 bg-amber-950/75 text-amber-100' : 
                activeToast.intensity === 'thunderstorm' ? 'border-purple-500/50 bg-indigo-950/75 text-indigo-100 shadow-[0_0_15px_rgba(168,85,247,0.35)]' :
                activeToast.intensity === 'heatwave' ? 'border-orange-500/50 bg-orange-950/75 text-orange-100 shadow-[0_0_15px_rgba(249,115,22,0.35)]' :
                'border-sky-500/40 bg-sky-950/75 text-sky-100'
              }`}>
                {/* Visual Timer Progress Bar */}
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 6, ease: 'linear' }}
                  onAnimationComplete={() => setActiveToast(null)}
                  className={`absolute bottom-0 left-0 h-1 ${
                    activeToast.intensity === 'heavy' ? 'bg-red-500' :
                    activeToast.intensity === 'moderate' ? 'bg-amber-400' :
                    activeToast.intensity === 'thunderstorm' ? 'bg-purple-500' :
                    activeToast.intensity === 'heatwave' ? 'bg-orange-500' :
                    'bg-sky-400'
                  }`}
                />
                
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm select-none">
                      {activeToast.intensity === 'heavy' ? '🤬' :
                       activeToast.intensity === 'moderate' ? '☔' : 
                       activeToast.intensity === 'thunderstorm' ? '⚡' : 
                       activeToast.intensity === 'heatwave' ? '🌡️' : '💧'}
                    </span>
                    <h4 className="font-extrabold text-[11px] tracking-wider uppercase">
                      {activeToast.title}
                    </h4>
                  </div>
                  
                  <button 
                    onClick={() => setActiveToast(null)}
                    className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/50 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <p className="text-[11px] font-bold leading-relaxed pl-0.5 text-white/95 mt-0.5">
                  "{activeToast.message}"
                </p>
                
                <div className="flex justify-between items-center text-[9px] text-white/50 font-extrabold pl-0.5 mt-1 uppercase select-none tracking-widest">
                  <span>Météo à {currentCommune.nom}</span>
                  <span className="bg-white/15 px-1.5 py-0.5 rounded-full text-[8px] text-white/90">
                    {activeToast.intensity === 'heavy' ? 'Averse forte' :
                     activeToast.intensity === 'moderate' ? 'Pluie soutenue' : 
                     activeToast.intensity === 'thunderstorm' ? 'Orage électrique !' : 
                     activeToast.intensity === 'heatwave' ? 'Chaleur Intense !' : 'Petite bruine'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Animated decorative 3D liquid waves and drop overlays matching mockup design perfectly */}
        <div className="liquid-wave-top" />
        <div className="liquid-drip-lone" />
        <div className="absolute top-1/3 -left-12 pointer-events-none w-56 h-56 rounded-full bg-sky-200/10 filter blur-3xl animate-pulse" />

        {/* TOP PANEL: Auto-suggest Search and Geolocation pin */}
        <div className="relative z-30">
          <div className="flex gap-2 items-center">
            {/* Real Search Bar Container */}
            <div className="relative flex-1">
              <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full border border-white/40 shadow-sm px-3.5 py-2">
                <Search className="w-4 h-4 text-white/85 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Rechercher une ville..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchList(true);
                    setErrorMsg(null);
                  }}
                  onFocus={() => setShowSearchList(true)}
                  className="w-full bg-transparent border-none outline-none text-sm text-white placeholder-white/60 font-medium"
                />
                {(searchQuery || isSearching) && (
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-0.5 rounded-full hover:bg-white/10 text-white/70"
                  >
                    {isSearching ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white/80" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Autocomplete list dropdown popup */}
              <AnimatePresence>
                {showSearchList && searchResults.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-12 left-0 right-0 max-h-56 overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-205 shadow-2xl rounded-2xl z-40 no-scrollbar text-slate-800"
                  >
                    {searchResults.map((commune, index) => (
                      <button
                        key={`${commune.code}-${index}`}
                        onClick={() => {
                          setCurrentCommune(commune);
                          setSearchQuery('');
                          setSearchResults([]);
                          setShowSearchList(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-xs hover:bg-sky-50 active:bg-sky-100 border-b border-slate-100 last:border-none font-semibold text-slate-800 flex justify-between items-center"
                      >
                        <div>
                          <span className="text-slate-900 text-sm font-bold block">{commune.nom}</span>
                          <span className="text-slate-500 font-normal">Dép. {commune.codeDepartement} • CP {commune.codesPostaux?.[0] || 'N/A'}</span>
                        </div>
                        <Navigation className="w-3.5 h-3.5 text-sky-600 rotate-45" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Geolocation Pin button */}
            <button
              id="geolocation-trigger-btn"
              onClick={handleGeolocation}
              disabled={geoLocating}
              aria-label="Me géolocaliser"
              className={`p-2.5 rounded-full bg-white/25 backdrop-blur-md border border-white/45 shadow-sm active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${geoLocating ? 'animate-bounce text-sky-200' : 'text-white hover:bg-white/35'}`}
              title="Me géolocaliser en France"
            >
              {geoLocating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick Favorite Cities Chips */}
          {favorites.length > 0 && (
            <div className="flex gap-1.5 items-center mt-2.5 overflow-x-auto no-scrollbar py-1 select-none shrink-0" style={{ WebkitOverflowScrolling: 'touch' }}>
              <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <div className="flex gap-1.5 items-center">
                {favorites.map((fav) => (
                  <div
                    key={fav.code}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border outline-none flex items-center gap-1.5 shrink-0 ${
                      currentCommune.code === fav.code
                        ? 'bg-sky-500/25 text-sky-200 border-sky-400/40 shadow-sm'
                        : 'bg-white/10 hover:bg-white/15 text-white/80 border-white/10'
                    }`}
                  >
                    <button
                      onClick={() => setCurrentCommune(fav)}
                      className="cursor-pointer text-left focus:outline-none"
                    >
                      {fav.nom}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFavorites(favorites.filter(f => f.code !== fav.code));
                      }}
                      aria-label={`Retirer ${fav.nom} des favoris`}
                      className="text-white/40 hover:text-rose-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none p-1 -m-0.5"
                      title="Retirer des favoris"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ERROR DISPLAY SYSTEM */}
        {errorMsg && (
          <div className="z-10 mt-4 p-3 rounded-2xl bg-rose-500/25 backdrop-blur-md border border-rose-500/40 text-white text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-200" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* VIEW ROUTER (MAIN BODY AREA) */}
        <div className="flex-1 flex flex-col mt-4 overflow-y-auto no-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            
            {/* SCREEN 1: METEO VIEW */}
            {activeTab === 'meteo' && (
              <motion.div 
                key="meteo-tab-screen"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.3 }}
                className="relative w-full flex flex-col"
              >
                {/* Dynamic live weather ambient atmospheric animation */}
                <AmbientWeatherBackground weatherCode={currentCode} />

                {/* Glass panels layout overlay */}
                <div className="relative z-10 w-full flex flex-col space-y-4">
                  <div id="today-weather-widget" className="w-full flex flex-col space-y-4">
                    {/* Header info (City & Date) */}
                  <div className="pt-2 flex justify-between items-start text-white">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-[34px] font-semibold tracking-tight leading-tight" id="city-name">
                          {currentCommune.nom}
                        </h1>
                        <button
                          onClick={() => toggleFavorite(currentCommune)}
                          aria-label={favorites.some(fav => fav.code === currentCommune.code) ? "Retirer des favoris" : "Ajouter aux favoris"}
                          className="p-1 px-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 active:scale-95 transition-all text-white cursor-pointer shadow-sm shrink-0 flex items-center justify-center mt-1 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                          title={favorites.some(fav => fav.code === currentCommune.code) ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              favorites.some(fav => fav.code === currentCommune.code)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-white/70 hover:text-white'
                            }`}
                          />
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
                        <span>{frenchDate || 'Aujourd\'hui'}</span>
                        {saintDuJour && (
                          <>
                            <span className="text-white/30 text-xs font-light">•</span>
                            <span className="text-[12px] text-white/60 font-medium bg-white/5 border border-white/10 px-2 py-0.5 rounded-full" title="Saint(e) du jour">
                              ✨ Fête : {saintDuJour}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-[12px] text-white/50 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-white/70" />
                        <span>{currentTime || '00:00'} CEST</span>
                      </p>
                    </div>
                  </div>

                  {/* Loading skeleton or Climate central readout */}
                  {loading ? (
                    <div className="flex flex-col items-center py-10 my-auto animate-pulse space-y-4">
                      <div className="w-24 h-24 bg-white/25 rounded-full" />
                      <div className="h-10 w-28 bg-white/25 rounded-xl" />
                      <div className="h-6 w-36 bg-white/25 rounded-full" />
                    </div>
                  ) : weather ? (
                    <>
                      {/* Temperature Indicator Side-by-Side block matching graphic */}
                      {(() => {
                        const temp = Math.round(weather.current.temperature);
                        const isBurning = temp >= 30;
                        const isFreezing = temp < 10;

                        return (
                          <div className="flex items-center justify-between py-2 px-1 text-white select-none">
                            <div className="relative flex items-start pl-2">
                              {/* Particles container for Burning (Sparks rising up) */}
                              {isBurning && (
                                <>
                                  <div className="spark-particle" style={{ '--delay': '0s', '--left': '10%', '--duration': '1.8s', '--drift-x': '-12px' } as React.CSSProperties} />
                                  <div className="spark-particle" style={{ '--delay': '0.3s', '--left': '35%', '--duration': '2.2s', '--drift-x': '15px' } as React.CSSProperties} />
                                  <div className="spark-particle" style={{ '--delay': '0.6s', '--left': '60%', '--duration': '1.5s', '--drift-x': '-5px' } as React.CSSProperties} />
                                  <div className="spark-particle" style={{ '--delay': '0.9s', '--left': '85%', '--duration': '2s', '--drift-x': '10px' } as React.CSSProperties} />
                                  <div className="spark-particle" style={{ '--delay': '1.2s', '--left': '50%', '--duration': '1.7s', '--drift-x': '-8px' } as React.CSSProperties} />
                                </>
                              )}

                              {/* Particles container for Freezing (Snowflakes falling down) */}
                              {isFreezing && (
                                <>
                                  <span className="frost-particle font-sans" style={{ '--delay': '0s', '--left': '15%', '--duration': '3.2s', '--drift-x': '-15px', '--top': '-10%' } as React.CSSProperties}>❄</span>
                                  <span className="frost-particle font-sans" style={{ '--delay': '0.5s', '--left': '40%', '--duration': '2.8s', '--drift-x': '10px', '--top': '-15%' } as React.CSSProperties}>❅</span>
                                  <span className="frost-particle font-sans" style={{ '--delay': '1.1s', '--left': '70%', '--duration': '3.5s', '--drift-x': '-10px', '--top': '-5%' } as React.CSSProperties}>❆</span>
                                  <span className="frost-particle font-sans" style={{ '--delay': '1.7s', '--left': '90%', '--duration': '3s', '--drift-x': '12px', '--top': '-12%' } as React.CSSProperties}>❄</span>
                                </>
                              )}

                              <AnimatePresence mode="popLayout">
                                <motion.span
                                  key={temp}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -8 }}
                                  transition={{ duration: 0.3, ease: 'easeOut' }}
                                  className={`text-[96px] font-extralight tracking-tighter leading-none drop-shadow-sm inline-block ${
                                    isBurning ? 'burning-temp' : isFreezing ? 'freezing-temp' : 'text-white'
                                  }`}
                                  id="main-temp"
                                >
                                  {temp}
                                </motion.span>
                              </AnimatePresence>
                              <span className={`text-4xl font-light mt-1 ml-1 transition-all duration-300 ${
                                isBurning ? 'text-amber-400 font-normal drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : isFreezing ? 'text-sky-300 font-normal drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-white/80'
                              }`}>
                                °C
                              </span>
                            </div>
                            
                            {/* Glossy Weather Status icon aligned beautifully to the right */}
                            <div className="flex flex-col items-center pr-3 space-y-1">
                              <div className="relative w-20 h-20 flex items-center justify-center">
                                <div className={`absolute inset-1.5 rounded-full filter blur-md animate-pulse transition-colors duration-300 ${
                                  isBurning ? 'bg-orange-500/25' : isFreezing ? 'bg-sky-300/25' : 'bg-blue-200/20'
                                }`} />
                                <AnimatePresence mode="wait">
                                  <motion.div
                                    key={`${currentCode}-${isNightTimeNow}`}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.25, ease: 'easeOut' }}
                                    className="flex items-center justify-center relative z-10"
                                  >
                                    <ActiveWeatherIcon className={`w-16 h-16 ${weatherStyle.colorClass} drop-shadow-[0_4px_12px_rgba(0,0,0,0.15)]`} />
                                  </motion.div>
                                </AnimatePresence>
                              </div>
                              <span className="text-[13px] font-semibold text-white/95" id="weather-desc">
                                {weather.current.weatherDesc}
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2. Immediate alerts & short-term: Rain Grid & Vigilance side by side in glass panels */}
                      <div className="grid grid-cols-2 gap-4">
                        <TiltCard>
                          <RainForecast 
                            rainData={weather.rainInTheHour} 
                            precipitationProbability={weather.hourly[0]?.precipitationProbability || 0}
                          />
                        </TiltCard>
                        <TiltCard>
                          <VigilanceCard 
                            vigilance={weather.vigilance} 
                            uvIndex={selectedDayIndex === 0 
                              ? calculateCurrentUv(weather.daily[0]?.uvIndex, weather.sunrise, weather.sunset)
                              : weather.daily[selectedDayIndex]?.uvIndex} 
                          />
                        </TiltCard>
                      </div>

                      {/* 3. Hourly timeline progress rows */}
                      <TiltCard>
                        <HourlyForecast
                          hourlyData={selectedDayIndex === 0 ? weather.hourly : (weather.daily[selectedDayIndex]?.hourly || [])}
                          humidity={selectedDayIndex === 0 ? weather.current.humidity : (weather.daily[selectedDayIndex]?.humidity ?? weather.current.humidity)}
                          dayName={selectedDayIndex === 0 ? "Aujourd'hui" : (weather.daily[selectedDayIndex]?.date || "Sélectionné")}
                          sunrise={selectedDayIndex === 0 ? weather.sunrise : (weather.daily[selectedDayIndex]?.sunrise ?? weather.sunrise)}
                          sunset={selectedDayIndex === 0 ? weather.sunset : (weather.daily[selectedDayIndex]?.sunset ?? weather.sunset)}
                        />
                      </TiltCard>

                      {/* 4. Prévisions de la semaine (Météo-France) */}
                      <TiltCard>
                        <DailyForecast 
                          dailyData={weather.daily} 
                          cityName={weather.city} 
                          selectedDayIndex={selectedDayIndex}
                          onSelectDay={(index) => setSelectedDayIndex(index)}
                        />
                      </TiltCard>

                      {/* 5. Astrological & Ephemeris Card */}
                      <TiltCard>
                        <div className="glass-premium rounded-3xl p-4 shadow-lg flex justify-between items-center text-white/90 select-none">
                          <div className="flex items-center gap-5">
                            <div className="flex flex-col items-center gap-1" title="Lever du soleil (Heure locale)">
                              <Sunrise className="w-5 h-5 text-amber-300 drop-shadow-[0_0_8px_rgba(253,230,138,0.6)]" />
                              <span className="text-[10px] font-bold tracking-wide uppercase opacity-80">Lever</span>
                              <span className="text-xs font-semibold">{weather.sunrise || '06:00'}</span>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10" />
                            <div className="flex flex-col items-center gap-1" title="Coucher du soleil (Heure locale)">
                              <Sunset className="w-5 h-5 text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.6)]" />
                              <span className="text-[10px] font-bold tracking-wide uppercase opacity-80">Coucher</span>
                              <span className="text-xs font-semibold">{weather.sunset || '21:30'}</span>
                            </div>
                          </div>
                          
                          <div className="h-10 w-[1px] bg-white/10" />

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowMoonModal(true)}
                              className="flex flex-col items-center gap-1 px-3 hover:bg-white/5 rounded-xl transition-colors active:scale-95 border border-transparent hover:border-white/10 py-1" 
                              title="Phase lunaire actuelle"
                            >
                              <span className="text-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]">{getMoonPhase().emoji}</span>
                              <span className="text-[9px] font-bold tracking-wider uppercase opacity-80 truncate max-w-[70px]">{getMoonPhase().name}</span>
                            </button>
                            <button
                              onClick={handleOpenMorningBrief}
                              className="flex flex-col items-center gap-1 px-3 hover:bg-sky-500/20 rounded-xl transition-colors active:scale-95 border border-transparent hover:border-sky-400/30 py-1 text-sky-200" 
                              title="Ton Brief du Jour"
                            >
                              <span className="text-xl drop-shadow-[0_0_10px_rgba(14,165,233,0.4)]">🔮</span>
                              <span className="text-[9px] font-bold tracking-wider uppercase opacity-90 truncate max-w-[70px]">Brief</span>
                            </button>
                          </div>
                        </div>
                      </TiltCard>

                      {/* 6. Wind and Feels like metrics slider indicator bar */}
                      <TiltCard>
                        <Suspense fallback={
                          <div className="glass-premium rounded-3xl p-5 h-40 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                          </div>
                        }>
                          <WeatherStats
                            current={weather.current}
                            uvIndex={selectedDayIndex === 0
                              ? calculateCurrentUv(weather.daily[0]?.uvIndex, weather.sunrise, weather.sunset)
                              : weather.daily[selectedDayIndex]?.uvIndex}
                            hourlyData={selectedDayIndex === 0 ? weather.hourly : (weather.daily[selectedDayIndex]?.hourly || [])}
                            dailyData={weather.daily}
                          />
                        </Suspense>
                      </TiltCard>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-white/10 rounded-2xl border border-white/20 my-auto">
                      <AlertCircle className="w-10 h-10 text-white mb-2" />
                      <p className="text-sm text-white font-semibold">Aucune donnée météo chargée.</p>
                    </div>
                  )}
                  </div>

                  {/* Climatology comparison to 30-year historical climate averages (normals) */}
                  {weather && (
                    <TiltCard>
                      <ClimateComparison
                        latitude={weather.latitude}
                        longitude={weather.longitude}
                        currentMin={weather.daily[0]?.tempMin ?? Math.round(weather.current.temperature - 4)}
                        currentMax={weather.daily[0]?.tempMax ?? Math.round(weather.current.temperature + 4)}
                      />
                    </TiltCard>
                  )}

                  {/* Radar pluie & orages — RainViewer, historique + nowcast 30 min */}
                  {weather && (
                    <Suspense fallback={
                      <div className="glass-premium rounded-3xl h-[300px] flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                      </div>
                    }>
                      <RainRadar
                        latitude={weather.latitude}
                        longitude={weather.longitude}
                        cityName={weather.city}
                      />
                    </Suspense>
                  )}
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: CARTES VIEW (NOW COMPARISON VIEW) */}
            {activeTab === 'cartes' && (
              <motion.div 
                key="cartes-tab-screen"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-between text-white"
              >
                {weather ? (
                  <Suspense fallback={<LazyFallback />}>
                    <CityComparison
                      currentCommune={currentCommune}
                      currentWeather={weather}
                    />
                  </Suspense>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 border border-white/10 rounded-2xl">
                    <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-2" />
                    <p className="text-xs text-white/60">Chargement de la station principale...</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN 3: ALERTS VIEW */}
            {activeTab === 'alertes' && (
              <motion.div 
                key="alertes-tab-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-between text-white"
              >
                <Suspense fallback={<LazyFallback />}>
                  <AlertsView
                    vigilance={weather?.vigilance || {
                      globalLevel: 'green',
                      globalLabel: 'Verte',
                      categories: []
                    }}
                    cityName={currentCommune.nom}
                  />
                </Suspense>
              </motion.div>
            )}

            {/* SCREEN 4: RÉGLAGES SIMULATION & PREFERENCES */}
            {activeTab === 'reglages' && (
              <motion.div 
                key="reglages-tab-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col text-white space-y-4 pb-6"
              >
                {/* Unified Alert Settings Panel */}
                <div className="glass-premium rounded-3xl p-5 shadow-lg space-y-4 overflow-hidden relative">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-white/10 z-10 relative">
                    <Bell className="w-5 h-5 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] animate-bounce" />
                    <h4 className="text-[12px] font-extrabold uppercase tracking-widest text-sky-200">
                      Alertes & Récurrences
                    </h4>
                  </div>
                  
                  <p className="text-[11px] text-white/70 leading-relaxed italic z-10 relative">
                    Gérez vos alertes météo et la récurrence de votre dose d'ironie quotidienne ou des transitions météorologiques importantes.
                  </p>

                  <div className="space-y-3">
                    {/* 1. System Push toggle */}
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/15 flex flex-col gap-3">
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex-1">
                          <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5 uppercase tracking-wide">
                            <Bell className="w-3.5 h-3.5 text-sky-400" /> Notifications en Arrière-Plan (Web Push)
                          </h5>
                          <p className="text-[9.5px] text-white/80 leading-normal mt-1">
                            Recevez des alertes automatiques d'ironie météo même lorsque votre téléphone est verrouillé ou que l'application est totalement fermée !
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            const enabled = !notifSettings.systemEnabled;
                            if (enabled && 'Notification' in window) {
                              try {
                                const res = await Notification.requestPermission();
                                if (res !== 'granted') {
                                  setActiveToast({
                                    id: Math.random().toString(),
                                    title: "Autorisation Requise",
                                    message: "Veuillez autoriser les notifications dans les réglages de votre système/navigateur.",
                                    intensity: "alert_yellow"
                                  });
                                }
                              } catch (e) {
                                console.warn("RequestPermission error:", e);
                              }
                            } else if (enabled && !('Notification' in window)) {
                              setActiveToast({
                                id: Math.random().toString(),
                                title: "Non Supporté",
                                message: "Notifications non supportées par ce navigateur.",
                                intensity: "alert_orange"
                              });
                            }
                            const updated = { 
                              ...notifSettings, 
                              systemEnabled: enabled
                            };
                            // Si l'utilisateur active le bouton global et qu'aucune catégorie n'était cochée, on les active toutes par défaut pour l'aider.
                            // Sinon, on préserve strictement les choix spécifiques de l'utilisateur !
                            const hasAnySettingEnabled = 
                              notifSettings.rainNotificationsEnabled !== false || 
                              notifSettings.stormNotificationsEnabled !== false || 
                              notifSettings.alertNotificationsEnabled !== false;

                            if (enabled && !hasAnySettingEnabled) {
                              updated.rainNotificationsEnabled = true;
                              updated.stormNotificationsEnabled = true;
                              updated.alertNotificationsEnabled = true;
                            }
                            setNotifSettings(updated);
                            saveNotificationSettings(updated);
                          }}
                          role="switch"
                          aria-checked={notifSettings.systemEnabled}
                          aria-label="Notifications en arrière-plan"
                          className={`relative w-12 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-300 p-0.5 shrink-0 shadow-inner overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                            notifSettings.systemEnabled ? 'bg-sky-500' : 'bg-white/10 border border-white/10'
                          }`}
                          type="button"
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${
                            notifSettings.systemEnabled ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>

                      {/* Informative helper tips for bulletproof push notifications */}
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-[8.5px] text-white/60 leading-normal">
                        <div className="flex items-start gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1 shrink-0" />
                          <p>
                            <strong className="text-white">Fonctionnement autonome :</strong> Vos abonnements sont stockés de manière sécurisée sur notre serveur cloud. Toutes les 15 minutes, notre serveur interroge en arrière-plan les API météo de votre commune et déclenche une notification si le temps change brusquement.
                          </p>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1 shrink-0" />
                          <p>
                            <strong className="text-white">Conseil d'installation (PWA) :</strong> Sur mobile (iOS/Android), installez l'application sur votre écran d'accueil (via le bouton d'installation ou "Ajouter à l'écran d'accueil" de Safari/Chrome) pour garantir un fonctionnement parfait en arrière-plan sans restrictions du système.
                          </p>
                        </div>
                        {window.self !== window.top && (
                          <div className="flex items-start gap-1.5 text-amber-300/90 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />
                            <p>
                              <strong className="text-amber-200">Attention Aperçu :</strong> En mode aperçu de l'éditeur d'IA (dans cette fenêtre), le navigateur bloque les services de notification système. 
                              <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="ml-1 text-sky-400 underline hover:text-sky-300 font-semibold cursor-pointer">
                                Cliquez ici pour ouvrir l'application en grand écran
                              </a> pour pouvoir tester et activer les alertes en direct !
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Morning Brief (BirthDate) */}
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/15 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h5 className="text-[11px] font-bold text-sky-300 flex items-center gap-1.5 uppercase tracking-wide">
                            ⭐ Brief & Horoscope Matinal (Astro-Météo)
                          </h5>
                          <p className="text-[9.5px] text-white/80 leading-relaxed mt-1">
                            Recevez chaque matin à 8h00 un récapitulatif ultra-personnalisé mêlant sarcasme météo et prédictions astrales croustillantes liées à votre signe astrologique !
                          </p>
                          <p className="text-[8.5px] text-white/50 leading-relaxed mt-1.5 italic">
                            Pour activer cette fonctionnalité, veuillez renseigner votre date de naissance complète ci-dessous :
                          </p>
                        </div>
                        {notifSettings.birthDate && (
                          <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-md font-black tracking-wider uppercase shrink-0">
                            ACTIF
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 pt-1.5 border-t border-white/5">
                        <label htmlFor="birthdate-input" className="text-[10px] font-medium text-white/90 shrink-0">
                          Votre date de naissance :
                        </label>
                        <div className="relative w-full sm:w-auto flex-1 max-w-[200px]">
                          <input
                            id="birthdate-input"
                            type="date"
                            value={notifSettings.birthDate || ''}
                            onChange={(e) => {
                              const updated = { ...notifSettings, birthDate: e.target.value };
                              setNotifSettings(updated);
                              saveNotificationSettings(updated);
                            }}
                            className="text-[10px] bg-black/50 border border-white/20 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/40 w-full font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Rain choice toggle */}
                    <div className={`bg-white/10 p-3 rounded-2xl border border-white/15 flex justify-between items-center gap-3 transition-opacity duration-300 ${
                      !notifSettings.systemEnabled ? 'opacity-40' : ''
                    }`}>
                      <div className="flex-1">
                        <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <CloudRain className="w-3.5 h-3.5 text-sky-300" /> Pluies & Averses
                        </h5>
                        <p className="text-[9px] text-white/60 leading-none mt-1">
                          {!notifSettings.systemEnabled ? 'Inactive car globale coupée' : 'Crachins, déluges & accalmies'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = { 
                            ...notifSettings, 
                            rainNotificationsEnabled: notifSettings.rainNotificationsEnabled !== false ? false : true 
                          };
                          setNotifSettings(updated);
                          saveNotificationSettings(updated);
                        }}
                        role="switch"
                        aria-checked={notifSettings.rainNotificationsEnabled !== false}
                        aria-label="Notifications pluie"
                        className={`relative w-12 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-300 p-0.5 shrink-0 shadow-inner overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                          notifSettings.rainNotificationsEnabled !== false ? 'bg-sky-500' : 'bg-white/10 border border-white/10'
                        }`}
                        type="button"
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${
                          notifSettings.rainNotificationsEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 4. Thunderstorm / Storm choice toggle */}
                    <div className={`bg-white/10 p-3 rounded-2xl border border-white/15 flex justify-between items-center gap-3 transition-opacity duration-300 ${
                      !notifSettings.systemEnabled ? 'opacity-40' : ''
                    }`}>
                      <div className="flex-1">
                        <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <CloudLightning className="w-3.5 h-3.5 text-amber-300" /> Orages & Tempêtes
                        </h5>
                        <p className="text-[9px] text-white/60 leading-none mt-1">
                          {!notifSettings.systemEnabled ? 'Inactive car globale coupée' : 'Impacts de foudre & fin d\'orage'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = { 
                            ...notifSettings, 
                            stormNotificationsEnabled: notifSettings.stormNotificationsEnabled !== false ? false : true 
                          };
                          setNotifSettings(updated);
                          saveNotificationSettings(updated);
                        }}
                        role="switch"
                        aria-checked={notifSettings.stormNotificationsEnabled !== false}
                        aria-label="Notifications orages"
                        className={`relative w-12 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-300 p-0.5 shrink-0 shadow-inner overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                          notifSettings.stormNotificationsEnabled !== false ? 'bg-amber-500' : 'bg-white/10 border border-white/10'
                        }`}
                        type="button"
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${
                          notifSettings.stormNotificationsEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>

                    {/* 5. Vigilance Alert choice toggle */}
                    <div className={`bg-white/10 p-3 rounded-2xl border border-white/15 flex justify-between items-center gap-3 transition-opacity duration-300 ${
                      !notifSettings.systemEnabled ? 'opacity-40' : ''
                    }`}>
                      <div className="flex-1">
                        <h5 className="text-[11px] font-bold text-white flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Alertes de Vigilance
                        </h5>
                        <p className="text-[9px] text-white/60 leading-none mt-1">
                          {!notifSettings.systemEnabled ? 'Inactive car globale coupée' : 'Vigilances Locales (Météo-France)'}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const updated = { 
                            ...notifSettings, 
                            alertNotificationsEnabled: notifSettings.alertNotificationsEnabled !== false ? false : true 
                          };
                          setNotifSettings(updated);
                          saveNotificationSettings(updated);
                        }}
                        role="switch"
                        aria-checked={notifSettings.alertNotificationsEnabled !== false}
                        aria-label="Notifications vigilance"
                        className={`relative w-12 h-6 flex items-center rounded-full cursor-pointer transition-colors duration-300 p-0.5 shrink-0 shadow-inner overflow-hidden focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
                          notifSettings.alertNotificationsEnabled !== false ? 'bg-rose-500' : 'bg-white/10 border border-white/10'
                        }`}
                        type="button"
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 relative z-10 ${
                          notifSettings.alertNotificationsEnabled !== false ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section de Test des Notifications — admin only */}
                {isAdmin && (
                <div className="glass-premium rounded-3xl p-5 shadow-lg space-y-4 overflow-hidden relative">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-white/10 z-10 relative">
                    <Sparkles className="w-5 h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                    <h4 className="text-[12px] font-extrabold uppercase tracking-widest text-amber-200">
                      🧪 Labo de Test des Notifications
                    </h4>
                  </div>

                  <p className="text-[11px] text-white/70 leading-relaxed italic z-10 relative">
                    Validez le bon fonctionnement de votre système de notifications (directes et en arrière-plan) en un clic.
                  </p>

                  <div className="flex flex-col gap-2.5">
                    {/* Test local */}
                    <button
                      onClick={() => {
                        triggerFunnyNotification('moderate', true);
                      }}
                      className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition-all active:scale-[0.98]"
                    >
                      <span className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-sky-400" />
                        Tester en Direct (Notification Locale)
                      </span>
                      <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                        LOCAL
                      </span>
                    </button>

                    {/* Test push serveur */}
                    <button
                      onClick={async () => {
                        if (testingPush) return;
                        setTestingPush(true);
                        try {
                          const adminToken = localStorage.getItem('adminToken') || '';
                          const res = await fetch('/api/test-push', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'X-Admin-Token': adminToken
                            },
                            body: JSON.stringify({
                              intensity: 'moderate',
                              humorLevel: notifSettings.humorLevel
                            })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setActiveToast({
                              id: Math.random().toString(),
                              title: "Web Push Réussi !",
                              message: `Test envoyé à ${data.successCount} abonné(s) actif(s). Fermez l'app pour voir le push !`,
                              intensity: "moderate"
                            });
                          } else {
                            setActiveToast({
                              id: Math.random().toString(),
                              title: "Échec Web Push",
                              message: data.error || "Une erreur s'est produite lors de l'envoi du test.",
                              intensity: "alert_orange"
                            });
                          }
                        } catch (err) {
                          setActiveToast({
                            id: Math.random().toString(),
                            title: "Erreur de Connexion",
                            message: "Impossible de joindre le serveur de notifications.",
                            intensity: "alert_red"
                          });
                        } finally {
                          setTestingPush(false);
                        }
                      }}
                      disabled={testingPush}
                      className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        {testingPush ? (
                          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        ) : (
                          <CloudRain className="w-4 h-4 text-amber-400" />
                        )}
                        Tester le Web Push (Serveur Cloud)
                      </span>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                        CLOUD
                      </span>
                    </button>

                    {/* Test CRON trigger */}
                    <button
                      onClick={async () => {
                        if (testingCron) return;
                        setTestingCron(true);
                        try {
                          const adminToken = localStorage.getItem('adminToken') || '';
                          const res = await fetch('/api/cron/check-weather', {
                            headers: { 'X-Admin-Token': adminToken }
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setActiveToast({
                              id: Math.random().toString(),
                              title: "Vérification Forcée !",
                              message: "Le serveur a scanné toutes les villes abonnées avec succès.",
                              intensity: "alert_yellow"
                            });
                          } else {
                            setActiveToast({
                              id: Math.random().toString(),
                              title: "Erreur Surveillance",
                              message: data.error || "Échec de l'exécution de la surveillance.",
                              intensity: "alert_orange"
                            });
                          }
                        } catch (err) {
                          setActiveToast({
                            id: Math.random().toString(),
                            title: "Erreur Serveur",
                            message: "Impossible de lancer le scan des communes.",
                            intensity: "alert_red"
                          });
                        } finally {
                          setTestingCron(false);
                        }
                      }}
                      disabled={testingCron}
                      className="w-full bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-between transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        {testingCron ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-rose-400" />
                        )}
                        Forcer la Vérification Météo (CRON API)
                      </span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                        CRON
                      </span>
                    </button>
                  </div>
                </div>
                )}

                {/* Guide d'installation de la PWA mobile */}
                <Suspense fallback={<LazyFallback />}>
                  <PwaInstallWizard
                    deferredPrompt={deferredPrompt}
                    isAppInstalled={isAppInstalled}
                    onInstallTrigger={triggerPwaInstall}
                  />
                </Suspense>

                {/* Dev / Application information */}
                <div className="glass-premium rounded-3xl p-4 shadow-sm text-center">
                  <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest">
                    <span>Météo Pure v3.0</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM GLASS NAVIGATION BAR - PERFECT 4-COL PILL DOCK STYLE */}
        <nav 
          id="tab-navigation-panel"
          className="relative z-10 mt-6 bg-white/15 backdrop-blur-md border border-white/20 rounded-full p-1.5 flex justify-around items-center shadow-lg"
        >
          {/* TAB 1: Météo */}
          <button
            onClick={() => setActiveTab('meteo')}
            aria-label="Météo"
            aria-current={activeTab === 'meteo' ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
              activeTab === 'meteo'
                ? 'bg-white/20 text-white font-bold text-shadow-sm scale-105'
                : 'text-white/60 hover:text-white/90 font-medium'
            }`}
          >
            <CloudSun className="w-5 h-5" />
            <span className="text-[9px]">Météo</span>
          </button>

          {/* TAB 2: Comparer */}
          <button
            onClick={() => setActiveTab('cartes')}
            aria-label="Comparer les villes"
            aria-current={activeTab === 'cartes' ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
              activeTab === 'cartes'
                ? 'bg-white/20 text-white font-bold text-shadow-sm scale-105'
                : 'text-white/60 hover:text-white/90 font-medium'
            }`}
          >
            <ArrowRightLeft className={`w-5 h-5 rotate-45 ${activeTab === 'cartes' ? 'text-sky-400' : ''}`} />
            <span className="text-[9px]">Comparer</span>
          </button>

          {/* TAB 3: Alertes */}
          <button
            onClick={() => setActiveTab('alertes')}
            aria-label="Alertes et vigilance"
            aria-current={activeTab === 'alertes' ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
              activeTab === 'alertes'
                ? 'bg-white/20 text-white font-bold text-shadow-sm scale-105'
                : 'text-white/60 hover:text-white/90 font-medium'
            }`}
          >
            <div className="relative">
              <Bell className="w-5 h-5" />
              {weather && weather.vigilance.globalLevel !== 'green' && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-white/60" />
              )}
            </div>
            <span className="text-[9px]">Alertes</span>
          </button>

          {/* TAB 4: Réglages */}
          <button
            onClick={() => setActiveTab('reglages')}
            aria-label="Réglages"
            aria-current={activeTab === 'reglages' ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sky-400/60 ${
              activeTab === 'reglages'
                ? 'bg-white/20 text-white font-bold text-shadow-sm scale-105'
                : 'text-white/60 hover:text-white/90 font-medium'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[9px]">Réglages</span>
          </button>
        </nav>

      </div>

      {/* Share today's weather as PNG */}
      <Suspense fallback={null}>
        <SharePreviewModal
          isOpen={todayShare.isModalOpen}
          onClose={todayShare.close}
          imageSrc={todayShare.imageSrc}
          isGenerating={todayShare.isGenerating}
          title={`Météo à ${currentCommune.nom}`}
          copyStatus={todayShare.copyStatus}
          onCopy={todayShare.copy}
          onDownload={() => todayShare.download(`Meteo_${currentCommune.nom.replace(/\s+/g, '_')}_${Date.now()}.png`)}
        />
      </Suspense>
    </div>
  );
}
