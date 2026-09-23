import { RainInTheHour } from '../types';

/**
 * Types representing notification configurations and history logs
 */
export type HumorLevel = 'safe' | 'spicy' | 'vulgar';

export type NotificationIntensity = 'light' | 'moderate' | 'heavy' | 'thunderstorm' | 'end_rain' | 'end_storm' | 'alert_yellow' | 'alert_orange' | 'alert_red' | 'heatwave';

export interface NotificationLog {
  id: string;
  timestamp: string;
  city: string;
  title: string;
  message: string;
  intensity: NotificationIntensity;
}

export interface NotificationSettings {
  systemEnabled: boolean;
  humorLevel: HumorLevel;
  minMinutesBetweenAlerts: number; // to avoid spamming
  rainNotificationsEnabled?: boolean;
  stormNotificationsEnabled?: boolean;
  alertNotificationsEnabled?: boolean;
  birthDate?: string;
}

// Default settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  systemEnabled: false,
  humorLevel: 'safe',
  minMinutesBetweenAlerts: 30,
  rainNotificationsEnabled: true,
  stormNotificationsEnabled: true,
  alertNotificationsEnabled: true,
  birthDate: '',
};

/**
 * Clear, polite and actionable weather alert messages in French
 */
const RAIN_MESSAGES: Record<
  NotificationIntensity,
  Record<HumorLevel, string[]>
> = {
  light: {
    safe: [
      "Un léger crachin s'annonce d'ici quelques minutes. Pensez à votre capuche !",
      "Quelques gouttes arrivent. Rien de bien méchant, mais restez prévoyants.",
      "Légère bruine en approche. Gardez votre imperméable à portée de main.",
      "Un petit passage pluvieux est prévu dans votre secteur.",
      "Le ciel commence à s'humidifier doucement. Prévoyez de quoi vous couvrir."
    ],
    spicy: [
      "Petite bruine à l'horizon ! N'oubliez pas votre parapluie d'appoint.",
      "Quelques gouttes s'invitent au programme. Restez bien au sec !",
      "Légère ondée en vue. Un bon prétexte pour une pause bien au chaud."
    ],
    vulgar: [
      "Un petit crachin s'annonce d'ici quelques minutes. Pensez à votre capuche !",
      "Quelques gouttes arrivent. Rien de bien méchant, mais restez prévoyants."
    ]
  },
  moderate: {
    safe: [
      "Une averse modérée approche. Il est temps d'ouvrir les parapluies !",
      "Une vraie ondée se prépare d'ici quelques minutes. Prévoyez un abri.",
      "Pluie rythmée en chemin. Sortez votre imperméable.",
      "Averses confirmées sur votre secteur. Prenez vos précautions pour rester au sec.",
      "Un passage pluvieux régulier commence bientôt. Restez prudents sur la route."
    ],
    spicy: [
      "Alerte averse ! Sortez bien équipés, la pluie s'intensifie.",
      "Une bonne ondée arrive pour rafraîchir l'atmosphère. À vos parapluies !"
    ],
    vulgar: [
      "Une averse modérée approche. Il est temps d'ouvrir les parapluies !",
      "Averses confirmées sur votre secteur. Prenez vos précautions pour rester au sec."
    ]
  },
  heavy: {
    safe: [
      "ALERTE DÉLUGE ! De très fortes averses arrivent d'ici quelques minutes. Mettez-vous à l'abri !",
      "Précipitations intenses en approche. Attention aux flaques et aux chaussées glissantes.",
      "Le ciel déverse de fortes trombes d'eau. Mettez-vous au sec rapidement.",
      "Averses torrentielles imminentes. Évitez les déplacements non nécessaires.",
      "Fortes pluies confirmées. Prenez toutes vos précautions pour rester en sécurité."
    ],
    spicy: [
      "Fortes averses imminentes ! Sortez les grands manteaux ou restez bien au chaud.",
      "Précipitations très intenses en vue : prudence et restez bien abrités !"
    ],
    vulgar: [
      "ALERTE DÉLUGE ! De très fortes averses arrivent d'ici quelques minutes. Mettez-vous à l'abri !",
      "Précipitations intenses en approche. Attention aux flaques et aux chaussées glissantes."
    ]
  },
  thunderstorm: {
    safe: [
      "ALERTE ORAGE ! Tonnerre et éclairs prévus d'ici peu. Mettez-vous d'urgence à l'abri !",
      "Activité orageuse en approche. Évitez les arbres isolés et les zones découvertes.",
      "Risque d'orage et de foudre imminent. Abritez-vous dans un bâtiment en dur.",
      "Le ciel va gronder fortement. Débranchez les appareils sensibles si nécessaire.",
      "Atmosphère électrique en vue. Soyez très prudents lors de vos déplacements."
    ],
    spicy: [
      "Alerte coup de foudre ! L'orage gronde, mettez-vous vite au sec et en sécurité.",
      "Activité électrique imminente ! Restez bien abrités le temps que l'orage passe."
    ],
    vulgar: [
      "ALERTE ORAGE ! Tonnerre et éclairs prévus d'ici peu. Mettez-vous d'urgence à l'abri !",
      "Activité orageuse en approche. Évitez les arbres isolés et les zones découvertes."
    ]
  },
  end_rain: {
    safe: [
      "La pluie s'est arrêtée. Les nuages se dissipent doucement.",
      "Fin de l'averse. Le soleil devrait refaire son apparition très bientôt !",
      "Le temps redevient sec, vous pouvez ranger votre parapluie."
    ],
    spicy: [
      "Le temps redevient sec ! Profitez des belles éclaircies.",
      "Fin de l'averse : vous pouvez refermer les parapluies !"
    ],
    vulgar: [
      "La pluie s'est arrêtée. Les nuages se dissipent doucement.",
      "Fin de l'averse. Le temps redevient sec !"
    ]
  },
  end_storm: {
    safe: [
      "L'activité orageuse se calme et s'éloigne.",
      "Le tonnerre cesse de gronder. Le risque électrique s'estompe.",
      "Retour au calme après l'orage. Prenez soin de vous."
    ],
    spicy: [
      "L'orage s'éloigne enfin. Le calme et la sérénité reviennent !",
      "Menace d'orage écartée, le ciel s'apaise."
    ],
    vulgar: [
      "L'activité orageuse se calme et s'éloigne.",
      "Retour au calme après l'orage."
    ]
  },
  alert_yellow: {
    safe: [
      "Mise en place d'une vigilance jaune de Météo-France. Soyez attentifs lors de vos déplacements.",
      "Vigilance jaune déclarée pour votre secteur. Tenez-vous au courant de l'évolution de la situation.",
      "Alerte de niveau jaune. Des phénomènes météo habituels mais localement dangereux sont possibles."
    ],
    spicy: [
      "Vigilance jaune activée par Météo-France. Restez prudents dehors !",
      "Alerte jaune : restez attentifs à l'évolution des conditions météo."
    ],
    vulgar: [
      "Mise en place d'une vigilance jaune de Météo-France. Soyez attentifs lors de vos déplacements."
    ]
  },
  alert_orange: {
    safe: [
      "Vigilance Orange : phénomènes météo très dangereux prévus. Soyez extrêmement vigilants !",
      "Alerte orange déclarée. Évitez les déplacements non indispensables et les activités extérieures.",
      "Météo-France conseille la plus grande vigilance. Suivez scrupuleusement les consignes de sécurité."
    ],
    spicy: [
      "Alerte Orange Météo-France ! Conditions météo délicates, limitez vos sorties au strict nécessaire.",
      "Vigilance orange active : mettez vos biens à l'abri et restez prudents."
    ],
    vulgar: [
      "Vigilance Orange : phénomènes météo très dangereux prévus. Soyez extrêmement vigilants !",
      "Alerte orange déclarée. Évitez les déplacements non indispensables."
    ]
  },
  alert_red: {
    safe: [
      "ALERTE ROUGE VIGILANCE ABSOLUE : Phénomènes météorologiques d'intensité exceptionnelle en cours ou prévus.",
      "Danger extrême déclaré. Restez impérativement à l'abri, ne vous déplacez sous aucun prétexte.",
      "Météo-France alerte de dangers majeurs pour la sécurité des personnes. Respectez les consignes des autorités."
    ],
    spicy: [
      "VIGILANCE ROUGE ABSOLUE : Danger météorologique majeur. Restez impérativement en sécurité chez vous !",
      "Alerte rouge maximale. Protégez-vous et respectez scrupuleusement les ordres de sécurité."
    ],
    vulgar: [
      "ALERTE ROUGE VIGILANCE ABSOLUE : Phénomènes météorologiques d'intensité exceptionnelle en cours ou prévus.",
      "Danger extrême déclaré. Restez impérativement à l'abri."
    ]
  },
  heatwave: {
    safe: [
      "La température dépasse les 30°C. Hydratez-vous régulièrement et privilégiez les endroits frais.",
      "Alerte forte chaleur déclarée. Pensez à limiter vos efforts physiques aux heures les plus chaudes.",
      "Il fait très chaud aujourd'hui ! Restez au frais autant que possible et prenez des nouvelles de vos proches."
    ],
    spicy: [
      "Plus de 30°C au thermomètre ! Pensez à boire de l'eau fraîche et à garder les pièces ombragées.",
      "Forte chaleur en cours : chapeau, eau et crème solaire de rigueur !"
    ],
    vulgar: [
      "La température dépasse les 30°C. Hydratez-vous régulièrement et privilégiez les endroits frais."
    ]
  }
};

const ALERT_TITLES: Record<HumorLevel, string[]> = {
  safe: [
    "💧 Alerte Pluie",
    "🌧️ Ondée en approche",
    "🌂 Sortez les parapluies",
    "💦 Averse imminente",
    "🌤️ Changement de temps"
  ],
  spicy: [
    "🌧️ Alerte Ondée !",
    "☔ Sortez couverts !",
    "👀 Pluie en approche",
    "💧 À vos parapluies !"
  ],
  vulgar: [
    "💧 Alerte Pluie",
    "🌧️ Ondée en approche"
  ]
};

const THUNDERSTORM_TITLES: Record<HumorLevel, string[]> = {
  safe: [
    "⚡ Alerte Orage",
    "⛈️ Le ciel va gronder",
    "🔌 Appareils en sécurité",
    "🏠 Alerte Foudre",
    "⛈️ Éclairs imminents"
  ],
  spicy: [
    "⚡ Risque d'Orage !",
    "⛈️ Tonnerre en approche !",
    "🏠 Abritez-vous !"
  ],
  vulgar: [
    "⚡ Alerte Orage",
    "⛈️ Activité orageuse"
  ]
};

const END_RAIN_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🌤️ Fin de la pluie", "☀️ Retour des éclaircies", "💧 Fin de l'ondée"],
  spicy: ["🌤️ Retour au sec !", "🕶️ Rangez les parapluies", "☀️ Le ciel se dégage"],
  vulgar: ["🌤️ Fin de la pluie", "☀️ Retour des éclaircies"]
};

const END_STORM_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🌩️ Fin de l'orage", "⚡ Menace de foudre écartée", "⛈️ Calme revenu"],
  spicy: ["🌩️ L'orage s'éloigne", "🛡️ Menace électrique écartée", "🌤️ Calme retrouvé !"],
  vulgar: ["🌩️ Fin de l'orage", "⛈️ Calme revenu"]
};

const ALERT_YELLOW_TITLES: Record<HumorLevel, string[]> = {
  safe: ["⚠️ Vigilance Jaune", "🔔 Soyez attentifs", "👀 Risque météo local"],
  spicy: ["⚠️ Vigilance Jaune Météo", "🔔 Prudence dehors", "👀 Météo à surveiller"],
  vulgar: ["⚠️ Vigilance Jaune", "🔔 Soyez attentifs"]
};

const ALERT_ORANGE_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🟠 Vigilance Orange", "🚨 Soyez très vigilants", "⚠️ Alerte Météo-France"],
  spicy: ["🟠 Vigilance Orange : Prudence renforcée", "🚨 Alerte météo importante", "⚠️ Restez bien vigilants"],
  vulgar: ["🟠 Vigilance Orange", "🚨 Soyez très vigilants"]
};

const ALERT_RED_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🔴 VIGILANCE ROUGE ABSOLUE", "🚨 DANGER TRÈS GRAND", "⛔ Alerte météo maximale"],
  spicy: ["🔴 ALERTE ROUGE : Danger exceptionnel", "🚨 Vigilance Rouge absolue", "⛔ Restez impérativement à l'abri"],
  vulgar: ["🔴 VIGILANCE ROUGE ABSOLUE", "🚨 DANGER TRÈS GRAND"]
};

const HEATWAVE_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🌡️ Alerte Forte Chaleur", "☀️ Plus de 30°C", "💧 Hydratez-vous bien"],
  spicy: ["🌡️ Pic de Chaleur !", "☀️ Soleil et fortes températures", "💧 Restez au frais !"],
  vulgar: ["🌡️ Alerte Forte Chaleur", "☀️ Plus de 30°C"]
};

/**
 * Get a clear and helpful weather alert message based on intensity and requested level
 * @param intensity The rain level ('light', 'moderate', 'heavy', 'thunderstorm', etc.)
 * @param level Tone preference ('safe', 'spicy', 'vulgar')
 */
export function getFunnyRainMessage(
  intensity: NotificationIntensity,
  level: HumorLevel = 'safe',
  excludeMessageIndex?: number
): { title: string, message: string, messageIndex: number } {
  const chosenMessages = RAIN_MESSAGES[intensity];
  
  let chosenTitlesMap = ALERT_TITLES;
  if (intensity === 'thunderstorm') {
    chosenTitlesMap = THUNDERSTORM_TITLES;
  } else if (intensity === 'end_rain') {
    chosenTitlesMap = END_RAIN_TITLES;
  } else if (intensity === 'end_storm') {
    chosenTitlesMap = END_STORM_TITLES;
  } else if (intensity === 'alert_yellow') {
    chosenTitlesMap = ALERT_YELLOW_TITLES;
  } else if (intensity === 'alert_orange') {
    chosenTitlesMap = ALERT_ORANGE_TITLES;
  } else if (intensity === 'alert_red') {
    chosenTitlesMap = ALERT_RED_TITLES;
  } else if (intensity === 'heatwave') {
    chosenTitlesMap = HEATWAVE_TITLES;
  }

  const effectiveLevel: HumorLevel = (level && chosenMessages?.[level]?.length) ? level : 'safe';
  const messages = chosenMessages?.[effectiveLevel] || chosenMessages?.safe || ["Le temps change."];
  const titles = chosenTitlesMap?.[effectiveLevel] || chosenTitlesMap?.safe || ["Alerte Météo"];
  
  let messageIndex = Math.floor(Math.random() * (messages.length || 1));
  if (messages.length > 1 && messageIndex === excludeMessageIndex) {
    messageIndex = (messageIndex + 1) % messages.length;
  }
  const randomTitleIndex = Math.floor(Math.random() * (titles.length || 1));
  
  return {
    title: titles[randomTitleIndex] || "Alerte Météo",
    message: messages[messageIndex] || "Le temps change.",
    messageIndex
  };
}

/**
 * Analyze the next hour's rain forecast and determine if a rain alert should be fired.
 * Imminent rain is defined as having intense rain inside the 0-60 minutes window.
 */
export function detectImminentRain(rainData: RainInTheHour[]): { shouldAlert: boolean; intensity: 'light' | 'moderate' | 'heavy'; minutes: number } | null {
  if (!rainData || rainData.length === 0) return null;
  
  // Find the first interval with a precipitation forecast
  for (const item of rainData) {
    if (item.intensity !== 'none' && item.percentage > 15) {
      let mappedIntensity: 'light' | 'moderate' | 'heavy' = 'light';
      if (item.intensity === 'heavy') mappedIntensity = 'heavy';
      else if (item.intensity === 'moderate') mappedIntensity = 'moderate';
      
      return {
        shouldAlert: true,
        intensity: mappedIntensity,
        minutes: item.minutes
      };
    }
  }
  
  return null;
}

/**
 * Persistently save and load user notification settings and history log
 */
const SETTINGS_KEY = 'meteo_pure_notif_settings';
const LOG_KEY = 'meteo_pure_notif_log';
const LAST_ALERT_TIME_KEY = 'meteo_pure_last_alert_time';

export function loadNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to load notification settings', error);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings', error);
  }
}

export function loadNotificationLogs(): NotificationLog[] {
  try {
    const saved = localStorage.getItem(LOG_KEY);
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.error('Failed to load notification logs', error);
  }
  return [];
}

export function saveNotificationLogs(logs: NotificationLog[]): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 40))); // Keep last 40 entries
  } catch (error) {
    console.error('Failed to save notification logs', error);
  }
}

/**
 * Checks if enough time has passed since the last alert to avoid spamming the user.
 */
export function isSpamProtected(minMinutes: number): boolean {
  try {
    const lastAlert = localStorage.getItem(LAST_ALERT_TIME_KEY);
    if (!lastAlert) return false;
    const lastTimestamp = parseInt(lastAlert, 10);
    const now = Date.now();
    const minutesSince = (now - lastTimestamp) / (1000 * 60);
    return minutesSince < minMinutes;
  } catch {
    return false;
  }
}

export function updateLastAlertTime(): void {
  localStorage.setItem(LAST_ALERT_TIME_KEY, Date.now().toString());
}

/**
 * Fire an operating system / browser level notification if supported & permission allowed
 */
export async function checkAndFireFullMoonNotification(humorLevel: HumorLevel = 'spicy'): Promise<void> {
  const LAST_MOON_ALERT_KEY = 'meteo_pure_last_moon_alert';
  
  // We only want to notify once per full moon. We can store the date string of the last alert.
  const todayStr = new Date().toISOString().split('T')[0];
  const lastAlert = localStorage.getItem(LAST_MOON_ALERT_KEY);
  
  if (lastAlert === todayStr) return; // Already alerted today

  // Check if today is a full moon
  const LUNAR_MONTH = 29.53058867;
  const NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  const diffMs = Date.now() - NEW_MOON.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const phase = (diffDays % LUNAR_MONTH) / LUNAR_MONTH;
  const normalizedPhase = phase < 0 ? phase + 1 : phase;

  // Assuming full moon is between 0.47 and 0.53
  const isFullMoon = normalizedPhase >= 0.47 && normalizedPhase <= 0.53;

  if (isFullMoon) {
    // Only fire in the morning (e.g. between 6 AM and 11 AM)
    const hour = new Date().getHours();
    if (hour >= 6 && hour <= 11) {
      
      let title = "🌕 Pleine Lune ce soir";
      let body = "La pleine lune éclairera le ciel nocturne de ce soir. Profitez de ce spectacle !";

      if (humorLevel === 'safe' || humorLevel === 'vulgar') {
        title = "🌕 Pleine lune ce soir";
        body = "La pleine lune éclairera la nuit de ce soir. Profitez-en pour admirer le ciel !";
      } else if (humorLevel === 'spicy') {
        title = "🌕 Pleine Lune Étincelante";
        body = "Une magnifique pleine lune s'invite dans le ciel ce soir. Levez les yeux et profitez du spectacle !";
      }

      const delivered = await fireSystemNotification(title, body);
      if (delivered) {
        localStorage.setItem(LAST_MOON_ALERT_KEY, todayStr);
      }
    }
  }
}

export function getZodiacSign(dateStr: string): string {
  if (!dateStr) return 'Inconnu';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Inconnu';
  
  const d = date.getDate();
  const m = date.getMonth() + 1; // 1-12
  
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'Bélier';
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'Taureau';
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'Gémeaux';
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'Cancer';
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'Lion';
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'Vierge';
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'Balance';
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'Scorpion';
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'Sagittaire';
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'Capricorne';
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'Verseau';
  if ((m === 2 && d >= 19) || (m === 3 && d <= 20)) return 'Poissons';
  return 'Inconnu';
}

export function getDaysUntilChristmas(now: Date): number {
  const currentYear = now.getFullYear();
  let christmasDate = new Date(currentYear, 11, 25, 0, 0, 0, 0); // Dec 25
  
  // If we are already on or past Christmas Day of this year, calculate for next year
  if (now.getTime() > christmasDate.getTime()) {
    christmasDate = new Date(currentYear + 1, 11, 25, 0, 0, 0, 0);
  }
  
  // Calculate difference in days
  const diffTime = christmasDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getSarcasticChristmasCountdownMessage(now: Date, humorLevel: HumorLevel = 'safe'): { title: string, body: string } {
  const days = getDaysUntilChristmas(now);
  
  const titleTemplates: Record<HumorLevel, string[]> = {
    safe: [
      `🎄 Compte à rebours : J-${days} avant Noël !`,
      `🎅 Décompte des fêtes : encore ${days} jours avant Noël`,
      `🎁 J-${days} : La magie de Noël se prépare doucement`
    ],
    spicy: [
      `🎄 J-${days} avant Noël ! L'ambiance des fêtes approche`,
      `🎅 Déjà J-${days} avant les fêtes de fin d'année !`,
      `✨ J-${days} avant Noël : préparez vos listes de cadeaux`
    ],
    vulgar: [
      `🎄 Compte à rebours : J-${days} avant Noël !`,
      `🎅 Décompte des fêtes : encore ${days} jours avant Noël`
    ]
  };

  const bodyTemplates: Record<HumorLevel, string[]> = {
    safe: [
      `Encore ${days} jours avant les fêtes. L'occasion idéale pour commencer à préparer ses idées de cadeaux et de moments en famille !`,
      `Le temps passe vite : plus que ${days} jours avant de fêter Noël. Profitez des préparatifs !`,
      `Déjà J-${days} avant le réveillon. Un bon rappel pour planifier vos repas et vos retrouvailles chaleureuses.`
    ],
    spicy: [
      `Plus que ${days} jours avant Noël ! Avez-vous commencé à noter vos meilleures idées de cadeaux ?`,
      `Le compte à rebours continue : J-${days} avant le grand soir ! L'esprit des fêtes s'installe doucement.`,
      `J-${days} ! C'est le moment idéal pour anticiper les fêtes de fin d'année en toute sérénité.`
    ],
    vulgar: [
      `Encore ${days} jours avant les fêtes. Profitez des préparatifs !`
    ]
  };

  const titles = titleTemplates[humorLevel] || titleTemplates['safe'];
  const bodies = bodyTemplates[humorLevel] || bodyTemplates['safe'];

  const idx = now.getMonth() % titles.length;

  return {
    title: titles[idx],
    body: bodies[idx]
  };
}

export function getMonthlyChristmasCountdown(now: Date, humorLevel: HumorLevel): { title: string; body: string } {
  const days = getDaysUntilChristmas(now);
  const month = now.getMonth(); // 0 = janvier

  // Titres : punchline courte avec le compte J-X
  const titles: Record<HumorLevel, string[]> = {
    safe: [
      `🎄 Janvier : plus que ${days} jours avant Noël`,
      `🎄 Février : ${days} jours pour préparer Noël`,
      `🌷 Mars : ${days} jours avant les fêtes`,
      `🐣 Avril : encore ${days} jours avant Noël`,
      `☀️ Mai fleuri, ${days} jours avant Noël`,
      `🏖️ Juin : ${days} jours avant la hotte`,
      `🌞 Mi-chemin ! ${days} jours avant Noël`,
      `🌴 Août : ${days} jours avant les fêtes`,
      `🍂 Septembre sonne : J-${days} pour Noël`,
      `🎃 Octobre : ${days} jours avant Noël`,
      `🍁 Novembre : J-${days} avant Noël !`,
      `🔔 Décembre : Noël dans ${days} jours !`,
    ],
    spicy: [
      `🎄 Nouvelle année lancée : ${days} jours avant Noël`,
      `💘 Février doux, ${days} jours avant les fêtes`,
      `🌷 Le printemps arrive et déjà ${days} jours jusqu'à Noël`,
      `🐣 Avril : ${days} jours avant le grand réveillon`,
      `☀️ Mai au soleil : ${days} jours pour anticiper`,
      `🏖️ Juin : ${days} jours avant la magie de l'hiver`,
      `🌞 Mi-parcours de l'année : ${days} jours avant Noël`,
      `🌴 Bel été ! Dans ${days} jours, place aux illuminations`,
      `🍂 Rentrée de septembre : plus que ${days} jours pour Noël`,
      `🎃 Octobre festif : encore ${days} jours avant les fêtes`,
      `🍁 Novembre s'illumine : ${days} jours avant le réveillon`,
      `🔔 Décembre en fête : plus que ${days} jours avant Noël !`,
    ],
    vulgar: [
      `🎄 Janvier : plus que ${days} jours avant Noël`,
      `🎄 Février : ${days} jours pour préparer Noël`,
      `🌷 Mars : ${days} jours avant les fêtes`,
      `🐣 Avril : encore ${days} jours avant Noël`,
      `☀️ Mai fleuri, ${days} jours avant Noël`,
      `🏖️ Juin : ${days} jours avant la hotte`,
      `🌞 Mi-chemin ! ${days} jours avant Noël`,
      `🌴 Août : ${days} jours avant les fêtes`,
      `🍂 Septembre sonne : J-${days} pour Noël`,
      `🎃 Octobre : ${days} jours avant Noël`,
      `🍁 Novembre : J-${days} avant Noël !`,
      `🔔 Décembre : Noël dans ${days} jours !`,
    ],
  };

  // Corps : contexte du mois
  const bodies: Record<HumorLevel, string[]> = {
    safe: [
      `La nouvelle année commence et les mois défilent vite. ${days} jours pour anticiper sereinement les fêtes !`,
      `Février file vite. ${days} jours pour noter vos envies et vos idées pour la fin de l'année.`,
      `Le printemps s'installe doucement. Plus que ${days} jours avant les fêtes de Noël.`,
      `Encore ${days} jours avant le réveillon. Profitez du printemps qui s'épanouit !`,
      `Le mois de mai ouvre la belle saison. ${days} jours pour préparer l'hiver en douceur.`,
      `L'été arrive ! Dans ${days} jours, nous célébrerons Noël. Profitez du soleil en attendant.`,
      `À mi-chemin entre deux Noëls : ${days} jours exactement nous séparent de la fête.`,
      `Bonne détente estivale. Noël arrive dans ${days} jours, profitez bien des beaux jours !`,
      `La rentrée est là et Noël dans ${days} jours. Le temps passe vite !`,
      `Les premières décorations font leur apparition. Plus que ${days} jours avant Noël.`,
      `Novembre et ses premières lumières festives : Noël arrive dans ${days} jours.`,
      `Le compte à rebours final est lancé : ${days} jours et Noël est enfin là !`,
    ],
    spicy: [
      `La nouvelle année commence et Noël pointe déjà son nez. ${days} jours pour anticiper vos projets !`,
      `${days} jours pour réfléchir à de jolis cadeaux originaux pour vos proches.`,
      `${days} jours : le temps de voir fleurir le printemps avant de retrouver l'hiver en fête.`,
      `Noël dans ${days} jours. Prenez le temps de savourer chaque saison qui passe !`,
      `Encore ${days} jours avant les illuminations de décembre. Profitez des journées ensoleillées !`,
      `${days} jours sous le soleil avant de préparer les festivités d'hiver.`,
      `${days} jours : nous sommes officiellement à la moitié du compte à rebours annuel !`,
      `${days} jours depuis la plage ou la terrasse. Les projets de fin d'année se profilent doucement.`,
      `Rentrée de septembre : plus que ${days} jours pour préparer vos fêtes préférées.`,
      `Octobre s'installe doucement : encore ${days} jours avant l'ambiance des fêtes.`,
      `${days} jours avant les réjouissances. Commencez vos emplettes en toute tranquillité !`,
      `Plus que ${days} jours : les préparatifs battent leur plein, joyeuses fêtes à venir !`,
    ],
    vulgar: [
      `La nouvelle année commence. ${days} jours pour anticiper sereinement les fêtes !`,
      `Février file vite. ${days} jours pour noter vos envies pour la fin de l'année.`,
      `Le printemps s'installe doucement. Plus que ${days} jours avant Noël.`,
      `Encore ${days} jours avant le réveillon. Profitez du printemps !`,
      `Le mois de mai ouvre la belle saison. ${days} jours avant Noël.`,
      `L'été arrive ! Dans ${days} jours, nous célébrerons Noël.`,
      `À mi-chemin entre deux Noëls : ${days} jours nous séparent de la fête.`,
      `Bonne détente estivale. Noël arrive dans ${days} jours !`,
      `La rentrée est là et Noël dans ${days} jours.`,
      `Plus que ${days} jours avant Noël.`,
      `Novembre et ses premières lumières festives : Noël arrive dans ${days} jours.`,
      `Le compte à rebours final est lancé : ${days} jours et Noël est là !`,
    ],
  };

  const t = titles[humorLevel] ?? titles.safe;
  const b = bodies[humorLevel] ?? bodies.safe;

  return { title: t[month], body: b[month] };
}

export function getMorningBriefContent(humorLevel: HumorLevel, birthDate: string, weatherCode: number): { title: string, body: string } | null {
  const sign = getZodiacSign(birthDate);
  if (sign === 'Inconnu') return null;

  const isRaining = [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode);
  const isStorming = [95, 96, 99].includes(weatherCode);
  const isSunny = [0, 1].includes(weatherCode);
  const weatherType = isStorming ? 'storm' : isRaining ? 'rain' : isSunny ? 'sun' : 'cloud';

  const dayOfMonth = new Date().getDate();
  const dayOfWeek = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'][new Date().getDay()];

  const weatherPhrases: Record<string, Record<string, string[]>> = {
    safe: {
      sun: [
        "Belle journée ensoleillée en perspective.",
        "Le soleil brille, profitez-en pour faire le plein d'énergie.",
        "Journée lumineuse et très agréable.",
        "Grand ciel bleu pour illuminer votre matinée."
      ],
      rain: [
        "La pluie arrose votre journée, pensez au parapluie.",
        "Journée humide mais propice à une ambiance cosy.",
        "Averses au programme : prenez vos précautions pour vos trajets.",
        "Quelques ondées rafraîchissent l'atmosphère aujourd'hui."
      ],
      storm: [
        "Attention aux orages aujourd'hui, restez prudents.",
        "Activité orageuse prévue : mettez-vous à l'abri lors des averses.",
        "Temps agité avec risque de tonnerre sur votre secteur.",
        "Atmosphère électrique ce matin, la prudence est de mise."
      ],
      cloud: [
        "Ciel couvert mais temps calme et doux.",
        "Journée nuageuse mais sereine.",
        "Les nuages dominent ce matin, apportant une ambiance feutrée.",
        "Temps calme sous un ciel voilé."
      ]
    },
    spicy: {
      sun: [
        "Le soleil est au rendez-vous pour booster votre journée !",
        "Grand beau temps : une excellente occasion de prendre l'air.",
        "Soleil éclatant ce matin, faites le plein de vitamine D !",
        "Ciel dégagé et lumineux pour accompagner vos projets."
      ],
      rain: [
        "Temps pluvieux : l'occasion parfaite pour un bon café bien au chaud.",
        "La pluie fait son travail dans les jardins, sortez couverts !",
        "Petites averses prévues : gardez votre imperméable sous la main.",
        "Une météo humide mais idéale pour avancer sur vos dossiers."
      ],
      storm: [
        "Le ciel donne de la voix ce matin, restez bien au chaud !",
        "Temps dynamique et orageux : prudence lors de vos sorties.",
        "Éclairs à l'horizon, un spectacle impressionnant en sécurité chez soi."
      ],
      cloud: [
        "Ciel doux et nuageux, parfait pour une journée productive.",
        "Les nuages s'installent en douceur sans troubler votre rythme.",
        "Ambiance feutrée et sereine pour démarrer la journée du bon pied."
      ]
    },
    vulgar: {
      sun: [
        "Belle journée ensoleillée en perspective.",
        "Le soleil brille, profitez-en !"
      ],
      rain: [
        "La pluie arrose votre journée, pensez au parapluie.",
        "Journée humide mais cosy."
      ],
      storm: [
        "Attention aux orages aujourd'hui, restez prudents.",
        "Activité orageuse prévue."
      ],
      cloud: [
        "Ciel couvert mais temps calme et doux.",
        "Journée nuageuse mais sereine."
      ]
    }
  };

  const signPhrases: Record<string, string[]> = {
    'Bélier': [
      "Votre dynamisme naturel et votre enthousiasme vous ouvrent de belles portes.",
      "Une belle énergie aujourd'hui : foncez avec confiance dans vos projets !",
      "Votre esprit d'initiative saura faire la différence auprès de votre entourage.",
      "Plein cap sur vos objectifs avec votre audace habituelle.",
      "Votre motivation communicative apporte un élan positif à votre journée."
    ],
    'Taureau': [
      "Votre constance et votre sérénité sont vos meilleurs atouts du jour.",
      "Prenez le temps de savourer les petits bonheurs simples de la journée.",
      "Votre détermination posée et efficace vous mène droit au succès.",
      "Une belle journée pour consolider vos acquis en toute quiétude.",
      "Votre fiabilité naturelle inspire confiance et respect autour de vous."
    ],
    'Gémeaux': [
      "Votre curiosité vive et votre esprit d'adaptation ouvrent de belles perspectives.",
      "Une journée idéale pour échanger, créer des liens et partager de bonnes idées.",
      "Votre vivacité d'esprit saura débloquer facilement toutes les situations.",
      "Votre sens de la communication apporte de la fraîcheur à vos échanges.",
      "Votre créativité pétillante est au rendez-vous aujourd'hui !"
    ],
    'Cancer': [
      "Votre intuition fine et votre bienveillance illuminent votre entourage.",
      "Prenez soin de vous et accordez-vous un moment de détente bien mérité.",
      "Une belle journée tout en écoute, en douceur et en harmonie.",
      "Votre grande générosité de cœur crée des moments précieux aujourd'hui.",
      "Faites confiance à votre ressenti : il vous guide avec justesse."
    ],
    'Lion': [
      "Votre chaleur naturelle et votre générosité rayonnent autour de vous.",
      "Une belle journée pour inspirer les autres et exprimer votre talent.",
      "Votre leadership bienveillant donne confiance à tous ceux qui vous entourent.",
      "Rayonnez avec élégance et partagez votre bel enthousiasme du jour.",
      "Faites confiance à votre créativité : elle sera remarquée et appréciée."
    ],
    'Vierge': [
      "Votre sens du détail et votre organisation sans faille feront des merveilles.",
      "Une journée idéale pour avancer méthodiquement et voir clair dans vos projets.",
      "Votre efficacité bienveillante est un précieux repère pour vos proches.",
      "La clarté de vos idées vous permet de réussir ce que vous entreprenez.",
      "Votre pragmatisme et votre sens pratique vous garantissent une belle réussite."
    ],
    'Balance': [
      "Votre recherche d'harmonie et d'équilibre apporte la paix autour de vous.",
      "Votre diplomatie naturelle et votre tact résolvent tout avec élégance.",
      "Cultivez la beauté et la bonne entente tout au long de votre journée.",
      "Votre sourire et votre écoute bienveillante font l'unanimité aujourd'hui.",
      "Une belle journée sous le signe de la justice, de l'équilibre et du partage."
    ],
    'Scorpion': [
      "Votre intuition profonde et votre détermination inébranlable guident vos pas.",
      "Une énergie puissante et concentrée pour mener à bien vos ambitions.",
      "Votre perspicacité et votre authenticité vous permettent d'aller à l'essentiel.",
      "Votre magnétisme et votre force tranquille inspirent votre entourage.",
      "Transformez les défis du jour en opportunités grâce à votre courage."
    ],
    'Sagittaire': [
      "Votre optimisme chaleureux et votre enthousiasme soufflent un vent d'air frais.",
      "Une excellente journée pour élargir vos horizons et découvrir de nouvelles choses.",
      "Partagez votre bonne humeur contagieuse avec tous ceux que vous croisez !",
      "Votre vision positive de la vie vous ouvre de magnifiques perspectives.",
      "Avancez avec confiance : l'avenir vous sourit et de belles opportunités arrivent."
    ],
    'Capricorne': [
      "Votre persévérance et votre sens des responsabilités forcent l'admiration.",
      "Chaque effort consenti aujourd'hui consolide vos belles réussites de demain.",
      "Construisez vos projets avec votre rigueur, votre patience et votre calme habituels.",
      "Votre sagesse et votre maturité sont de précieux repères pour vos proches.",
      "Une belle journée productive où votre rigueur portera pleinement ses fruits."
    ],
    'Verseau': [
      "Votre esprit novateur et votre créativité apportent des solutions inspirantes.",
      "Une belle journée pour penser différemment et lancer de belles idées.",
      "Votre ouverture d'esprit et votre humanisme font chaud au cœur.",
      "Votre regard tourné vers l'avenir ouvre de nouveaux horizons stimulants.",
      "Cultivez votre originalité : c'est précisément ce qui fait votre force !"
    ],
    'Poissons': [
      "Votre sensibilité artistique et votre grande empathie créent de précieux liens.",
      "Laissez libre cours à votre imagination féconde et bienveillante.",
      "Votre douceur naturelle apporte réconfort et sérénité à votre entourage.",
      "Une journée propice à l'inspiration, au calme et aux belles rencontres.",
      "Écoutez votre petite voix intérieure : elle vous guide avec sagesse et poésie."
    ]
  };

  const weatherPool = weatherPhrases[humorLevel]?.[weatherType] || weatherPhrases.safe[weatherType];
  const signPool = signPhrases[sign] || ["Passez une excellente et radieuse journée !"];

  const wIdx = dayOfMonth % weatherPool.length;
  const sIdx = (dayOfMonth * 7 + sign.length) % signPool.length;

  const weatherLine = weatherPool[wIdx];
  const signLine = signPool[sIdx];

  const titles = [
    `🔮 ${dayOfWeek} ${sign}`,
    `☕ ${sign} — ${dayOfWeek}`,
    `⚡ Brief ${sign}`,
    `🌀 ${dayOfWeek} pour ${sign}`,
  ];
  const title = titles[dayOfMonth % titles.length];

  // The factual weather line now lives in the brief's "anchor" (see
  // utils/morningAnchor.ts), so the body stays a single punchline. Repeating
  // the weather here is what used to make the brief feel long and muddled.
  const body = humorLevel === 'safe'
    ? `${weatherLine} ${signLine}`
    : signLine;

  return { title, body };
}

export async function checkAndFireMorningBrief(humorLevel: HumorLevel, birthDate: string, weatherCode: number): Promise<void> {
  const LAST_BRIEF_KEY = 'meteo_pure_last_morning_brief';
  const todayStr = new Date().toISOString().split('T')[0];
  const lastAlert = localStorage.getItem(LAST_BRIEF_KEY);
  
  if (lastAlert === todayStr) return; // Already sent today
  
  const now = new Date();
  const hour = now.getHours();
  // Only fire between 8h00 and 10h00
  if (hour < 8 || hour > 10) return;
  
  const brief = getMorningBriefContent(humorLevel, birthDate, weatherCode);
  if (!brief) return;

  const delivered = await fireSystemNotification(brief.title, brief.body);
  if (delivered) {
    localStorage.setItem(LAST_BRIEF_KEY, todayStr);
  }
}

export async function fireSystemNotification(title: string, body: string): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  
  const options: NotificationOptions = {
    body,
    icon: '/icon.svg',
    badge: '/notification_badge.svg'
  };

  const deliverNotification = async (): Promise<boolean> => {
    // Try via service worker registration first (extremely robust on mobile and Safari iOS PWA)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(title, options);
          return true;
        }
      } catch (e) {
        console.warn('Chef ! L\'inscription au Service Worker a échoué :', e);
      }
    }
    
    // Fallback to standard constructor (mostly desktop browsers)
    try {
      new Notification(title, options);
      return true;
    } catch (e) {
      console.warn('Chef ! Le constructeur direct a échoué :', e);
      return false;
    }
  };

  if (Notification.permission === 'granted') {
    return await deliverNotification();
  } else if (Notification.permission !== 'denied') {
    try {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        return await deliverNotification();
      }
    } catch (err) {
      // Chrome/Safari under some frames don't support promise-based requestPermission
      console.warn('Chef ! Demande de permissions de notifications perturbée :', err);
    }
  }
  return false;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function syncPushSubscription(
  enabled: boolean,
  commune: any,
  humorLevel: HumorLevel,
  weather: any,
  birthDate?: string,
  prefs?: { rainNotificationsEnabled?: boolean; stormNotificationsEnabled?: boolean; alertNotificationsEnabled?: boolean; minMinutesBetweenAlerts?: number }
): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return false;
  }

  // Prevent registration failures if notification permission is not granted
  if (enabled && Notification.permission !== 'granted') {
    console.warn('[PUSH SERVICE] Cannot register push subscription: Notification permission is not granted.');
    return false;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg) return false;

    if (!enabled) {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint })
        });
      }
      return true;
    }

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const keyRes = await fetch('/api/vapid-public-key');
      if (!keyRes.ok) throw new Error('Failed to fetch VAPID key');
      const { publicKey } = await keyRes.json();

      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    if (sub) {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          commune,
          humorLevel,
          birthDate,
          rainNotificationsEnabled: prefs?.rainNotificationsEnabled,
          stormNotificationsEnabled: prefs?.stormNotificationsEnabled,
          alertNotificationsEnabled: prefs?.alertNotificationsEnabled,
          minMinutesBetweenAlerts: prefs?.minMinutesBetweenAlerts,
          currentConditions: weather ? {
            temperature: weather.current.temperature,
            precipitation: weather.current.precipitation,
            weatherCode: weather.current.weatherCode
          } : null
        })
      });
      await persistSubscriptionMeta(commune, humorLevel, birthDate);
      return true;
    }
  } catch (err) {
    console.error('Error syncing Push subscription with server:', err);
  }
  return false;
}

/**
 * Persist commune/humorLevel/birthDate in Cache Storage so the Service Worker
 * can re-read them from `pushsubscriptionchange` (SW has no access to localStorage).
 */
async function persistSubscriptionMeta(commune: any, humorLevel: HumorLevel, birthDate?: string): Promise<void> {
  try {
    if (!('caches' in window)) return;
    const cache = await caches.open('meteo-pure-meta');
    const body = JSON.stringify({ commune, humorLevel, birthDate: birthDate || '' });
    await cache.put('/meta/subscription-info', new Response(body, { headers: { 'Content-Type': 'application/json' } }));
  } catch {
    // Non-critical: worst case pushsubscriptionchange falls back to a placeholder commune
  }
}

/**
 * Silent background re-sync: call on every app load when notifs are enabled.
 * Re-sends the existing push subscription to the server so the endpoint stays fresh.
 * If the subscription was rotated by the browser, creates a new one.
 */
export async function refreshPushSubscription(
  commune: any,
  humorLevel: HumorLevel,
  birthDate?: string,
  prefs?: { rainNotificationsEnabled?: boolean; stormNotificationsEnabled?: boolean; alertNotificationsEnabled?: boolean; minMinutesBetweenAlerts?: number }
): Promise<void> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    if (!reg) return;

    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      const keyRes = await fetch('/api/vapid-public-key');
      if (!keyRes.ok) return;
      const { publicKey } = await keyRes.json();
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    if (sub) {
      await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          commune,
          humorLevel,
          birthDate,
          rainNotificationsEnabled: prefs?.rainNotificationsEnabled,
          stormNotificationsEnabled: prefs?.stormNotificationsEnabled,
          alertNotificationsEnabled: prefs?.alertNotificationsEnabled,
          minMinutesBetweenAlerts: prefs?.minMinutesBetweenAlerts
        })
      });
      await persistSubscriptionMeta(commune, humorLevel, birthDate);
    }
  } catch (e) {
    console.warn('[PUSH] silent refresh failed:', e);
  }
}
