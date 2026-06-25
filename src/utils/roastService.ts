import { WeatherData } from '../types';

// Fragments for premium, subtle weather roasts (Spicy irony level)

export interface RoastFragment {
  text: string;
  condition?: (w: WeatherData, isNight: boolean) => boolean;
}

// 1. INTRODUCTIONS
const INTROS: RoastFragment[] = [
  // Generaux
  { text: "Bilan du jour :" },
  { text: "Verdict de l'atmosphère :" },
  { text: "Diagnostic scientifique :" },
  { text: "Constat amiable :" },
  { text: "Au menu aujourd'hui :" },
  { text: "Alerte existentielle :" },
  { text: "État des lieux :" },
  { text: "Point de situation :" },
  { text: "Rapport météo :" },
  { text: "En direct du ciel :" },
  
  // Chaleur
  { 
    text: "Mode rôtissoire activé :", 
    condition: (w) => w.current.temperature >= 30 
  },
  { 
    text: "Canicule oblige :", 
    condition: (w) => w.current.temperature >= 33 
  },
  { 
    text: "Soleil thermique :", 
    condition: (w) => (w.daily[0]?.uvIndex ?? 0) >= 6 && w.current.temperature >= 25 
  },
  { 
    text: "Surchauffe système :", 
    condition: (w) => w.current.temperature >= 30 || w.current.feelsLike >= 32 
  },

  // Froid
  { 
    text: "Alerte cryogénisation :", 
    condition: (w) => w.current.temperature <= 6 
  },
  { 
    text: "Aurore polaire improvisée :", 
    condition: (w) => w.current.temperature <= 2 
  },
  { 
    text: "Abonnement hivernal :", 
    condition: (w) => w.current.temperature <= 10 
  },

  // Pluie
  { 
    text: "Alerte rincée générale :", 
    condition: (w) => w.current.precipitation > 0 || [51, 53, 55, 61, 63, 65, 80, 81, 82].includes(w.current.weatherCode) 
  },
  { 
    text: "Épisode de douche gratuite :", 
    condition: (w) => w.current.precipitation > 0 
  },
  { 
    text: "Humidité maximale :", 
    condition: (w) => w.current.humidity >= 85 
  },

  // Vent
  { 
    text: "Aéro-sèche-cheveux gratuit :", 
    condition: (w) => w.current.windSpeed >= 40 
  },
  { 
    text: "Soufflerie géante branchée :", 
    condition: (w) => w.current.windSpeed >= 50 
  },

  // Brouillard
  { 
    text: "Flou artistique absolu :", 
    condition: (w) => [45, 48].includes(w.current.weatherCode) 
  },

  // Orages
  { 
    text: "Ambiance fin du monde :", 
    condition: (w) => [95, 96, 99].includes(w.current.weatherCode) 
  },

  // Nuit
  { 
    text: "Rapport nocturne :", 
    condition: (_, isNight) => isNight 
  },
  { 
    text: "Insomnie météorologique :", 
    condition: (w, isNight) => isNight && w.current.temperature >= 22 
  }
];

// 2. OBSERVATIONS (The descriptive weather Roast part)
const OBSERVATIONS: RoastFragment[] = [
  // Chaleur Extrême (>= 35)
  { 
    text: "les murs commencent joyeusement à fondre,", 
    condition: (w) => w.current.temperature >= 35 
  },
  { 
    text: "l'air ambiant a le goût et la consistance d'une soupe tiédie au micro-ondes,", 
    condition: (w) => w.current.temperature >= 33 
  },
  { 
    text: "votre corps expérimente un sauna involontaire et totalement gratuit,", 
    condition: (w) => w.current.temperature >= 30 
  },
  { 
    text: "le bitume essaie d'établir un contact fusionnel avec vos semelles,", 
    condition: (w) => w.current.temperature >= 32 
  },

  // Chaleur modérée / Chaud (25 - 30)
  { 
    text: "la température est assez élevée pour justifier une réévaluation de vos choix vestimentaires,", 
    condition: (w) => w.current.temperature >= 25 && w.current.temperature < 30 
  },
  { 
    text: "votre ventilateur tourne plus vite que l'économie nationale,", 
    condition: (w) => w.current.temperature >= 26 
  },
  { 
    text: "la chaleur extérieure refuse poliment mais fermement de quitter les appartements,", 
    condition: (w) => w.current.temperature >= 24 
  },

  // Températures indécises (15 - 24)
  { 
    text: "on oscille entre l'envie d'une veste et le regret immédiat de l'avoir mise,", 
    condition: (w) => w.current.temperature >= 15 && w.current.temperature < 20 
  },
  { 
    text: "une température incapable de prendre une vraie décision de saison,", 
    condition: (w) => w.current.temperature >= 14 && w.current.temperature < 21 
  },
  { 
    text: "le ciel propose un gris neutre tout droit sorti d'une pub de peinture éco-responsable,", 
    condition: (w) => [0, 1, 2, 3].includes(w.current.weatherCode) && w.current.temperature >= 15 && w.current.temperature < 22 
  },

  // Froid (0 - 10)
  { 
    text: "le grand air vous propose un gommage du visage à base de glace pure,", 
    condition: (w) => w.current.temperature <= 8 && w.current.temperature > 0 
  },
  { 
    text: "les orteils se solidarisent pour former un conglomérat de glaçons inertes,", 
    condition: (w) => w.current.temperature <= 6 
  },
  { 
    text: "l'extérieur fait office de congélateur industriel à ciel ouvert,", 
    condition: (w) => w.current.temperature <= 4 
  },

  // Gel (< 0)
  { 
    text: "votre haleine se transforme instantanément en nuage de fumée digne d'une locomotive,", 
    condition: (w) => w.current.temperature <= 0 
  },
  { 
    text: "l'atmosphère pique les yeux et vous rappelle la dureté de l'existence,", 
    condition: (w) => w.current.temperature <= -1 
  },

  // Pluie Faible
  { 
    text: "une bruine persistante conçue spécialement pour gâcher votre coiffure,", 
    condition: (w) => [51, 53, 55, 61].includes(w.current.weatherCode) 
  },
  { 
    text: "un crachin discret qui mouille sans avoir l'honnêteté de l'assumer,", 
    condition: (w) => [51, 53, 55].includes(w.current.weatherCode) 
  },

  // Pluie Forte
  { 
    text: "le ciel vide littéralement son disque dur sur vos têtes,", 
    condition: (w) => [63, 65, 80, 81, 82].includes(w.current.weatherCode) || w.current.precipitation > 2 
  },
  { 
    text: "une pluie tellement dense que même les poissons demandent un abri,", 
    condition: (w) => w.current.precipitation > 4 
  },

  // Vent Fort
  { 
    text: "un vent si fort que les arbres se prosternent devant la puissance de l'air,", 
    condition: (w) => w.current.windSpeed >= 40 
  },
  { 
    text: "des rafales vigoureuses qui rendent la tenue d'un parapluie comique,", 
    condition: (w) => w.current.windSpeed >= 50 
  },

  // Brouillard
  { 
    text: "le paysage ressemble à un calque photoshop dont on a baissé l'opacité à 10%,", 
    condition: (w) => [45, 48].includes(w.current.weatherCode) 
  },

  // Orages
  { 
    text: "un concert cosmique gratuit avec jeux de lumière agressifs,", 
    condition: (w) => [95, 96, 99].includes(w.current.weatherCode) 
  },

  // Général / Fallsback
  { text: "la météo du jour n'a clairement aucun respect pour vos projets extérieurs," },
  { text: "le ciel a décidé d'agir de manière totalement arbitraire," },
  { text: "les capteurs de la station météo expriment une lassitude profonde," },
  { text: "les oiseaux eux-mêmes hésitent à quitter leur nid sous ces auspices," }
];

// 3. PUNCHLINES (The funny final piece)
const PUNCHLINES: RoastFragment[] = [
  // Generaux
  { text: "bref, restez chez vous si possible." },
  { text: "bon courage aux personnes obligées de sortir." },
  { text: "optimisme obligatoire pour survivre à cette journée." },
  { text: "on a connu des lundis plus inspirants, même un dimanche." },
  { text: "une journée parfaite pour binge-watcher sous un plaid." },
  { text: "un point positif : cela fera un sujet de conversation à la machine à café." },
  { text: "faites semblant que tout va bien, les nuages finiront par s'en lasser." },
  { text: "on attend toujours la mise à jour corrective de mère nature." },
  { text: "clairement, le stagiaire de la météo a touché à des boutons interdits." },
  { text: "l'un des pires jours pour tester un nouveau produit capillaire." },

  // Chaleur
  { 
    text: "la climatisation est désormais un droit de l'homme non négociable.", 
    condition: (w) => w.current.temperature >= 31 
  },
  { 
    text: "votre déodorant combat actuellement pour sa propre survie.", 
    condition: (w) => w.current.temperature >= 29 
  },
  { 
    text: "bon courage pour trouver le 'côté frais' de votre oreiller ce soir.", 
    condition: (w) => w.current.temperature >= 28 || w.current.feelsLike >= 30 
  },
  { 
    text: "on frôle la température interne d'une pizza surgelée en cours de cuisson.", 
    condition: (w) => w.current.temperature >= 34 
  },
  { 
    text: "pensez à vous hydrater, ou à vous liquéfier proprement.", 
    condition: (w) => w.current.temperature >= 30 
  },

  // Froid
  { 
    text: "l'air pique plus intensément qu'une facture de chauffage imprévue.", 
    condition: (w) => w.current.temperature <= 4 
  },
  { 
    text: "le concept même d'été semble être une légende urbaine lointaine.", 
    condition: (w) => w.current.temperature <= 8 
  },
  { 
    text: "il est temps de sortir la tenue complète d'astronaute thermique.", 
    condition: (w) => w.current.temperature <= 2 
  },
  { 
    text: "votre nez a officiellement pris une teinte rouge de détresse.", 
    condition: (w) => w.current.temperature <= 5 
  },

  // Pluie
  { 
    text: "votre parapluie s'apprête à se retourner contre vous au premier coup de vent.", 
    condition: (w) => w.current.precipitation > 0 && w.current.windSpeed >= 25 
  },
  { 
    text: "l'occasion rêvée d'arborer un magnifique look de chien mouillé chic.", 
    condition: (w) => w.current.precipitation > 0 
  },
  { 
    text: "l'humidité ambiante garantit un taux d'échec de 100% sur vos cheveux.", 
    condition: (w) => w.current.humidity >= 80 
  },

  // Vent
  { 
    text: "les poubelles du quartier réclament poliment leur indépendance.", 
    condition: (w) => w.current.windSpeed >= 70 
  },
  { 
    text: "les coiffures structurées relèvent désormais de la pure théorie.", 
    condition: (w) => w.current.windSpeed >= 40 
  },

  // Brouillard
  { 
    text: "veuillez naviguer à vue entre vos regrets et vos illusions d'optique.", 
    condition: (w) => [45, 48].includes(w.current.weatherCode) 
  },

  // Orages
  { 
    text: "pensez à débrancher vos box internet, ou profitez du spectacle son et lumière.", 
    condition: (w) => [95, 96, 99].includes(w.current.weatherCode) 
  },

  // Nuit
  { 
    text: "dormir la fenêtre ouverte relève désormais du pari pascalien.", 
    condition: (w, isNight) => isNight && w.current.temperature >= 21 
  },
  { 
    text: "le silence nocturne est seulement perturbé par le bruit de vos propres regrets.", 
    condition: (_, isNight) => isNight 
  }
];

/**
 * Combines matching fragments to generate a smart, premium dynamic weather roast.
 * By combining randomly selected matching parts, we get thousands of unique sentences.
 */
export function generateWeatherRoast(weather: WeatherData, isNight: boolean): string {
  // 1. Filter matching fragments
  const validIntros = INTROS.filter(f => !f.condition || f.condition(weather, isNight));
  const validObservations = OBSERVATIONS.filter(f => !f.condition || f.condition(weather, isNight));
  const validPunchlines = PUNCHLINES.filter(f => !f.condition || f.condition(weather, isNight));

  // 2. Select randomly
  const intro = validIntros[Math.floor(Math.random() * validIntros.length)]?.text || "Diagnostic :";
  const obs = validObservations[Math.floor(Math.random() * validObservations.length)]?.text || "l'atmosphère fait des siennes,";
  const punch = validPunchlines[Math.floor(Math.random() * validPunchlines.length)]?.text || "bon courage.";

  // 3. Assemble perfectly formatted sentence
  return `${intro} ${obs} ${punch}`;
}
