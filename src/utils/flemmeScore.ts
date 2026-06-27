import { WeatherData } from '../types';
import { HumorLevel } from './notificationService';

export interface FlemmeResult {
  score: number;
  emoji: string;
  label: string;
  message: string;
  excuse: string;
}

export function calculateFlemmeScore(weather: WeatherData, humorLevel: HumorLevel = 'spicy'): FlemmeResult {
  let score = 0;

  const temp = weather.current.temperature;
  const wind = weather.current.windSpeed;
  const humidity = weather.current.humidity;
  const precip = weather.current.precipitation;
  const code = weather.current.weatherCode;
  const feelsLike = weather.current.feelsLike;

  // Temperature contribution (0-25 pts)
  if (temp >= 38) score += 25;
  else if (temp >= 34) score += 20;
  else if (temp >= 30) score += 15;
  else if (temp <= -5) score += 25;
  else if (temp <= 0) score += 20;
  else if (temp <= 5) score += 15;
  else if (temp <= 10) score += 8;
  else if (temp >= 25 && temp < 30) score += 3;

  // Feels-like gap penalty
  const gap = Math.abs(temp - feelsLike);
  if (gap > 5) score += 5;

  // Rain contribution (0-25 pts)
  if (precip > 5) score += 25;
  else if (precip > 2) score += 18;
  else if (precip > 0.5) score += 12;
  else if (precip > 0) score += 6;

  // Rain in next hour
  const rainSoon = weather.rainInTheHour.some(r => r.intensity !== 'none');
  if (rainSoon) score += 5;

  // Wind contribution (0-15 pts)
  if (wind >= 60) score += 15;
  else if (wind >= 40) score += 10;
  else if (wind >= 25) score += 5;

  // Weather code contribution (0-15 pts)
  if ([95, 96, 99].includes(code)) score += 15; // thunderstorm
  else if ([71, 73, 75, 77, 85, 86].includes(code)) score += 12; // snow
  else if ([65, 67, 82].includes(code)) score += 12; // heavy rain
  else if ([61, 63, 80, 81].includes(code)) score += 8; // rain
  else if ([51, 53, 55, 56, 57].includes(code)) score += 5; // drizzle
  else if ([45, 48].includes(code)) score += 8; // fog
  else if ([3].includes(code)) score += 2; // overcast

  // Humidity bonus
  if (humidity > 85) score += 5;
  else if (humidity > 75 && temp > 25) score += 4;

  // Day of week bonus
  const day = new Date().getDay();
  if (day === 1) score += 8; // Monday
  else if (day === 0) score -= 3; // Sunday — less excuse needed
  else if (day === 5) score -= 2; // Friday motivation

  // Hour bonus — early morning or late evening
  const hour = new Date().getHours();
  if (hour < 7) score += 5;
  else if (hour >= 22) score += 5;

  // Vigilance bonus
  if (weather.vigilance.globalLevel === 'red') score += 15;
  else if (weather.vigilance.globalLevel === 'orange') score += 10;
  else if (weather.vigilance.globalLevel === 'yellow') score += 3;

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    emoji: getEmoji(score),
    label: getLabel(score),
    message: getMessage(score, humorLevel, weather),
    excuse: getExcuse(score, humorLevel, weather),
  };
}

function getEmoji(score: number): string {
  if (score >= 90) return '🛌';
  if (score >= 75) return '😴';
  if (score >= 60) return '🛋️';
  if (score >= 40) return '😮‍💨';
  if (score >= 20) return '🙄';
  return '💪';
}

function getLabel(score: number): string {
  if (score >= 90) return 'Critique';
  if (score >= 75) return 'Très élevé';
  if (score >= 60) return 'Élevé';
  if (score >= 40) return 'Modéré';
  if (score >= 20) return 'Faible';
  return 'Inexistant';
}

function getMessage(score: number, humor: HumorLevel, weather: WeatherData): string {
  const temp = Math.round(weather.current.temperature);

  const messages: Record<string, Record<HumorLevel, string[]>> = {
    critical: {
      safe: [
        'Rester chez soi est un acte de sagesse aujourd\'hui.',
        'Journée parfaite pour un marathon de séries.',
        'Même les oiseaux ont annulé leurs plans.',
      ],
      spicy: [
        'Rester au lit est un devoir civique. Le monde ne mérite pas ta présence aujourd\'hui.',
        'Le canapé t\'a officiellement adopté. Résiste pas.',
        'Si tu sors par ce temps, tu mérites tout ce qui t\'arrive.',
      ],
      vulgar: [
        'Bouge pas ton cul du lit, c\'est un ordre de la météo nationale.',
        'Dehors c\'est la merde absolue. Ton plaid et Netflix, point final.',
        'Seul un psychopathe sortirait par ce temps. T\'es pas psychopathe. Si ?',
      ],
    },
    high: {
      safe: [
        `${temp}°C et un ciel hostile. Votre canapé vous attend les bras ouverts.`,
        'Les conditions extérieures déconseillent fortement toute ambition.',
        'Excellente journée pour redécouvrir le plafond de votre chambre.',
      ],
      spicy: [
        'Même ton patron comprendrait. Enfin, il devrait.',
        `${temp}°C dehors. Le frigo est plus près que la civilisation, profites-en.`,
        'Ta motivation a regardé par la fenêtre et elle a démissionné.',
      ],
      vulgar: [
        'Ta productivité peut aller se faire foutre aujourd\'hui.',
        `${temp}°C, sérieux ? Même les clodos ont trouvé un abri.`,
        'Ton lit est le seul endroit qui te respecte vraiment par ce temps.',
      ],
    },
    moderate: {
      safe: [
        'Le canapé vous fait de l\'œil, mais vous pouvez encore résister.',
        'Sortir est possible. Souhaitable ? C\'est un autre débat.',
        'Conditions mitigées. Votre motivation décidera du reste.',
      ],
      spicy: [
        'C\'est le genre de journée où tu mets un pied dehors et tu regrettes immédiatement.',
        '50/50. Pile tu sors, face tu retournes sous la couette. Pas besoin de pièce, on connaît la réponse.',
        'Le temps hésite autant que toi devant ton dressing.',
      ],
      vulgar: [
        'C\'est moyen-moyen dehors. Comme ta vie, en somme.',
        'Tu pourrais sortir. Tu pourrais aussi manger une pizza en slip. Le choix est vite fait.',
        'Ni chaud ni froid, un peu comme ton ex. Inutile et décevant.',
      ],
    },
    low: {
      safe: [
        'Aucune excuse météo crédible. Il va falloir assumer.',
        'Le temps est clément. Profitez de cette fenêtre de courage.',
        'Conditions acceptables pour l\'espèce humaine.',
      ],
      spicy: [
        'Désolé, la météo ne te fournit aucune excuse aujourd\'hui. Démerde-toi.',
        'Il fait beau. T\'as plus d\'excuse. C\'est tragique.',
        'Le soleil insiste lourdement pour que tu bouges. Fais semblant au moins.',
      ],
      vulgar: [
        'Y a pas une goutte de pluie pour justifier ta flemme. T\'es foutu.',
        'Le ciel est dégagé, t\'as zéro excuse. Vas-y, fais ta victime quand même.',
        'Temps parfait. Tu vas devoir trouver une autre raison pour être inutile.',
      ],
    },
  };

  let tier: string;
  if (score >= 75) tier = 'critical';
  else if (score >= 50) tier = 'high';
  else if (score >= 25) tier = 'moderate';
  else tier = 'low';

  const pool = messages[tier][humor];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getExcuse(score: number, humor: HumorLevel, weather: WeatherData): string {
  const temp = Math.round(weather.current.temperature);
  const wind = Math.round(weather.current.windSpeed);
  const code = weather.current.weatherCode;

  const excuses: Record<HumorLevel, string[]> = {
    safe: [
      `"Il fait ${temp}°C, je préfère travailler de chez moi par prudence."`,
      `"Météo-France déconseille les déplacements non essentiels."`,
      `"Je surveille l'évolution de la météo depuis mon salon, par responsabilité."`,
      `"Mon médecin m'a dit d'éviter les changements brusques de température."`,
      `"Ma voiture refuse de démarrer quand il fait ce temps."`,
    ],
    spicy: [
      `"Vent à ${wind} km/h, j'ai peur de m'envoler. Je fais 52 kg."`,
      `"Il fait ${temp}°C, mon cerveau ne fonctionne qu'entre 18 et 22."`,
      `"J'ai une allergie saisonnière au lundi combinée à la pluie."`,
      `"Mon horoscope dit de rester chez moi. J'obéis aux astres."`,
      `"Mon chat a l'air triste, je reste pour le soutenir moralement."`,
      `"Le wifi chez moi est meilleur que dehors, c'est mathématique."`,
    ],
    vulgar: [
      `"J'ai une gastro. *tousse au téléphone* Non c'est pas le bruit du café."`,
      `"${temp}°C putain. Même mon chien refuse de sortir pisser."`,
      `"Le vent à ${wind} km/h m'a arraché mon dernier neurone motivé."`,
      `"J'ai glissé sur du verglas imaginaire. Arrêt 3 jours."`,
      `"Mon pantalon est au sale et j'ai pas de rechange. Ah mince."`,
      `"Mon réveil a sonné mais la météo m'a dit d'aller me recoucher."`,
    ],
  };

  if (code >= 95) {
    return humor === 'vulgar'
      ? `"Y a de l'orage, j'ai peur du tonnerre depuis mes 5 ans. Me jugez pas."`
      : `"Orage en cours, je préfère rester en sécurité."`;
  }

  const pool = excuses[humor];
  return pool[Math.floor(Math.random() * pool.length)];
}
