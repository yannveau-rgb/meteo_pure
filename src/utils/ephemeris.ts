const ephemeris: Record<number, Record<number, string>> = {
  1: {
    1: "Marie / Jour de l'An",
    2: "S. Basile",
    3: "Ste Geneviève",
    4: "S. Odilon",
    5: "S. Edouard",
    6: "S. Melaine / Épiphanie",
    7: "S. Raymond",
    8: "S. Lucien",
    9: "S. Alix",
    10: "S. Guillaume",
    11: "S. Paulin",
    12: "Ste Tatiana",
    13: "Ste Yvette",
    14: "Ste Nina",
    15: "S. Rémi",
    16: "S. Marcel",
    17: "Ste Roseline",
    18: "Ste Prisca",
    19: "S. Marius",
    20: "S. Sébastien",
    21: "Ste Agnès",
    22: "S. Vincent",
    23: "S. Barnard",
    24: "S. François de Sales",
    25: "S. Conversion de Paul",
    26: "Ste Paule",
    27: "Ste Angèle",
    28: "S. Thomas d'Aquin",
    29: "S. Gildas",
    30: "Ste Martine",
    31: "Ste Marcelle"
  },
  2: {
    1: "Ste Ella",
    2: "S. Présentation / Chandeleur",
    3: "S. Blaise",
    4: "Ste Véronique",
    5: "Ste Agathe",
    6: "S. Gaston",
    7: "Ste Eugénie",
    8: "Ste Jacqueline",
    9: "Ste Apolline",
    10: "S. Arnaud",
    11: "Notre-Dame de Lourdes",
    12: "S. Félix",
    13: "Ste Béatrice",
    14: "S. Valentin",
    15: "S. Claude",
    16: "Ste Julienne",
    17: "S. Alexis",
    18: "Ste Bernadette",
    19: "S. Gabin",
    20: "Ste Aimée",
    21: "S. Damien",
    22: "Ste Isabelle",
    23: "S. Lazare",
    24: "S. Modeste",
    25: "S. Roméo",
    26: "S. Nestor",
    27: "Ste Honorine",
    28: "S. Romain",
    29: "S. Auguste"
  },
  3: {
    1: "S. Albin",
    2: "S. Charles le Bon",
    3: "S. Guénolé",
    4: "S. Casimir",
    5: "Ste Olive",
    6: "Ste Colette",
    7: "Ste Félicité",
    8: "S. Jean de Dieu",
    9: "Ste Françoise",
    10: "S. Vivien",
    11: "Ste Rosine",
    12: "Ste Justine",
    13: "S. Rodrigue",
    14: "Ste Mathilde",
    15: "Ste Louise",
    16: "Ste Bénédicte",
    17: "S. Patrick",
    18: "S. Cyrille",
    19: "S. Joseph",
    20: "S. Herbert",
    21: "Ste Clémence",
    22: "Ste Léa",
    23: "S. Victorien",
    24: "Ste Catherine de Suède",
    25: "Annonciation",
    26: "S. Larissa",
    27: "S. Habib",
    28: "S. Gontran",
    29: "Ste Gladys",
    30: "S. Amédée",
    31: "S. Benjamin"
  },
  4: {
    1: "S. Hugues",
    2: "Ste Sandrine",
    3: "S. Richard",
    4: "S. Isidore",
    5: "Ste Irene",
    6: "S. Marcellin",
    7: "S. Jean-Baptiste de la Salle",
    8: "Ste Julie",
    9: "S. Gautier",
    10: "S. Fulbert",
    11: "S. Stanislas",
    12: "S. Jules",
    13: "Ste Ida",
    14: "S. Maxime",
    15: "S. Paterne",
    16: "S. Benoît-Joseph",
    17: "S. Anicet",
    18: "S. Parfait",
    19: "Ste Emma",
    20: "S. Odette",
    21: "S. Anselme",
    22: "S. Alexandre",
    23: "S. Georges",
    24: "S. Fidèle",
    25: "S. Marc",
    26: "Ste Alida",
    27: "Ste Zita",
    28: "Ste Valérie",
    29: "Ste Catherine de Sienne",
    30: "S. Robert"
  },
  5: {
    1: "Fête du Travail / S. Joseph",
    2: "S. Boris",
    3: "S. Philippe / S. Jacques",
    4: "S. Sylvain",
    5: "S. Judith",
    6: "Ste Prudence",
    7: "Ste Gisèle",
    8: "Victoire 1945 / S. Désiré",
    9: "S. Pacôme",
    10: "Ste Solange",
    11: "Ste Estelle",
    12: "S. Achille",
    13: "Ste Rolande",
    14: "S. Matthias",
    15: "Ste Denise",
    16: "S. Honoré",
    17: "S. Pascal",
    18: "S. Éric",
    19: "S. Yves",
    20: "S. Bernardin",
    21: "S. Constantin",
    22: "S. Émile",
    23: "S. Didier",
    24: "S. Donatien",
    25: "Ste Sophie",
    26: "S. Bérenger",
    27: "S. Augustin de Cantorbéry",
    28: "S. Germain",
    29: "S. Aymar",
    30: "S. Ferdinand",
    31: "Visitation de la Vierge"
  },
  6: {
    1: "S. Justin",
    2: "Ste Blandine",
    3: "S. Kévin",
    4: "Ste Clotilde",
    5: "S. Igor",
    6: "S. Norbert",
    7: "S. Gilbert",
    8: "S. Médard",
    9: "Ste Diane",
    10: "S. Landry",
    11: "S. Barnabé",
    12: "S. Guy",
    13: "S. Antoine de Padoue",
    14: "S. Élishée",
    15: "Ste Germaine",
    16: "S. Jean-François Régis",
    17: "S. Hervé",
    18: "S. Léonce",
    19: "S. Romuald",
    20: "S. Silvère",
    21: "S. Rodolphe / Été",
    22: "S. Alban",
    23: "Ste Audrey",
    24: "S. Jean-Baptiste / S. Yann Le créateur 👑🤣",
    25: "S. Prosper",
    26: "S. Anthelme",
    27: "S. Fernand",
    28: "S. Irénée",
    29: "S. Pierre / S. Paul",
    30: "S. Martial"
  },
  7: {
    1: "S. Thierry",
    2: "S. Martinien",
    3: "S. Thomas",
    4: "S. Florent",
    5: "S. Antoine-Marie",
    6: "Ste Mariette",
    7: "S. Raoul",
    8: "S. Thibaut",
    9: "Ste Amandine",
    10: "S. Ulrich",
    11: "S. Benoît",
    12: "S. Olivier",
    13: "S. Henri / S. Joël",
    14: "Fête Nationale / S. Camille",
    15: "S. Donald",
    16: "N-D du Mont-Carmel / S. Elpide",
    17: "Ste Charlotte",
    18: "S. Frédéric",
    19: "S. Arsène",
    20: "Ste Marina",
    21: "S. Victor",
    22: "Ste Marie-Madeleine",
    23: "Ste Brigitte",
    24: "Ste Christine",
    25: "S. Jacques",
    26: "Ste Anne / S. Joachim",
    27: "Ste Nathalie",
    28: "S. Samson",
    29: "Ste Marthe",
    30: "Ste Juliette",
    31: "S. Ignace de Loyola"
  },
  8: {
    1: "S. Alphonse",
    2: "S. Julien Eymard",
    3: "Ste Lydie",
    4: "S. Jean-Marie Vianney",
    5: "S. Abel",
    6: "Transfiguration",
    7: "S. Gaétan",
    8: "S. Dominique",
    9: "S. Amour",
    10: "S. Laurent",
    11: "Ste Claire",
    12: "Ste Chantal",
    13: "S. Hippolyte",
    14: "S. Evrard",
    15: "Assomption",
    16: "S. Armel",
    17: "S. Hyacinthe",
    18: "Ste Hélène",
    19: "S. Jean Eudes",
    20: "S. Bernard",
    21: "S. Christophe",
    22: "S. Fabrice",
    23: "Ste Rose de Lima",
    24: "S. Barthélemy",
    25: "S. Louis",
    26: "S. Césaire",
    27: "Ste Monique",
    28: "S. Augustin",
    29: "S. Sabine",
    30: "S. Fiacre",
    31: "S. Aristide"
  },
  9: {
    1: "S. Gilles",
    2: "S. Ingrid",
    3: "S. Grégoire",
    4: "Ste Rosalie",
    5: "S. Raïssa",
    6: "S. Bertrand",
    7: "Ste Reine",
    8: "Nativité de Marie",
    9: "S. Alain",
    10: "Ste Inès",
    11: "S. Adelphe",
    12: "S. Apollinaire",
    13: "S. Aimé",
    14: "Sainte Croix",
    15: "S. Roland",
    16: "Ste Edith",
    17: "S. Renaud",
    18: "Ste Nadège",
    19: "S. Émilie",
    20: "S. Davy",
    21: "S. Matthieu",
    22: "S. Maurice",
    23: "S. Constant / Automne",
    24: "Ste Thècle",
    25: "S. Hermann",
    26: "S. Côme / S. Damien",
    27: "S. Vincent de Paul",
    28: "S. Venceslas",
    29: "S. Michel / S. Gabriel / S. Raphaël",
    30: "S. Jérôme"
  },
  10: {
    1: "Ste Thèrése de l'Enfant-Jésus",
    2: "Saints Anges Gardiens",
    3: "S. Gérard",
    4: "S. François d'Assise",
    5: "Ste Fleur",
    6: "S. Bruno",
    7: "S. Serge",
    8: "Ste Pélagie",
    9: "S. Denis",
    10: "S. Ghislain",
    11: "S. Firmin",
    12: "S. Wilfrid",
    13: "S. Géraud",
    14: "S. Juste",
    15: "Ste Thérèse d'Avila",
    16: "Ste Edwige / Ste Marguerite",
    17: "S. Baudouin",
    18: "S. Luc",
    19: "S. René Goupil",
    20: "Ste Adeline",
    21: "Ste Céline",
    22: "S. Élodie",
    23: "S. Jean de Capistran",
    24: "S. Florentin",
    25: "S. Crépin",
    26: "S. Dimitri",
    27: "Ste Émeline",
    28: "S. Jude",
    29: "S. Narcisse",
    30: "S. Bienvenu",
    31: "S. Quentin"
  },
  11: {
    1: "Toussaint",
    2: "Défunts",
    3: "S. Hubert",
    4: "S. Charles Borromée",
    5: "Ste Sylvie",
    6: "S. Bertille",
    7: "Ste Carine",
    8: "S. Geoffroy",
    9: "S. Théodore",
    10: "S. Léon",
    11: "Armistice 1918 / S. Martin",
    12: "S. Christian",
    13: "S. Brice",
    14: "S. Sidoine",
    15: "S. Albert",
    16: "Ste Marguerite",
    17: "Ste Élisabeth",
    18: "Ste Aude",
    19: "S. Tanguy",
    20: "S. Edmond",
    21: "Présentation de Marie",
    22: "Ste Cécile",
    23: "S. Clément",
    24: "Ste Flora",
    25: "Ste Catherine",
    26: "Ste Delphine",
    27: "S. Séverin",
    28: "S. Jacob",
    29: "S. Saturnin",
    30: "S. André"
  },
  12: {
    1: "Ste Florence",
    2: "Ste Viviane",
    3: "S. François-Xavier",
    4: "Ste Barbe",
    5: "S. Gérald",
    6: "S. Nicolas",
    7: "S. Ambroise",
    8: "Immaculée Conception",
    9: "S. Pierre Fourier",
    10: "S. Romaric",
    11: "S. Daniel",
    12: "Ste Jeanne-Françoise",
    13: "Ste Lucie",
    14: "S. Jean de la Croix",
    15: "Ste Ninon",
    16: "Ste Alice",
    17: "S. Gaël",
    18: "S. Gatien",
    19: "S. Urbain",
    20: "S. Théophile",
    21: "S. Pierre Canisius / Hiver",
    22: "S. Françoise-Xavière",
    23: "S. Armand",
    24: "Ste Adèle",
    25: "Noël",
    26: "S. Étienne",
    27: "S. Jean",
    28: "Saints Innocents",
    29: "S. David",
    30: "S. Roger",
    31: "S. Sylvestre"
  }
};

/**
 * Returns the traditional saint of the day for a given date.
 */
export function getSaintDuJour(date: Date = new Date()): string {
  try {
    // Standard format converter to Europe/Paris timezone
    const parisFormatter = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      day: 'numeric',
      month: 'numeric',
    });
    const parts = parisFormatter.formatToParts(date);
    let day = date.getDate();
    let month = date.getMonth() + 1;
    
    parts.forEach(p => {
      if (p.type === 'day') day = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10);
    });

    return ephemeris[month]?.[day] || '';
  } catch {
    // fallback
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return ephemeris[m]?.[d] || '';
  }
}


export interface DaylightInfo {
  /** Displayed sunrise "HH:MM" */
  sunrise: string;
  /** Displayed sunset "HH:MM" */
  sunset: string;
  /** Total daylight duration in integer minutes */
  dayLengthMinutes: number;
  /** Formatted duration e.g. "9h 42m" */
  dayLengthFormatted: string;
  /** Exact daily daylight change vs previous day in float minutes (positive = gaining, negative = losing) */
  deltaMinutesExact: number;
  /** Daily daylight change rounded to nearest integer minute */
  deltaMinutesRounded: number;
  /** Total daily change in seconds */
  deltaSecondsTotal: number;
  /** True when days are getting longer (between Dec 21 and Jun 21) */
  isGaining: boolean;
  /** Morning contribution in minutes (positive = earlier sunrise = more light in morning) */
  morningDeltaMinutes: number;
  /** Evening contribution in minutes (positive = later sunset = more light in evening) */
  eveningDeltaMinutes: number;
  /** Cumulative daylight change over the next 7 days in integer minutes */
  weeklyDeltaMinutes: number;
  /** Compact badge label e.g. "+3 min / jour" or "-3 min / jour" */
  badgeLabel: string;
  /** Very short badge for daily forecast rows e.g. "+3 min" or "-3 min" */
  shortDeltaLabel: string;
  /** Precise formatted change e.g. "-3 min 17 s" or "+2 min 45 s" */
  preciseDeltaLabel: string;
  /** Clear human-readable headline e.g. "On perd 3 min de soleil par jour" */
  headline: string;
  /** Context relative to winter/summer solstice */
  solsticeContext: string;
}

/**
 * Computes exact astronomical sunrise, sunset (in UTC minutes from midnight)
 * and daylight duration (in float minutes) for a given date and coordinates
 * using the NOAA solar position equations.
 */
function computeAstronomicalSolarDay(lat: number, lon: number, date: Date): {
  daylightMinutes: number;
  sunriseUtcMin: number;
  sunsetUtcMin: number;
} {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const d = date.getUTCDate();
  const utcNoonMs = Date.UTC(y, m, d, 12, 0, 0);

  const jd = utcNoonMs / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525.0;

  const L0 = ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  const Mrad = M * rad;
  const C =
    Math.sin(Mrad) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * Mrad) * 0.000289;

  const sunTrueLong = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const lambda = sunTrueLong - 0.00569 - 0.00478 * Math.sin(omega * rad);

  const epsilon0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const epsilon = epsilon0 + 0.00256 * Math.cos(omega * rad);

  const sinDec = Math.sin(epsilon * rad) * Math.sin(lambda * rad);
  const decl = Math.asin(Math.max(-1, Math.min(1, sinDec)));

  const yVar = Math.pow(Math.tan((epsilon * rad) / 2), 2);
  const L0rad = L0 * rad;
  const eqTime =
    4 *
    deg *
    (yVar * Math.sin(2 * L0rad) -
      2 * e * Math.sin(Mrad) +
      4 * e * yVar * Math.sin(Mrad) * Math.cos(2 * L0rad) -
      0.5 * yVar * yVar * Math.sin(4 * L0rad) -
      1.25 * e * e * Math.sin(2 * Mrad));

  const latRad = Math.max(-65, Math.min(65, lat)) * rad;
  const cosHa =
    (Math.cos(90.833 * rad) - Math.sin(latRad) * Math.sin(decl)) /
    (Math.cos(latRad) * Math.cos(decl));
  const clampedCosHa = Math.max(-1, Math.min(1, cosHa));
  const haDeg = Math.acos(clampedCosHa) * deg;

  const daylightMinutes = 8 * haDeg;
  const solarNoonUtcMin = 720 - 4 * lon - eqTime;
  const sunriseUtcMin = solarNoonUtcMin - 4 * haDeg;
  const sunsetUtcMin = solarNoonUtcMin + 4 * haDeg;

  return { daylightMinutes, sunriseUtcMin, sunsetUtcMin };
}

function parseHhMmToMinutes(hhmm?: string): number | null {
  if (!hhmm || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

/**
 * Computes rich daylight duration and daily gain/loss metrics for a commune and date.
 */
export function getDaylightInfo(
  latitude: number = 48.8566,
  longitude: number = 2.3522,
  dayOffset: number = 0,
  sunriseStr?: string,
  sunsetStr?: string,
  referenceDate: Date = new Date()
): DaylightInfo {
  let year = referenceDate.getUTCFullYear();
  let month = referenceDate.getUTCMonth();
  let day = referenceDate.getUTCDate();
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(referenceDate);
    parts.forEach((p) => {
      if (p.type === 'year') year = parseInt(p.value, 10);
      if (p.type === 'month') month = parseInt(p.value, 10) - 1;
      if (p.type === 'day') day = parseInt(p.value, 10);
    });
  } catch {
    // fallback to UTC getters
  }

  const targetDate = new Date(Date.UTC(year, month, day + dayOffset, 12, 0, 0));
  const prevDate = new Date(Date.UTC(year, month, day + dayOffset - 1, 12, 0, 0));
  const nextWeekDate = new Date(Date.UTC(year, month, day + dayOffset + 7, 12, 0, 0));

  const todaySolar = computeAstronomicalSolarDay(latitude, longitude, targetDate);
  const prevSolar = computeAstronomicalSolarDay(latitude, longitude, prevDate);
  const weekSolar = computeAstronomicalSolarDay(latitude, longitude, nextWeekDate);

  const deltaMinutesExact = todaySolar.daylightMinutes - prevSolar.daylightMinutes;
  const deltaSecondsTotal = Math.round(deltaMinutesExact * 60);
  const deltaMinutesRounded = Math.round(deltaMinutesExact);
  const isGaining = deltaSecondsTotal >= 0;

  const rawMorningDelta = prevSolar.sunriseUtcMin - todaySolar.sunriseUtcMin;
  const morningDeltaMinutes = Math.round(rawMorningDelta);
  const eveningDeltaMinutes = deltaMinutesRounded - morningDeltaMinutes;

  const weeklyDeltaMinutes = Math.round(weekSolar.daylightMinutes - todaySolar.daylightMinutes);

  const sunrise = sunriseStr || '07:30';
  const sunset = sunsetStr || '18:30';

  const srMin = parseHhMmToMinutes(sunrise);
  const ssMin = parseHhMmToMinutes(sunset);
  const dayLengthMinutes =
    srMin !== null && ssMin !== null && ssMin > srMin
      ? ssMin - srMin
      : Math.round(todaySolar.daylightMinutes);

  const hours = Math.floor(dayLengthMinutes / 60);
  const mins = dayLengthMinutes % 60;
  const dayLengthFormatted = `${hours}h ${mins.toString().padStart(2, '0')}m`;

  const absSec = Math.abs(deltaSecondsTotal);
  const absWholeMin = Math.floor(absSec / 60);
  const remSec = absSec % 60;
  const sign = isGaining ? '+' : '-';

  let badgeLabel: string;
  let shortDeltaLabel: string;
  if (absSec < 30) {
    badgeLabel = '±0 min/j';
    shortDeltaLabel = '±0 min';
  } else if (absWholeMin === 0) {
    badgeLabel = `${sign}${absSec} sec/j`;
    shortDeltaLabel = `${sign}${absSec}s`;
  } else {
    const roundedAbs = Math.max(1, Math.abs(deltaMinutesRounded));
    badgeLabel = `${sign}${roundedAbs} min / jour`;
    shortDeltaLabel = `${sign}${roundedAbs} min`;
  }

  const preciseDeltaLabel =
    absWholeMin === 0
      ? `${sign}${absSec} sec`
      : remSec > 0
      ? `${sign}${absWholeMin} min ${remSec.toString().padStart(2, '0')} s`
      : `${sign}${absWholeMin} min`;

  const roundedAbsMin = Math.max(1, Math.abs(deltaMinutesRounded));
  const headline =
    absSec < 30
      ? 'Durée du jour stable (Solstice)'
      : isGaining
      ? absWholeMin === 0
        ? `On gagne ${absSec} sec de soleil par jour`
        : `On gagne ${roundedAbsMin} min de soleil par jour`
      : absWholeMin === 0
      ? `On perd ${absSec} sec de soleil par jour`
      : `On perd ${roundedAbsMin} min de soleil par jour`;

  const targetYear = targetDate.getUTCFullYear();
  let solsticeContext = '';
  if (!isGaining) {
    let winterSolstice = new Date(Date.UTC(targetYear, 11, 21, 12, 0, 0));
    if (targetDate > winterSolstice) {
      winterSolstice = new Date(Date.UTC(targetYear + 1, 11, 21, 12, 0, 0));
    }
    const daysToWinter = Math.max(0, Math.round((winterSolstice.getTime() - targetDate.getTime()) / 86400000));
    solsticeContext =
      daysToWinter === 0
        ? "Solstice d'hiver aujourd'hui : les jours vont rallonger dès demain !"
        : `Les jours rallongeront dans ${daysToWinter} jour${daysToWinter > 1 ? 's' : ''} (21 déc.)`;
  } else {
    let summerSolstice = new Date(Date.UTC(targetYear, 5, 21, 12, 0, 0));
    if (targetDate > summerSolstice) {
      summerSolstice = new Date(Date.UTC(targetYear + 1, 5, 21, 12, 0, 0));
    }
    const daysToSummer = Math.max(0, Math.round((summerSolstice.getTime() - targetDate.getTime()) / 86400000));
    solsticeContext =
      daysToSummer === 0
        ? "Solstice d'été aujourd'hui : jour le plus long de l'année !"
        : `Jour le plus long dans ${daysToSummer} jour${daysToSummer > 1 ? 's' : ''} (21 juin)`;
  }

  return {
    sunrise,
    sunset,
    dayLengthMinutes,
    dayLengthFormatted,
    deltaMinutesExact,
    deltaMinutesRounded,
    deltaSecondsTotal,
    isGaining,
    morningDeltaMinutes,
    eveningDeltaMinutes,
    weeklyDeltaMinutes,
    badgeLabel,
    shortDeltaLabel,
    preciseDeltaLabel,
    headline,
    solsticeContext,
  };
}
