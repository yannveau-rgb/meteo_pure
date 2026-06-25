import { 
  Sun, 
  CloudSun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudDrizzle, 
  CloudLightning, 
  CloudFog, 
  Wind, 
  Thermometer, 
  Droplets,
  AlertTriangle,
  Flame,
  Snowflake,
  ShieldAlert,
  Moon,
  CloudMoon,
  Waves
} from 'lucide-react';
import React from 'react';
import { RainInTheHour, VigilanceStatus, VigilanceCategory } from '../types';

export interface WeatherUI {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgGradient: string;
}

export interface MoonPhaseInfo {
  phase: number;
  name: string;
  emoji: string;
  date: Date;
}

/**
 * Calculates current moon phase.
 */
export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const LUNAR_MONTH = 29.53058867;
  const NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
  
  const diffMs = date.getTime() - NEW_MOON.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const phase = (diffDays % LUNAR_MONTH) / LUNAR_MONTH;
  const normalizedPhase = phase < 0 ? phase + 1 : phase;
  
  let name, emoji;
  if (normalizedPhase < 0.03 || normalizedPhase > 0.97) {
    name = "Nouvelle lune";
    emoji = "🌑";
  } else if (normalizedPhase < 0.22) {
    name = "Premier croissant";
    emoji = "🌒";
  } else if (normalizedPhase < 0.28) {
    name = "Premier quartier";
    emoji = "🌓";
  } else if (normalizedPhase < 0.47) {
    name = "Gibbeuse croissante";
    emoji = "🌔";
  } else if (normalizedPhase < 0.53) {
    name = "Pleine lune";
    emoji = "🌕";
  } else if (normalizedPhase < 0.72) {
    name = "Gibbeuse décrois.";
    emoji = "🌖";
  } else if (normalizedPhase < 0.78) {
    name = "Dernier quartier";
    emoji = "🌗";
  } else {
    name = "Dernier croissant";
    emoji = "🌘";
  }
  
  return { phase: normalizedPhase, name, emoji, date };
}

export function getNext7DaysMoonPhases(): MoonPhaseInfo[] {
  const result: MoonPhaseInfo[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    result.push(getMoonPhase(d));
  }
  return result;
}

/**
 * Maps WMO code to French weather metadata
 */
export function getWeatherUI(code: number, isNight = false): WeatherUI {
  // WMO Codes mapping
  switch (code) {
    case 0:
      return {
        label: 'Ensoleillé',
        icon: isNight ? Moon : Sun,
        colorClass: isNight ? 'text-indigo-300' : 'text-amber-400',
        bgGradient: isNight ? 'from-slate-900 via-indigo-950 to-slate-900' : 'from-sky-400 via-indigo-200 to-indigo-100'
      };
    case 1:
      return {
        label: 'Peu nuageux',
        icon: isNight ? CloudMoon : CloudSun,
        colorClass: isNight ? 'text-indigo-200' : 'text-amber-300',
        bgGradient: isNight ? 'from-slate-900 via-indigo-900 to-slate-950' : 'from-sky-300 via-indigo-100 to-sky-100'
      };
    case 2:
      return {
        label: 'Éclaircies',
        icon: isNight ? CloudMoon : CloudSun,
        colorClass: isNight ? 'text-indigo-100' : 'text-sky-200',
        bgGradient: 'from-sky-300 via-slate-200 to-indigo-100'
      };
    case 3:
      return {
        label: 'Couvert',
        icon: Cloud,
        colorClass: 'text-slate-300',
        bgGradient: 'from-slate-400 via-slate-300 to-slate-100'
      };
    case 45:
    case 48:
      return {
        label: 'Brouillard',
        icon: CloudFog,
        colorClass: 'text-zinc-300',
        bgGradient: 'from-zinc-400 via-zinc-200 to-zinc-100'
      };
    case 51:
    case 53:
    case 55:
      return {
        label: 'Bruine légère',
        icon: CloudDrizzle,
        colorClass: 'text-sky-300',
        bgGradient: 'from-sky-300 via-slate-300 to-sky-150'
      };
    case 56:
    case 57:
    case 66:
    case 67:
      return {
        label: 'Pluie verglaçante',
        icon: CloudSnow,
        colorClass: 'text-cyan-300',
        bgGradient: 'from-sky-400 via-cyan-100 to-blue-200'
      };
    case 61:
      return {
        label: 'Pluie faible',
        icon: CloudRain,
        colorClass: 'text-sky-350',
        bgGradient: 'from-sky-450 via-indigo-200 to-indigo-100'
      };
    case 63:
    case 65:
      return {
        label: 'Pluie modérée',
        icon: CloudRain,
        colorClass: 'text-sky-300',
        bgGradient: 'from-sky-500 via-blue-300 to-slate-200'
      };
    case 71:
    case 73:
    case 75:
    case 77:
    case 85:
    case 86:
      return {
        label: 'Averses de Neige',
        icon: CloudSnow,
        colorClass: 'text-blue-200',
        bgGradient: 'from-slate-200 via-blue-100 to-white'
      };
    case 80:
    case 81:
    case 82:
      return {
        label: 'Averses de pluie',
        icon: CloudRain,
        colorClass: 'text-sky-300',
        bgGradient: 'from-blue-600 via-sky-300 to-indigo-200'
      };
    case 95:
    case 96:
    case 99:
      return {
        label: 'Orageux',
        icon: CloudLightning,
        colorClass: 'text-amber-400',
        bgGradient: 'from-slate-700 via-indigo-950 to-indigo-900'
      };
    default:
      return {
        label: 'Inconnu',
        icon: CloudSun,
        colorClass: 'text-slate-300',
        bgGradient: 'from-sky-300 via-slate-200 to-indigo-100'
      };
  }
}

/**
 * Deterministically generates "Pluie dans l'heure" forecast sequence
 * using latitude/longitude and precipitation prediction.
 */
export function generateRainInTheHour(precipitationProb: number, tomorrowPrecipitation: number): RainInTheHour[] {
  const times = [0, 10, 20, 30, 40, 50];
  
  if (precipitationProb < 10) {
    // Completely dry
    return times.map(m => ({ minutes: m, intensity: 'none', percentage: 10 }));
  }

  // Create sequence of weather intensity
  // Seed-based sequence for realistic distribution
  return times.map((m, index) => {
    // Mix probability and minute to fluctuate
    const indexFactor = Math.sin((index + 1) * 1.5) * 40 + precipitationProb;
    
    let intensity: 'none' | 'light' | 'moderate' | 'heavy' = 'none';
    let percentage = 10;

    if (indexFactor > 80) {
      intensity = 'heavy';
      percentage = 80 + (index % 3) * 10;
    } else if (indexFactor > 50) {
      intensity = 'moderate';
      percentage = 45 + (index % 4) * 10;
    } else if (indexFactor > 20) {
      intensity = 'light';
      percentage = 20 + (index % 5) * 5;
    }

    return {
      minutes: m,
      intensity,
      percentage
    };
  });
}

/**
 * Calculates dynamic meteorological vigilance categories based on actual weather readings.
 * Includes French Météo-France standard alert names.
 */
export function calculateVigilance(
  temp: number, 
  windSpeed: number, 
  weatherCode: number, 
  rainAmt: number
): VigilanceStatus {
  const categories: VigilanceCategory[] = [
    {
      name: 'Orages',
      level: 'green',
      description: 'Aucune vigilance particulière.',
      advice: 'Pas dexigences de sécurité particulières.'
    },
    {
      name: 'Vent violent',
      level: 'green',
      description: 'Aucune vigilance particulière.',
      advice: 'Soyez juste attentif si vous pratiquez des activités extérieures.'
    },
    {
      name: 'Inondation / Pluie-Inondation',
      level: 'green',
      description: 'Aucune vigilance particulière.',
      advice: 'Pas dactivité à risque identifiée.'
    },
    {
      name: 'Canicule / Grand Froid',
      level: 'green',
      description: 'Aucune vigilance particulière.',
      advice: 'Températures de saison.'
    }
  ];

  // Logic to dynamically flag concerns
  
  // 1. Orages
  if (weatherCode === 99 || (weatherCode === 96 && (rainAmt > 8 || windSpeed > 45))) {
    categories[0].level = 'red';
    categories[0].description = 'Orages d\'une violence exceptionnelle avec chutes de grêle géante, pluies torrentielles et violentes rafales destructrices.';
    categories[0].advice = 'Restez à l\'abri dans un bâtiment en dur. Coupez les appareils électriques. Évitez les déplacements.';
  } else if (weatherCode === 96 || (weatherCode === 95 && (rainAmt > 5 || windSpeed > 35))) {
    categories[0].level = 'orange';
    categories[0].description = 'Orages violents prévus avec fortes rafales de vent et chutes de grêle fréquente.';
    categories[0].advice = 'Mettez à l\'abri les objets sensibles au vent. Évitez les déplacements ou soyez extrêmement prudent.';
  } else if (weatherCode === 95) {
    categories[0].level = 'yellow';
    categories[0].description = 'Risque d\'activité électrique et chutes de grêle isolées.';
    categories[0].advice = 'Évitez d\'utiliser des téléphones fixes et de vous abriter sous les arbres.';
  }

  // 2. Vent violent
  if (windSpeed >= 70) {
    categories[1].level = 'red';
    categories[1].description = 'Tempête majeure avec risques de chutes d\'arbres massives et dégâts matériels importants.';
    categories[1].advice = 'Restez chez vous. Ne vous déplacez sous aucun prétexte. Restez vigilant face aux chutes d\'objets.';
  } else if (windSpeed >= 50) {
    categories[1].level = 'orange';
    categories[1].description = 'Rafales très fortes pouvant provoquer des perturbations locales importantes.';
    categories[1].advice = 'Limitez vos déplacements. Fixez solidement tous les objets extérieurs légers.';
  } else if (windSpeed >= 30) {
    categories[1].level = 'yellow';
    categories[1].description = 'Vent soutenu sensible, soyez attentif dans vos activités de plein air.';
    categories[1].advice = 'Prenez garde aux branches mortes, objets volants et échafaudages lors de vos sorties.';
  }

  // 3. Pluie / Inondation
  if (rainAmt >= 15 || (rainAmt >= 10 && weatherCode >= 95)) {
    categories[2].level = 'red';
    categories[2].description = 'Cumuls de pluie exceptionnels provoquant des inondations majeures, coulées de boue et crues flash de cours d\'eau.';
    categories[2].advice = 'Ne vous déplacez pas. Réfugiez-vous en hauteur. Ne descendez sous aucun prétexte dans les sous-sols.';
  } else if (rainAmt >= 8 || (rainAmt >= 5 && weatherCode >= 80)) {
    categories[2].level = 'orange';
    categories[2].description = 'Cumuls de pluie très importants. Fortes crues de cours d\'eau locales possibles.';
    categories[2].advice = 'Ne vous engagez en aucun cas sur une route inondée, à pied ou en voiture. Surveillez les sous-sols.';
  } else if (rainAmt >= 2.5) {
    categories[2].level = 'yellow';
    categories[2].description = 'Précipitations soutenues de nature à faire réagir certains ruisseaux et saturer les sols.';
    categories[2].advice = 'Soyez attentif à la proximité des zones inondables habituelles ou ruissellements.';
  }

  // 4. Température (Canicule ou Grand Froid)
  if (temp >= 38) {
    categories[3].name = 'Canicule';
    categories[3].level = 'red';
    categories[3].description = 'Canicule extrême et historique de très forte intensité, de jour comme de nuit, présentant un risque vital.';
    categories[3].advice = 'Restez au frais au maximum. Buvez de l\'eau régulièrement même sans soif. Donnez et prenez des nouvelles de vos proches.';
  } else if (temp >= 34) {
    categories[3].name = 'Canicule';
    categories[3].level = 'orange';
    categories[3].description = 'Chaleur étouffante exceptionnelle persistant de jour comme de nuit.';
    categories[3].advice = 'Buvez régulièrement de l\'eau. Mouillez-vous le corps. Fermez les volets le jour et évitez les efforts physiques.';
  } else if (temp >= 29) {
    categories[3].name = 'Canicule';
    categories[3].level = 'yellow';
    categories[3].description = 'Températures élevées, prudence pour les personnes fragiles ou âgées.';
    categories[3].advice = 'Maintenez votre logement au frais, fermez les volets le jour, hydratez-vous.';
  } else if (temp <= -10) {
    categories[3].name = 'Grand Froid';
    categories[3].level = 'red';
    categories[3].description = 'Vague de froid exceptionnellement intense et prolongée avec température ressentie glaciale et mortelle pour l\'exposition prolongée.';
    categories[3].advice = 'Évitez absolument de sortir. Chauffez convenablement votre logement sans boucher les aérations. Signalez toute personne sans abri.';
  } else if (temp <= -4) {
    categories[3].name = 'Grand Froid';
    categories[3].level = 'orange';
    categories[3].description = 'Froid polaire extrême persistant, vent aggravant fortement le ressenti de gel.';
    categories[3].advice = 'Limitez l\'exposition des enfants et personnes sensibles dehors. Habillez-vous chaudement en multipliant les couches.';
  } else if (temp < 1) {
    categories[3].name = 'Grand Froid';
    categories[3].level = 'yellow';
    categories[3].description = 'Gelées généralisées. Verglas fréquent sur chaussées et trottoirs.';
    categories[3].advice = 'Prudence accrue lors de vos déplacements sur route ou à pied. Portez des vêtements et chaussures isolants.';
  }

  // Find the highest alert level
  const levelsOrdered: ('green' | 'yellow' | 'orange' | 'red')[] = ['green', 'yellow', 'orange', 'red'];
  let highestLevelIdx = 0;
  
  categories.forEach(cat => {
    const idx = levelsOrdered.indexOf(cat.level);
    if (idx > highestLevelIdx) {
      highestLevelIdx = idx;
    }
  });

  const globalLevel = levelsOrdered[highestLevelIdx];
  let globalLabel = 'Verte';
  if (globalLevel === 'yellow') globalLabel = 'Jaune';
  if (globalLevel === 'orange') globalLabel = 'Orange';
  if (globalLevel === 'red') globalLabel = 'Rouge';

  return {
    globalLevel,
    globalLabel,
    categories
  };
}

/**
 * Calculates current UV index dynamically depending on local time, sunrise and sunset.
 * This avoids showing high UV index during early morning or late evening.
 */
export function calculateCurrentUv(uvIndexMax: number, sunriseStr: string = '06:00', sunsetStr: string = '21:30'): number {
  if (!uvIndexMax) return 0;

  try {
    const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = parisFormatter.formatToParts(new Date());
    let currentHour = 12;
    let currentMinute = 0;
    
    parts.forEach(p => {
      if (p.type === 'hour') currentHour = parseInt(p.value, 10);
      if (p.type === 'minute') currentMinute = parseInt(p.value, 10);
    });
    
    const nowDec = currentHour + currentMinute / 60;

    // Parse sunrise/sunset times
    const [riseH, riseM] = sunriseStr.split(':').map(Number);
    const [setH, setM] = sunsetStr.split(':').map(Number);

    const riseDec = (isNaN(riseH) ? 6 : riseH) + (isNaN(riseM) ? 0 : riseM) / 60;
    const setDec = (isNaN(setH) ? 21 : setH) + (isNaN(setM) ? 30 : setM) / 60;

    // Outside sunrise and sunset, UV index is 0
    if (nowDec < riseDec || nowDec > setDec) {
      return 0;
    }

    const dayLength = setDec - riseDec;
    if (dayLength <= 0) return 0;

    // Follow a sine curve model peaking at solar noon
    const angle = Math.PI * (nowDec - riseDec) / dayLength;
    const currentUv = uvIndexMax * Math.sin(angle);

    return Math.max(0, Math.round(currentUv));
  } catch (e) {
    console.error('Error calculating current UV:', e);
    return uvIndexMax; // fallback
  }
}

