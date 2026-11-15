import React, { Suspense, useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  X,
  Bell,
  Loader2,
  Navigation,
  CloudLightning,
  AlertCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Sparkles,
  CloudRain,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSaintDuJour } from './utils/ephemeris';
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
import Toggle from './components/ui/Toggle';
import BottomNav, { AppTab } from './components/BottomNav';
import Toast, { ToastData } from './components/Toast';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Pure minimalist components — unified single-page forecast, kept eager.
import CelestialSky, { getSkyTopColor } from './components/pure/CelestialSky';
import ThemeBackdrop from './components/pure/ThemeBackdrop';
import ThemePicker from './components/ui/ThemePicker';
import { useTheme } from './hooks/useTheme';
import { getThemeMeta, getThemePageBackground } from './utils/theme';
import HourlyForecast from './components/HourlyForecast';
import PureWeatherHero from './components/pure/PureWeatherHero';
import PureDetailedCards from './components/pure/PureDetailedCards';

// Lazy-loaded: only fetched when their tab/modal is opened.
const RainRadar = lazyWithRetry(() => import('./components/RainRadar'));
const CityComparison = lazyWithRetry(() => import('./components/CityComparison'));
const AlertsView = lazyWithRetry(() => import('./components/AlertsView'));
const PwaInstallWizard = lazyWithRetry(() => import('./components/PwaInstallWizard'));
const SharePreviewModal = lazyWithRetry(() => import('./components/SharePreviewModal'));
const MorningBriefModal = lazyWithRetry(() => import('./components/modals/MorningBriefModal'));
const MoonPhasesModal = lazyWithRetry(() => import('./components/modals/MoonPhasesModal'));
const WelcomePrompt = lazyWithRetry(() => import('./components/modals/WelcomePrompt'));
const PrivacyPolicy = lazyWithRetry(() => import('./components/PrivacyPolicy'));

/**
 * True from the first time `flag` is true, forever after.
 *
 * Lets a lazily-loaded modal stay unmounted (and its chunk unfetched) until it
 * is first opened, then stay mounted so its own AnimatePresence exit animation
 * still plays on close.
 */
function useMountedOnce(flag: boolean): boolean {
  const [mounted, setMounted] = useState(flag);
  if (flag && !mounted) setMounted(true);
  return mounted;
}

/** Last sky colour, restored by index.html before any JS runs (no blue flash). */
const SKY_COLOR_KEY = 'meteo_pure_sky_color';

const LazyFallback = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
  </div>
);

export default function App() {
  // Navigation & Screen tab state
  const [activeTab, setActiveTab] = useState<AppTab>('meteo');
  const [heroMode, setHeroMode] = useState<'weather' | 'aqi'>('weather');
  const [cartesMode, setCartesMode] = useState<'radar' | 'compare'>('radar');

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

  // Traditional Feast Day lookup (saint du jour) — once per mount, not per render
  // (App re-renders on every weather refresh).
  const saintDuJour = React.useMemo(() => getSaintDuJour(), []);

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

  // Reset selected forecast day whenever the commune changes
  useEffect(() => {
    setSelectedDayIndex(0);
  }, [currentCommune]);

  // Position of the sun in the sky. The hour-by-hour ruler was removed, so the
  // sky always reflects the live hour (stable within a given minute).
  const now = new Date();
  const currentFloatHour = now.getHours() + now.getMinutes() / 60;

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

  const activeWeatherCode = weather?.current.weatherCode ?? 0;
  const {
    showMoonModal, setShowMoonModal,
    showMorningBriefModal, setShowMorningBriefModal,
    aiBrief,
    loadingBrief,
    openMorningBrief,
  } = useMorningBrief();

  // Air quality & pollen — supplementary, never blocks the forecast.
  // Keyed on the commune's own coordinates (identical to weather.latitude /
  // longitude) so it starts in parallel with the forecast instead of waiting
  // for it to land first.
  const [communeLon, communeLat] = currentCommune.centre.coordinates;
  const airQuality = useAirQuality(communeLat, communeLon);

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
      {
        rainNotificationsEnabled: notifSettings.rainNotificationsEnabled,
        stormNotificationsEnabled: notifSettings.stormNotificationsEnabled,
        alertNotificationsEnabled: notifSettings.alertNotificationsEnabled,
        minMinutesBetweenAlerts: notifSettings.minMinutesBetweenAlerts,
        morningBriefEnabled: notifSettings.morningBriefEnabled
      }
    );
  }, [notifSettings.systemEnabled, currentCommune, notifSettings.humorLevel, notifSettings.morningBriefEnabled, notifSettings.rainNotificationsEnabled, notifSettings.stormNotificationsEnabled, notifSettings.alertNotificationsEnabled, notifSettings.minMinutesBetweenAlerts]);

  const handleOpenMorningBrief = () =>
    openMorningBrief(
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
      {
        rainNotificationsEnabled: notifSettings.rainNotificationsEnabled,
        stormNotificationsEnabled: notifSettings.stormNotificationsEnabled,
        alertNotificationsEnabled: notifSettings.alertNotificationsEnabled,
        minMinutesBetweenAlerts: notifSettings.minMinutesBetweenAlerts,
        morningBriefEnabled: notifSettings.morningBriefEnabled
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
    setTheme('auto');
    setNotifSettings(DEFAULT_NOTIFICATION_SETTINGS);
    setNotifLogs([]);
    setFavorites([]);
    setCurrentCommune({
      nom: 'Paris',
      code: '75056',
      codesPostaux: ['75001'],
      centre: { type: 'Point', coordinates: [2.3522, 48.8566] },
      codeDepartement: '75'
    });
    setShowPrivacyPolicy(false);
    setActiveToast({
      id: Math.random().toString(),
      title: "Données supprimées",
      message: "Toutes vos données personnelles ont été effacées de votre appareil et de notre serveur.",
      intensity: "moderate"
    });
  };


  const [theme, setTheme] = useTheme();

  const topSkyColor = React.useMemo(() => {
    if (theme !== 'auto') return getThemeMeta(theme).topColor;
    return getSkyTopColor(currentFloatHour, activeWeatherCode, sunriseFloat, sunsetFloat);
  }, [theme, currentFloatHour, activeWeatherCode, sunriseFloat, sunsetFloat]);

  useEffect(() => {
    const pageBg = getThemePageBackground(theme) ?? topSkyColor;
    document.body.style.background = pageBg;
    document.documentElement.style.background = pageBg;
    document.documentElement.style.backgroundAttachment = 'fixed';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', topSkyColor);
    // Remember the live sky so the first paint of the next visit matches.
    if (weather) {
      try { localStorage.setItem(SKY_COLOR_KEY, topSkyColor); } catch { /* optional */ }
    }
  }, [topSkyColor, weather, theme]);

  // Modals: chunk fetched on first open only, then kept mounted for exit animations.
  const moonModalMounted = useMountedOnce(showMoonModal);
  const briefModalMounted = useMountedOnce(showMorningBriefModal);
  const privacyMounted = useMountedOnce(showPrivacyPolicy);
  const shareModalMounted = useMountedOnce(todayShare.isModalOpen);

  return (
    <div 
      className="h-[100dvh] w-full flex justify-center items-center p-0 sm:p-6 text-white antialiased overflow-hidden"
      style={{ background: getThemePageBackground(theme) ?? topSkyColor }}
    >
      
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

      {/* Container Principal : AUCUNE bordure sur mobile (border-0), bordure uniquement sur desktop (sm:border) */}
      <main
        id="applet-main-frame"
        className="app-shell shadow-2xl"
      >
        
        {/* MOON PHASES MODAL */}
        {moonModalMounted && (
          <Suspense fallback={null}>
            <MoonPhasesModal isOpen={showMoonModal} onClose={() => setShowMoonModal(false)} />
          </Suspense>
        )}

        {/* MORNING BRIEF MODAL (weather-only, no astrology) */}
        {briefModalMounted && (
          <Suspense fallback={null}>
            <MorningBriefModal
              isOpen={showMorningBriefModal}
              onClose={() => setShowMorningBriefModal(false)}
              loadingBrief={loadingBrief}
              aiBrief={aiBrief}
              onOpenSettings={() => {
                setShowMorningBriefModal(false);
                setActiveTab('reglages');
              }}
              cityName={currentCommune?.nom}
              briefSpeech={briefSpeech}
            />
          </Suspense>
        )}

        {/* WELCOME GEOLOCATION PROMPT */}
        {showWelcomePrompt && (
          <Suspense fallback={null}>
            <WelcomePrompt
              isOpen={showWelcomePrompt}
              onDismiss={() => setShowWelcomePrompt(false)}
              onUseLocation={() => {
                setShowWelcomePrompt(false);
                handleGeolocation();
              }}
            />
          </Suspense>
        )}

        {/* PRIVACY POLICY MODAL */}
        <AnimatePresence>
          {privacyMounted && (
            <Suspense fallback={null}>
              <PrivacyPolicy
                isOpen={showPrivacyPolicy}
                onClose={() => setShowPrivacyPolicy(false)}
                onDeleteAllData={handleDeleteAllData}
              />
            </Suspense>
          )}
        </AnimatePresence>

        {/* FLOATING FUNNY TOAST NOTIFICATION */}
        <Toast toast={activeToast} cityName={currentCommune.nom} onDismiss={() => setActiveToast(null)} />
        
        {/* Dynamic Celestial Sky (Sun arc, Moon crescent, Stars, Gradients) */}
        {theme === 'auto' ? (
          <CelestialSky
            hour={currentFloatHour}
            sunriseHour={sunriseFloat}
            sunsetHour={sunsetFloat}
            weatherCode={activeWeatherCode}
          />
        ) : (
          <ThemeBackdrop theme={theme} />
        )}

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
        <div id="main-content" className="flex-1 min-h-0 flex flex-col relative z-10 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            
            {/* SCREEN 1: UNIFIED METEO VIEW (HERO + HOURLY + 7-DAY & DETAILS ON ONE PAGE) */}
            {activeTab === 'meteo' && (
              <motion.div
                key="meteo-tab-screen"
                id="panel-meteo"
                role="tabpanel"
                aria-labelledby="tab-meteo"
                tabIndex={0}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative w-full flex flex-col space-y-3.5 pb-6 focus:outline-none"
              >
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
                      cityName={currentCommune.nom}
                      mode={heroMode}
                      onToggleMode={setHeroMode}
                      airQualityIndex={airQuality?.aqi}
                      airQualityLabel={airQuality?.aqi ? getAqiBand(airQuality.aqi).label : undefined}
                      onOpenBrief={handleOpenMorningBrief}
                      favorites={favorites}
                      onSelectFavorite={setCurrentCommune}
                    />

                    {/* Real hour-by-hour strip for the selected day */}
                    <HourlyForecast
                      hourlyData={
                        selectedDayIndex === 0
                          ? weather.hourly
                          : (weather.daily[selectedDayIndex]?.hourly || [])
                      }
                      humidity={
                        selectedDayIndex === 0
                          ? weather.current.humidity
                          : (weather.daily[selectedDayIndex]?.humidity ?? weather.current.humidity)
                      }
                      dayName={
                        selectedDayIndex === 0
                          ? "Aujourd'hui"
                          : (weather.daily[selectedDayIndex]?.date || 'Sélectionné')
                      }
                      sunrise={
                        selectedDayIndex === 0
                          ? weather.sunrise
                          : (weather.daily[selectedDayIndex]?.sunrise || weather.sunrise)
                      }
                      sunset={
                        selectedDayIndex === 0
                          ? weather.sunset
                          : (weather.daily[selectedDayIndex]?.sunset || weather.sunset)
                      }
                    />

                    {/* All 7-day forecast, daylight gain/loss, hourly & detailed cards on the same page */}
                    <PureDetailedCards
                      weather={weather}
                      currentCommune={currentCommune}
                      favorites={favorites}
                      toggleFavorite={toggleFavorite}
                      todayShare={todayShare}
                      saintDuJour={saintDuJour}
                      staleSince={staleSince}
                      refreshing={refreshing}
                      selectedDayIndex={selectedDayIndex}
                      setSelectedDayIndex={setSelectedDayIndex}
                      setShowMoonModal={setShowMoonModal}
                      airQuality={airQuality}
                      onOpenRadar={() => { setCartesMode('radar'); setActiveTab('cartes'); }}
                    />
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col space-y-4 text-white focus:outline-none pt-2"
              >
                {/* Active City Card */}
                <div className="card flex items-center justify-between">
                  <div>
                    <span className="kicker text-white/60">Ville active</span>
                    <h3 className="text-xl font-bold text-white mt-1">{currentCommune.nom}</h3>
                    <p className="meta">Dép. {currentCommune.codeDepartement}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(currentCommune)}
                    className="icon-btn"
                    title={favorites.some(fav => fav.code === currentCommune.code) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <Star
                      className={`w-5 h-5 ${favorites.some(fav => fav.code === currentCommune.code) ? 'text-amber-400 fill-amber-400' : 'text-white/70 hover:text-white'}`}
                    />
                  </button>
                </div>

                {/* Saved Favorite Cities */}
                <div className="flex-1 flex flex-col space-y-2">
                  <h4 className="kicker text-white/70 flex items-center gap-1.5 pt-2">
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
                          className={`tile w-full cursor-pointer flex items-center justify-between transition-all ${
                            currentCommune.code === fav.code
                              ? 'bg-sky-500/30 border-sky-400/50 shadow-md'
                              : 'hover:bg-white/10'
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
                              className="icon-btn icon-btn--sm"
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

            {/* SCREEN 2: CARTES VIEW (RADAR LIVE & COMPARATEUR) */}
            {activeTab === 'cartes' && (
              <motion.div
                key="cartes-tab-screen"
                id="panel-cartes"
                role="tabpanel"
                aria-labelledby="tab-cartes"
                tabIndex={0}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col space-y-3 text-white focus:outline-none pt-1"
              >
                {/* Segmented Control Radar Live vs Comparateur */}
                <div className="segmented w-full shrink-0">
                  <button
                    onClick={() => setCartesMode('radar')}
                    data-active={cartesMode === 'radar'}
                    className="segmented-item"
                  >
                    <CloudRain className="w-3.5 h-3.5" />
                    <span>Radar pluie live</span>
                  </button>
                  <button
                    onClick={() => setCartesMode('compare')}
                    data-active={cartesMode === 'compare'}
                    className="segmented-item"
                  >
                    <Navigation className="w-3.5 h-3.5 rotate-45" />
                    <span>Comparateur</span>
                  </button>
                </div>

                {/* Sub-view Rendering */}
                {cartesMode === 'radar' ? (
                  weather ? (
                    <Suspense fallback={<LazyFallback />}>
                      <RainRadar
                        latitude={weather.latitude}
                        longitude={weather.longitude}
                        cityName={currentCommune.nom}
                      />
                    </Suspense>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 border border-white/10 rounded-2xl">
                      <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-2" />
                      <p className="text-xs text-white/60">Chargement du radar des pluies...</p>
                    </div>
                  )
                ) : (
                  weather ? (
                    <Suspense fallback={<LazyFallback />}>
                      <CityComparison
                        currentCommune={currentCommune}
                        currentWeather={weather}
                      />
                    </Suspense>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-white/5 border border-white/10 rounded-2xl">
                      <Loader2 className="w-8 h-8 animate-spin text-sky-400 mb-2" />
                      <p className="text-xs text-white/60">Chargement du comparateur de villes...</p>
                    </div>
                  )
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
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
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col text-white space-y-4 pb-6 focus:outline-none"
              >
                {/* Apparence */}
                <section className="card space-y-3">
                  <div>
                    <h2 className="kicker">Apparence</h2>
                    <p className="meta mt-0.5">Choisissez l'ambiance de l'application.</p>
                  </div>
                  <ThemePicker value={theme} onChange={setTheme} />
                </section>

                {/* Alert settings */}
                <section className="card space-y-4">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                    <div className="w-9 h-9 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
                      <Bell className="w-[18px] h-[18px] text-sky-300" />
                    </div>
                    <div>
                      <h2 className="kicker text-sky-200">Alertes & notifications</h2>
                      <p className="meta mt-0.5">Pluie, orages, vigilance et brief matinal.</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {/* 1. System Push toggle */}
                    <div className="tile flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-white flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-sky-400" /> Notifications en arrière-plan
                        </h3>
                        <p className="meta mt-1">
                          Recevez les alertes même téléphone verrouillé ou application fermée.
                        </p>
                      </div>
                      <Toggle
                        checked={notifSettings.systemEnabled}
                        onChange={handleToggleSystemNotifications}
                        label="Notifications en arrière-plan"
                      />
                    </div>

                    {/* Helper tips */}
                    <div className="rounded-2xl bg-black/25 border border-white/5 p-3 space-y-2 text-[11px] leading-relaxed text-white/65">
                      <p>
                        <strong className="text-white">Fonctionnement :</strong> votre abonnement est stocké sur notre serveur. Toutes les <strong className="text-white">10 minutes</strong>, il interroge les API météo de votre commune et déclenche une alerte si le temps change nettement.
                      </p>
                      <p>
                        <strong className="text-white">Conseil PWA :</strong> sur mobile, installez l'application sur l'écran d'accueil pour un fonctionnement fiable en arrière-plan.
                      </p>
                      {window.self !== window.top && (
                        <p className="text-amber-200/90">
                          <strong className="text-amber-200">Aperçu :</strong> le navigateur bloque les notifications dans cette fenêtre.{' '}
                          <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="text-sky-300 underline hover:text-sky-200">
                            Ouvrir en plein écran
                          </a>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    {!notifSettings.systemEnabled && (
                      <p className="meta px-1">
                        Activez d'abord les notifications en arrière-plan pour régler ces catégories.
                      </p>
                    )}
                    <div className={`tile flex items-center gap-3 transition-opacity duration-300 ${!notifSettings.systemEnabled ? 'opacity-60' : ''}`}>
                      <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center shrink-0">
                        <CloudRain className="w-4 h-4 text-sky-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-white">Pluies & averses</h3>
                        <p className="meta">Crachins, déluges et accalmies.</p>
                      </div>
                      <Toggle
                        checked={notifSettings.rainNotificationsEnabled !== false}
                        onChange={handleToggleRainNotifications}
                        label="Notifications pluie"
                        disabled={!notifSettings.systemEnabled}
                      />
                    </div>

                    <div className={`tile flex items-center gap-3 transition-opacity duration-300 ${!notifSettings.systemEnabled ? 'opacity-60' : ''}`}>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center shrink-0">
                        <CloudLightning className="w-4 h-4 text-amber-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-white">Orages & tempêtes</h3>
                        <p className="meta">Foudre et fin d'orage.</p>
                      </div>
                      <Toggle
                        checked={notifSettings.stormNotificationsEnabled !== false}
                        onChange={handleToggleStormNotifications}
                        label="Notifications orages"
                        activeColorClass="bg-amber-500"
                        disabled={!notifSettings.systemEnabled}
                      />
                    </div>

                    <div className={`tile flex items-center gap-3 transition-opacity duration-300 ${!notifSettings.systemEnabled ? 'opacity-60' : ''}`}>
                      <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-400/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-rose-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-bold text-white">Alertes de vigilance</h3>
                        <p className="meta">Niveaux estimés d'après les prévisions.</p>
                      </div>
                      <Toggle
                        checked={notifSettings.alertNotificationsEnabled !== false}
                        onChange={handleToggleAlertNotifications}
                        label="Notifications vigilance"
                        activeColorClass="bg-rose-500"
                        disabled={!notifSettings.systemEnabled}
                      />
                    </div>
                  </div>

                  {/* Humor level — drives every notification and brief punchline */}
                  <div className="space-y-2 pt-1">
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Ton des messages
                    </h3>
                    <div className="segmented" role="group" aria-label="Ton des messages">
                      {([
                        ['safe', 'Sobre'],
                        ['spicy', 'Taquin'],
                        ['vulgar', 'Sans filtre'],
                      ] as const).map(([level, label]) => (
                        <button
                          key={level}
                          type="button"
                          data-active={notifSettings.humorLevel === level}
                          aria-pressed={notifSettings.humorLevel === level}
                          onClick={() => {
                            const updated = { ...notifSettings, humorLevel: level };
                            setNotifSettings(updated);
                            saveNotificationSettings(updated);
                          }}
                          className="segmented-item"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                {/* Morning brief (weather only) */}
                <section className="card space-y-3">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-[18px] h-[18px] text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="kicker text-amber-200">Brief matinal</h2>
                      <p className="meta mt-0.5">La météo du jour, puis une phrase pour démarrer.</p>
                    </div>
                    <Toggle
                      checked={notifSettings.morningBriefEnabled !== false}
                      onChange={() => {
                        const updated = { ...notifSettings, morningBriefEnabled: notifSettings.morningBriefEnabled === false };
                        setNotifSettings(updated);
                        saveNotificationSettings(updated);
                      }}
                      label="Brief matinal quotidien"
                      activeColorClass="bg-amber-500"
                    />
                  </div>

                  <p className="text-[12px] leading-relaxed text-white/75">
                    Chaque matin entre 6h et 10h : température, pluie, vent et conseil pratique, suivis d'une courte phrase générée par IA. Sans astrologie, sans date de naissance.
                  </p>

                  <button
                    type="button"
                    onClick={handleOpenMorningBrief}
                    disabled={!weather}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-300 text-[12px] font-bold text-amber-950 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-900" />
                    <span>Lire / écouter le brief du jour</span>
                  </button>
                </section>

                {/* Section de Test des Notifications — admin only */}
                {isAdmin && (
                <section className="card space-y-3">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                    <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                      <Sparkles className="w-[18px] h-[18px] text-amber-300" />
                    </div>
                    <div>
                      <h2 className="kicker text-amber-200">Labo de test</h2>
                      <p className="meta mt-0.5">Validez les notifications locales et serveur.</p>
                    </div>
                  </div>

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
                      <span className="text-[11px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
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
                      <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
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
                      <span className="text-[11px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-md font-mono font-bold">
                        CRON
                      </span>
                    </button>
                  </div>
                </section>
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
                  className="card text-center hover:bg-white/10 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-sky-400/60 w-full"
                  aria-label="Confidentialité et mentions légales"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-sky-300" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/70">
                      Confidentialité & Mentions légales
                    </span>
                  </div>
                </button>

                {/* Dev / Application information */}
                <div className="text-center py-1">
                  <span className="text-[11px] text-white/60 font-bold uppercase tracking-widest">
                    Météo Pure v3.0
                  </span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* BOTTOM GLASS NAVIGATION BAR - PERFECT 4-COL PILL DOCK STYLE */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          hasActiveVigilance={Boolean(weather && weather.vigilance.globalLevel !== 'green')}
        />

      </main>

      {/* Share today's weather as PNG */}
      {shareModalMounted && (
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
      )}
    </div>
  );
}
