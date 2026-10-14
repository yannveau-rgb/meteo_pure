import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  Bell,
  Loader2,
  Navigation,
  CloudLightning,
  AlertCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  AlertTriangle,
  Sunrise,
  Sunset,
  Share2,
  CloudRain,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getWeatherUI, getMoonPhase, calculateCurrentUv, isNightTime } from './utils/weatherUtils';
import { getSaintDuJour } from './utils/ephemeris';
import { formatCacheTime } from './utils/weatherCache';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  loadNotificationLogs,
  saveNotificationLogs,
  getFunnyRainMessage,
  fireSystemNotification,
  checkAndFireFullMoonNotification,
  isSpamProtected,
  updateLastAlertTime,
  syncPushSubscription,
  refreshPushSubscription,
  NotificationLog,
  NotificationSettings,
  NotificationIntensity,
  DEFAULT_NOTIFICATION_SETTINGS
} from './utils/notificationService';

// Custom hooks
import { useFavorites } from './hooks/useFavorites';
import { usePwaInstall } from './hooks/usePwaInstall';
import { useFrenchClock } from './hooks/useFrenchClock';
import { useCurrentCommune } from './hooks/useCurrentCommune';
import { useCitySearch } from './hooks/useCitySearch';
import { useWeatherFetch } from './hooks/useWeatherFetch';
import { useMorningBrief } from './hooks/useMorningBrief';
import { useAirQuality } from './hooks/useAirQuality';
import { getAqiBand } from './utils/airQuality';
import { useSpeechSynthesis } from './hooks/useSpeechSynthesis';
import { useShareImage } from './hooks/useShareImage';
import { useGeolocation } from './hooks/useGeolocation';

// Modular child components
import RainForecast from './components/RainForecast';
import VigilanceCard from './components/VigilanceCard';
const WeatherStats = lazy(() => import('./components/WeatherStats'));
import HourlyForecast from './components/HourlyForecast';
import AirQualityCard from './components/AirQualityCard';
import DailyForecast from './components/DailyForecast';
import AmbientWeatherBackground from './components/AmbientWeatherBackground';
import ClimateComparison from './components/ClimateComparison';
const RainRadar = lazy(() => import('./components/RainRadar'));
import TiltCard from './components/TiltCard';
import PrivacyPolicy from './components/PrivacyPolicy';
import Toggle from './components/ui/Toggle';
import InfoBadge from './components/ui/InfoBadge';
import BottomNav, { AppTab } from './components/BottomNav';
import MoonPhasesModal from './components/modals/MoonPhasesModal';
import HoroscopeModal from './components/HoroscopeModal';
import WelcomePrompt from './components/modals/WelcomePrompt';
import Toast, { ToastData } from './components/Toast';

// Pure minimalist components (video UI match)
import CelestialSky from './components/pure/CelestialSky';
import TimeScrubber from './components/pure/TimeScrubber';
import PureWeatherHero from './components/pure/PureWeatherHero';
import PureDetailDrawer from './components/pure/PureDetailDrawer';
import PureDetailedCards from './components/pure/PureDetailedCards';

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
  const [activeTab, setActiveTab] = useState<AppTab>('meteo');
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);
  const [heroMode, setHeroMode] = useState<'weather' | 'aqi'>('weather');
  const [showDetailDrawer, setShowDetailDrawer] = useState<boolean>(false);

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
  const [activeToast, setActiveToast] = useState<ToastData | null>(null);
  const [testingPush, setTestingPush] = useState<boolean>(false);
  const [testingCron, setTestingCron] = useState<boolean>(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);

  // Weather data (fetch + 10-min refresh)
  const { weather, loading, refreshing, errorMsg, setErrorMsg, staleSince } = useWeatherFetch(currentCommune, () => {
    if (notifSettings.systemEnabled) {
      checkAndFireFullMoonNotification(notifSettings.humorLevel);
    }
  });

  // Geolocation active indicator + handler
  const { geoLocating, handleGeolocation } = useGeolocation(setCurrentCommune, setActiveTab, setErrorMsg);

  // Reset selected forecast day and hour scrubber whenever commune changes
  useEffect(() => { 
    setSelectedDayIndex(0); 
    setSelectedHourIndex(0);
  }, [currentCommune]);

  // Scrubbed hour item & celestial time calculation
  const scrubbedHourItem = weather?.hourly?.[selectedHourIndex];

  const currentFloatHour = React.useMemo(() => {
    if (selectedHourIndex === 0 || !scrubbedHourItem) {
      const now = new Date();
      return now.getHours() + now.getMinutes() / 60;
    }
    const parts = scrubbedHourItem.time.split(':');
    return parseInt(parts[0], 10) + (parseInt(parts[1] || '0', 10) / 60);
  }, [selectedHourIndex, scrubbedHourItem]);

  const sunriseFloat = React.useMemo(() => {
    if (!weather?.sunrise) return 7.0;
    const parts = weather.sunrise.split(':');
    return parseInt(parts[0], 10) + (parseInt(parts[1] || '0', 10) / 60);
  }, [weather?.sunrise]);

  const sunsetFloat = React.useMemo(() => {
    if (!weather?.sunset) return 19.5;
    const parts = weather.sunset.split(':');
    return parseInt(parts[0], 10) + (parseInt(parts[1] || '0', 10) / 60);
  }, [weather?.sunset]);

  const isScrubbedDaytime = currentFloatHour >= sunriseFloat && currentFloatHour <= sunsetFloat;

  // Moon / Morning Brief modals + AI call
  const {
    showMoonModal, setShowMoonModal,
    showMorningBriefModal, setShowMorningBriefModal,
    aiBrief,
    loadingBrief,
    openMorningBrief,
  } = useMorningBrief();

  // Air quality & pollen — supplementary, never blocks the forecast
  const airQuality = useAirQuality(weather?.latitude, weather?.longitude);

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
    // Morning brief itself is no longer fired from the client — the server
    // already sends an AI-generated one daily (6h-10h), and firing both
    // caused users to receive it twice on days they opened the app in that
    // window. Full moon stays client-side since the server doesn't track it.
    if (notifSettings.systemEnabled) {
      checkAndFireFullMoonNotification(notifSettings.humorLevel);
    }
  }, [notifSettings.systemEnabled, notifSettings.humorLevel]);

  // `weather` gets a new object identity on every 10-min refresh even when
  // nothing meaningful changed, so it's tracked in a ref rather than an
  // effect dependency below — putting the object itself in the deps array
  // used to re-run this sync (and re-POST /api/subscribe) every 10 minutes
  // for all ~11 subscribers, for no behavioral gain.
  const weatherRef = useRef(weather);
  useEffect(() => { weatherRef.current = weather; }, [weather]);

  // Synchronize Background push subscription with server for unattended background notifications
  useEffect(() => {
    syncPushSubscription(
      notifSettings.systemEnabled,
      currentCommune,
      notifSettings.humorLevel,
      weatherRef.current,
      notifSettings.birthDate,
      {
        rainNotificationsEnabled: notifSettings.rainNotificationsEnabled,
        stormNotificationsEnabled: notifSettings.stormNotificationsEnabled,
        alertNotificationsEnabled: notifSettings.alertNotificationsEnabled,
        minMinutesBetweenAlerts: notifSettings.minMinutesBetweenAlerts
      }
    );
  }, [notifSettings.systemEnabled, currentCommune, notifSettings.humorLevel, notifSettings.birthDate, notifSettings.rainNotificationsEnabled, notifSettings.stormNotificationsEnabled, notifSettings.alertNotificationsEnabled, notifSettings.minMinutesBetweenAlerts]);

  const handleOpenMorningBrief = () =>
    openMorningBrief(
      notifSettings.birthDate || '',
      weather?.current.weatherCode || 0,
      notifSettings.humorLevel,
      currentCommune?.nom || 'Inconnu',
      weather
    );

  // Toggling the master Web Push switch: requests OS/browser permission when
  // turning on, and — the first time it's enabled with no category picked
  // yet — turns all 3 categories on so the toggle isn't a silent no-op.
  const handleToggleSystemNotifications = async () => {
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
  };

  const handleToggleRainNotifications = () => {
    const updated = { ...notifSettings, rainNotificationsEnabled: notifSettings.rainNotificationsEnabled !== false ? false : true };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleToggleStormNotifications = () => {
    const updated = { ...notifSettings, stormNotificationsEnabled: notifSettings.stormNotificationsEnabled !== false ? false : true };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

  const handleToggleAlertNotifications = () => {
    const updated = { ...notifSettings, alertNotificationsEnabled: notifSettings.alertNotificationsEnabled !== false ? false : true };
    setNotifSettings(updated);
    saveNotificationSettings(updated);
  };

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

  // NOTE: automatic client-side weather-transition notifications (rain/storm
  // start-stop, vigilance level changes) used to be fired from here too, as a
  // workaround while the server-side push cron was unreliable. Now that the
  // server cron runs reliably (every 10 min via an external scheduler) and
  // already sends these same alerts as real push notifications, keeping this
  // client-side duplicate caused users to get the same alert twice whenever
  // the app happened to be open. Removed — the server is now the single
  // source of truth for rain/storm/vigilance/heatwave notifications.

  // Silently refresh push subscription on every app load to keep endpoint fresh
  useEffect(() => {
    if (!weather || !currentCommune || !notifSettings.systemEnabled) return;
    refreshPushSubscription(
      currentCommune,
      notifSettings.humorLevel,
      notifSettings.birthDate,
      {
        rainNotificationsEnabled: notifSettings.rainNotificationsEnabled,
        stormNotificationsEnabled: notifSettings.stormNotificationsEnabled,
        alertNotificationsEnabled: notifSettings.alertNotificationsEnabled,
        minMinutesBetweenAlerts: notifSettings.minMinutesBetweenAlerts
      }
    );
    // Intentionally narrow: only re-run on city change, not on every 10-min
    // weather refresh or settings tweak (that's handled by the sync effect above).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weather?.city]);

  // Handle Dynamic Geolocation Pin search
  // GDPR: delete all user data (local + server)
  const handleDeleteAllData = async () => {
    try {
      // 1. Call server unsubscribe
      const reg = await navigator.serviceWorker?.ready;
      const sub = await reg?.pushManager?.getSubscription();
      if (sub) {
        await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
    } catch (e) {
      console.warn('Server unsubscribe failed (may be offline):', e);
    }
    // 2. Clear localStorage
    localStorage.clear();
    // 3. Reset state
    setNotifSettings(DEFAULT_NOTIFICATION_SETTINGS);
    setNotifLogs([]);
    setShowPrivacyPolicy(false);
    setActiveToast({
      id: Math.random().toString(),
      title: "Données supprimées",
      message: "Toutes vos données personnelles ont été effacées de votre appareil et de notre serveur.",
      intensity: "moderate"
    });
  };


  // Resolve background style from WMO code of active weather
  const currentCode = weather?.current.weatherCode ?? 0;
  // Let's check weather hour is night or not, using real sunrise/sunset when available
  const isNightTimeNow = isNightTime(weather?.sunrise, weather?.sunset);

  const weatherStyle = getWeatherUI(currentCode, isNightTimeNow);
  const ActiveWeatherIcon = weatherStyle.icon;

  // Keeps <body>'s background (index.css) and the status bar's theme-color
  // in sync with the same day/night call this component already makes for
  // the app shell itself — both used to be hardcoded to day colors, visible
  // during iOS's overscroll bounce and in the installed PWA's status bar.
  useEffect(() => {
    document.body.dataset.daytime = isNightTimeNow ? 'night' : 'day';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isNightTimeNow ? '#0a1f38' : '#123a5e');
  }, [isNightTimeNow]);

  return (
    <div className={`min-h-screen w-full flex justify-center items-center p-0 sm:p-6 text-white antialiased overflow-x-hidden bg-gradient-to-br ${isNightTimeNow ? 'from-[#0a1f38] via-[#123a5e] to-[#081b2e]' : 'from-[#123a5e] via-[#2a72a8] to-[#0d2e4a]'}`}>
      
      {/* Skip-to-content link for keyboard/screen-reader users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[200] focus:px-4 focus:py-2 focus:bg-sky-500 focus:text-white focus:rounded-full focus:font-bold focus:shadow-lg">
        Aller au contenu principal
      </a>

      {/* The 4 tabs are views within one single-page app, not separate
          pages, so there is exactly one h1 for the whole document — every
          tab's own heading (including the city name below) is an h2. This
          used to be split: the Météo tab's city name was itself an h1,
          while the other 3 tabs started at h2, an inconsistent hierarchy
          for equivalent content. */}
      <h1 className="sr-only">Météo Pure</h1>

      {/* Container Principal (Mobile-First responsive frame) */}
      <main
        id="applet-main-frame"
        className="relative w-full max-w-md min-h-screen sm:min-h-[880px] sm:max-h-[920px] sm:rounded-[40px] shadow-2xl overflow-hidden bg-white/5 backdrop-blur-[45px] border border-white/20 flex flex-col justify-between pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] px-6 sm:p-6"
      >
        
        {/* MOON PHASES MODAL */}
        <MoonPhasesModal isOpen={showMoonModal} onClose={() => setShowMoonModal(false)} />

        {/* HOROSCOPE MODAL */}
        <HoroscopeModal
          isOpen={showMorningBriefModal}
          onClose={() => setShowMorningBriefModal(false)}
          loading={loadingBrief}
          brief={aiBrief}
          hasBirthDate={Boolean(notifSettings.birthDate)}
          onOpenSettings={() => {
            setShowMorningBriefModal(false);
            setActiveTab('reglages');
          }}
          cityName={currentCommune?.nom}
          speech={briefSpeech}
        />

        {/* WELCOME GEOLOCATION PROMPT */}
        <WelcomePrompt
          isOpen={showWelcomePrompt}
          onDismiss={() => setShowWelcomePrompt(false)}
          onUseLocation={() => {
            setShowWelcomePrompt(false);
            handleGeolocation();
          }}
        />

        {/* PRIVACY POLICY MODAL */}
        <AnimatePresence>
          {showPrivacyPolicy && (
            <PrivacyPolicy
              isOpen={showPrivacyPolicy}
              onClose={() => setShowPrivacyPolicy(false)}
              onDeleteAllData={handleDeleteAllData}
            />
          )}
        </AnimatePresence>

        {/* FLOATING FUNNY TOAST NOTIFICATION */}
        <Toast toast={activeToast} cityName={currentCommune.nom} onDismiss={() => setActiveToast(null)} />
        
        {/* Dynamic Celestial Sky (Sun arc, Moon crescent, Stars, Gradients) */}
        <CelestialSky
          hour={currentFloatHour}
          sunriseHour={sunriseFloat}
          sunsetHour={sunsetFloat}
          weatherCode={scrubbedHourItem ? scrubbedHourItem.weatherCode : (weather?.current.weatherCode || 0)}
        />

        {/* Animated subtle glow layer */}
        <div className="absolute top-1/3 -left-12 pointer-events-none w-56 h-56 rounded-full bg-sky-200/10 filter blur-3xl animate-pulse" />

        {/* TOP PANEL: Auto-suggest Search and Geolocation pin (Shown on Villes tab or secondary tabs) */}
        {activeTab === 'villes' && (
        <div className="relative z-30 pt-1">
          <div className="flex gap-2 items-center">
            {/* Real Search Bar Container */}
            <div className="relative flex-1">
              <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full border border-white/40 shadow-sm px-3.5 py-2">
                <Search className="w-4 h-4 text-white/85 mr-2 flex-shrink-0" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={showSearchList && searchResults.length > 0}
                  aria-controls="city-search-listbox"
                  aria-autocomplete="list"
                  aria-label="Rechercher une ville"
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
                    id="city-search-listbox"
                    role="listbox"
                    aria-label="Résultats de recherche"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-12 left-0 right-0 max-h-56 overflow-y-auto bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl z-40 no-scrollbar text-slate-800"
                  >
                    {searchResults.map((commune, index) => (
                      <button
                        key={`${commune.code}-${index}`}
                        role="option"
                        aria-selected={false}
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
                      className="cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-sky-400/60 rounded"
                    >
                      {fav.nom}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFavorites(favorites.filter(f => f.code !== fav.code));
                      }}
                      aria-label={`Retirer ${fav.nom} des favoris`}
                      className="text-white/60 hover:text-rose-300 hover:scale-110 transition-transform cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/60 rounded p-1 -m-0.5"
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
        )}

        {/* ERROR DISPLAY SYSTEM */}
        {errorMsg && (
          <div role="alert" className="z-10 mt-4 p-3 rounded-2xl bg-rose-500/25 backdrop-blur-md border border-rose-500/40 text-white text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-200" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* VIEW ROUTER (MAIN BODY AREA) */}
        <div className="flex-1 flex flex-col mt-4 overflow-y-auto no-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            
                        {/* SCREEN 1: METEO VIEW (ULTRA-MINIMALIST WITH TIME-SCRUBBER) */}
            {activeTab === 'meteo' && (
              <motion.div
                key="meteo-tab-screen"
                id="panel-meteo"
                role="tabpanel"
                aria-labelledby="tab-meteo"
                tabIndex={0}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="relative w-full flex-1 flex flex-col justify-between focus:outline-none min-h-[560px]"
              >
                {/* Dynamic live weather ambient atmospheric animation */}
                <AmbientWeatherBackground weatherCode={scrubbedHourItem ? scrubbedHourItem.weatherCode : currentCode} />

                {loading ? (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 animate-pulse space-y-4">
                    <div className="w-20 h-20 bg-white/20 rounded-full" />
                    <div className="h-10 w-28 bg-white/20 rounded-xl" />
                    <div className="h-4 w-36 bg-white/20 rounded-full" />
                  </div>
                ) : weather ? (
                  <>
                    {/* The signature minimalist Hero view */}
                    <PureWeatherHero
                      weather={weather}
                      selectedHour={selectedHourIndex === 0 ? undefined : scrubbedHourItem}
                      cityName={currentCommune.nom}
                      onOpenDetails={() => setShowDetailDrawer(true)}
                      mode={heroMode}
                      onToggleMode={setHeroMode}
                      airQualityIndex={airQuality?.aqi}
                      airQualityLabel={airQuality?.aqi ? getAqiBand(airQuality.aqi).label : undefined}
                    />

                    {/* The signature interactive Time-Scrubber ruler */}
                    <div className="w-full pb-2 z-20">
                      <TimeScrubber
                        hourly={weather.hourly || []}
                        selectedIndex={selectedHourIndex}
                        onSelectIndex={setSelectedHourIndex}
                        isDaytime={isScrubbedDaytime}
                      />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-white/10 rounded-2xl border border-white/20 my-auto">
                    <AlertCircle className="w-10 h-10 text-white mb-2" />
                    <p className="text-sm text-white font-semibold">Aucune donnée météo chargée.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* SCREEN: VILLES (FAVORITES & EXPLORATION) */}
            {activeTab === 'villes' && (
              <motion.div
                key="villes-tab-screen"
                id="panel-villes"
                role="tabpanel"
                aria-labelledby="tab-villes"
                tabIndex={0}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col space-y-4 text-white focus:outline-none pt-2"
              >
                {/* Active City Card */}
                <div className="glass-premium rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-white/60 font-semibold uppercase tracking-wider block">Ville active</span>
                    <h3 className="text-xl font-bold text-white">{currentCommune.nom}</h3>
                    <p className="text-xs text-white/70">Dép. {currentCommune.codeDepartement}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(currentCommune)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white cursor-pointer"
                    title={favorites.some(fav => fav.code === currentCommune.code) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Star
                      className={`w-5 h-5 ${favorites.some(fav => fav.code === currentCommune.code) ? 'text-amber-400 fill-amber-400' : 'text-white/70 hover:text-white'}`}
                    />
                  </button>
                </div>

                {/* Saved Favorite Cities */}
                <div className="flex-1 flex flex-col space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5 pt-2">
                    <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span>Mes villes favorites ({favorites.length})</span>
                  </h4>

                  {favorites.length === 0 ? (
                    <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/10 text-white/60 text-xs">
                      Aucune ville en favoris. Recherchez une ville ci-dessus et cliquez sur l'étoile pour l'ajouter !
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
                      {favorites.map((fav) => (
                        <div
                          key={fav.code}
                          onClick={() => {
                            setCurrentCommune(fav);
                            setActiveTab('meteo');
                          }}
                          className={`w-full p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            currentCommune.code === fav.code
                              ? 'bg-sky-500/30 border-sky-400/50 shadow-md'
                              : 'bg-white/10 hover:bg-white/15 border-white/15'
                          }`}
                        >
                          <div className="text-left">
                            <span className="text-sm font-bold text-white block">{fav.nom}</span>
                            <span className="text-[11px] text-white/60">Dép. {fav.codeDepartement}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFavorites(favorites.filter(f => f.code !== fav.code));
                              }}
                              className="p-1.5 rounded-full hover:bg-white/20 text-white/60 hover:text-rose-300 transition-colors"
                              title="Supprimer des favoris"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

{/* SCREEN 2: CARTES VIEW (NOW COMPARISON VIEW) */}
            {activeTab === 'cartes' && (
              <motion.div
                key="cartes-tab-screen"
                id="panel-cartes"
                role="tabpanel"
                aria-labelledby="tab-cartes"
                tabIndex={0}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-between text-white focus:outline-none"
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
                id="panel-alertes"
                role="tabpanel"
                aria-labelledby="tab-alertes"
                tabIndex={0}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-between text-white focus:outline-none"
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
                id="panel-reglages"
                role="tabpanel"
                aria-labelledby="tab-reglages"
                tabIndex={0}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col text-white space-y-4 pb-6 focus:outline-none"
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
                        <Toggle
                          checked={notifSettings.systemEnabled}
                          onChange={handleToggleSystemNotifications}
                          label="Notifications en arrière-plan"
                        />
                      </div>

                      {/* Informative helper tips for bulletproof push notifications */}
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1.5 text-[9px] text-white/60 leading-normal">
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
                            Recevez chaque matin à 8h00 votre récapitulatif ultra-personnalisé mêlant les prévisions météo du jour et une touche d'inspiration positive !
                          </p>
                          <p className="text-[9px] text-white/50 leading-relaxed mt-1.5 italic">
                            Pour activer cette fonctionnalité, veuillez renseigner votre date de naissance complète ci-dessous :
                          </p>
                        </div>
                        {notifSettings.birthDate && (
                          <span className="text-[9px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-md font-black tracking-wider uppercase shrink-0">
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
                      <Toggle
                        checked={notifSettings.rainNotificationsEnabled !== false}
                        onChange={handleToggleRainNotifications}
                        label="Notifications pluie"
                      />
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
                      <Toggle
                        checked={notifSettings.stormNotificationsEnabled !== false}
                        onChange={handleToggleStormNotifications}
                        label="Notifications orages"
                        activeColorClass="bg-amber-500"
                      />
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
                      <Toggle
                        checked={notifSettings.alertNotificationsEnabled !== false}
                        onChange={handleToggleAlertNotifications}
                        label="Notifications vigilance"
                        activeColorClass="bg-rose-500"
                      />
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
                        } catch {
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
                        } catch {
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

                {/* Legal & Privacy */}
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="glass-premium rounded-3xl p-4 shadow-sm text-center hover:bg-white/10 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-400/60 w-full"
                  aria-label="Confidentialité et mentions légales"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-sky-300" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                      Confidentialité & Mentions légales
                    </span>
                  </div>
                </button>

                {/* Dev / Application information */}
                <div className="text-center py-1">
                  <span className="text-[9px] text-white/60 font-bold uppercase tracking-widest">
                    Météo Pure v3.0
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* PURE WEATHER DETAILED DRAWER (EXPANDED ON ARROW CLICK) */}
        {weather && (
          <PureDetailDrawer
            isOpen={showDetailDrawer}
            onClose={() => setShowDetailDrawer(false)}
            cityName={currentCommune.nom}
          >
            <PureDetailedCards
              weather={weather}
              currentCommune={currentCommune}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              todayShare={todayShare}
              frenchDate={frenchDate}
              saintDuJour={saintDuJour}
              currentTime={currentTime}
              staleSince={staleSince}
              refreshing={refreshing}
              currentCode={currentCode}
              isNightTimeNow={isNightTimeNow}
              weatherStyle={weatherStyle}
              ActiveWeatherIcon={ActiveWeatherIcon}
              selectedDayIndex={selectedDayIndex}
              setSelectedDayIndex={setSelectedDayIndex}
              setShowMoonModal={setShowMoonModal}
              airQuality={airQuality}
            />
          </PureDetailDrawer>
        )}

        {/* BOTTOM GLASS NAVIGATION BAR - PERFECT 4-COL PILL DOCK STYLE */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasActiveVigilance={Boolean(weather && weather.vigilance.globalLevel !== 'green')}
        />

      </main>

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
