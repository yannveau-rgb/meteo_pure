import { getZodiacSign } from './notificationService';

export type ZodiacElement = 'Feu' | 'Terre' | 'Air' | 'Eau';

export interface ZodiacMeta {
  sign: string;
  symbol: string;
  element: ZodiacElement;
  planet: string;
  period: string;
  keywords: string[];
}

export interface HoroscopeData {
  sign: string;
  symbol: string;
  element: ZodiacElement;
  planet: string;
  period: string;
  date: string;
  general: string;
  love: string;
  career: string;
  vitality: string;
  advice: string;
  luckyNumber: number;
  compatibility: string;
  ai?: boolean;
}

export const ZODIAC_METAS: Record<string, ZodiacMeta> = {
  'Bélier': {
    sign: 'Bélier',
    symbol: '♈',
    element: 'Feu',
    planet: 'Mars',
    period: '21 mars - 19 avril',
    keywords: ['Énergie', 'Courage', 'Initiative', 'Leadership']
  },
  'Taureau': {
    sign: 'Taureau',
    symbol: '♉',
    element: 'Terre',
    planet: 'Vénus',
    period: '20 avril - 20 mai',
    keywords: ['Patience', 'Sérénité', 'Fiabilité', 'Persévérance']
  },
  'Gémeaux': {
    sign: 'Gémeaux',
    symbol: '♊',
    element: 'Air',
    planet: 'Mercure',
    period: '21 mai - 20 juin',
    keywords: ['Curiosité', 'Communication', 'Adaptabilité', 'Créativité']
  },
  'Cancer': {
    sign: 'Cancer',
    symbol: '♋',
    element: 'Eau',
    planet: 'Lune',
    period: '21 juin - 22 juillet',
    keywords: ['Intuition', 'Sensibilité', 'Protection', 'Bienveillance']
  },
  'Lion': {
    sign: 'Lion',
    symbol: '♌',
    element: 'Feu',
    planet: 'Soleil',
    period: '23 juillet - 22 août',
    keywords: ['Rayonnement', 'Générosité', 'Chaleur', 'Ambition']
  },
  'Vierge': {
    sign: 'Vierge',
    symbol: '♍',
    element: 'Terre',
    planet: 'Mercure',
    period: '23 août - 22 septembre',
    keywords: ['Méthode', 'Sens du détail', 'Pragmatisme', 'Dévouement']
  },
  'Balance': {
    sign: 'Balance',
    symbol: '♎',
    element: 'Air',
    planet: 'Vénus',
    period: '23 septembre - 22 octobre',
    keywords: ['Harmonie', 'Diplomatie', 'Équilibre', 'Esthétique']
  },
  'Scorpion': {
    sign: 'Scorpion',
    symbol: '♏',
    element: 'Eau',
    planet: 'Pluton & Mars',
    period: '23 octobre - 21 novembre',
    keywords: ['Lucidité', 'Intensité', 'Perspicacité', 'Résilience']
  },
  'Sagittaire': {
    sign: 'Sagittaire',
    symbol: '♐',
    element: 'Feu',
    planet: 'Jupiter',
    period: '22 novembre - 21 décembre',
    keywords: ['Optimisme', 'Aventure', 'Franchise', 'Élévation']
  },
  'Capricorne': {
    sign: 'Capricorne',
    symbol: '♑',
    element: 'Terre',
    planet: 'Saturne',
    period: '22 décembre - 19 janvier',
    keywords: ['Rigueur', 'Constance', 'Responsabilité', 'Ambition']
  },
  'Verseau': {
    sign: 'Verseau',
    symbol: '♒',
    element: 'Air',
    planet: 'Uranus & Saturne',
    period: '20 janvier - 18 février',
    keywords: ['Originalité', 'Humanisme', 'Indépendance', 'Innovation']
  },
  'Poissons': {
    sign: 'Poissons',
    symbol: '♓',
    element: 'Eau',
    planet: 'Neptune & Jupiter',
    period: '19 février - 20 mars',
    keywords: ['Empathie', 'Imagination', 'Douceur', 'Inspiration']
  }
};

const THEMES_GENERAL: Record<string, string[]> = {
  Feu: [
    "Un influx d'enthousiasme dynamise votre journée. Votre audace naturelle vous incite à prendre les devants et à inspirer votre entourage.",
    "Votre créativité est à son apogée. Vous débordez d'élan pour concrétiser ce qui vous tient à cœur avec une belle assurance.",
    "Une journée stimulante où votre présence ne passe pas inaperçue. Les planètes soutiennent votre esprit d'initiative et votre rayonnement.",
    "Les astres réveillent votre passion et votre détermination. C'est le moment idéal pour démarrer un nouveau chapitre avec optimisme."
  ],
  Terre: [
    "Une journée particulièrement productive sous le signe de la méthode et de la tranquillité d'esprit. Vos fondations sont solides.",
    "Le climat astral favorise la réflexion posée et les décisions mûrement réfléchies. Vous avancez avec constance et efficacité.",
    "Votre bon sens et votre pragmatisme légendaire désamorcent les petites tensions du quotidien avec une grande élégance.",
    "Stabilité et harmonie rythment votre journée. C'est une excellente période pour structurer vos projets à moyen et long terme."
  ],
  Air: [
    "Votre vivacité intellectuelle et votre aisance relationnelle ouvrent de magnifiques opportunités d'échange et de partage.",
    "Les influences astrales décuplent votre curiosité. Vos échanges sont fluides, stimulants et enrichissants.",
    "Un souffle de renouveau et d'inspiration traverse votre ciel. Vous trouvez des solutions inventives à chaque défi rencontré.",
    "Une journée propice à la sociabilité et aux découvertes. Votre écoute et votre diplomatie font des merveilles auprès de vos pairs."
  ],
  Eau: [
    "Votre intuition remarquable est votre plus fidèle boussole aujourd'hui. Faites confiance à vos premiers ressentis.",
    "Une belle sensibilité s'exprime dans vos relations. Vous créez une atmosphère apaisante et bienveillante autour de vous.",
    "Les courants astraux favorisent l'écoute intérieure et la créativité émotionnelle. Vous trouvez une profonde paix intérieure.",
    "Journée idéale pour vous ressourcer et cultiver des liens authentiques. Votre empathie touche ceux qui vous sont chers."
  ]
};

const THEMES_LOVE: Record<string, string[]> = {
  Feu: [
    "En couple, la flamme se ravive à travers des attentions spontanées. Célibataire, votre magnétisme chaleureux attire de beaux regards.",
    "La passion et la sincérité sont à l'honneur. Exprimez vos sentiments sans détour, votre générosité touchera droit au cœur.",
    "Une complicité joyeuse rythme vos échanges affectifs. Vous savez partager votre joie de vivre et créer des moments inoubliables."
  ],
  Terre: [
    "En amour, vous privilégiez la tendresse, la sécurité et la loyauté. Les gestes simples et prévenants consolident vos liens précieux.",
    "Un climat d'écoute sereine renforce la confiance mutuelle. Vous posez des bases saines et durables pour votre vie affective.",
    "Votre présence rassurante apporte un profond réconfort à votre partenaire. Les célibataires apprécient les rencontres sincères."
  ],
  Air: [
    "Le dialogue est la clé d'or de votre journée. Une discussion sincère et complice rapproche les cœurs avec beaucoup de douceur.",
    "Pétillant et séduisant, vous misez sur l'humour et la légèreté pour désamorcer les non-dits et illuminer votre relation.",
    "De nouvelles affinités intellectuelles et affectives se révèlent. Vos échanges sont empreints de fraîcheur et de liberté mutuelle."
  ],
  Eau: [
    "Une belle harmonie de cœur vous enveloppe. Votre tendresse et votre écoute profonde permettent une totale authenticité.",
    "L'empathie et la délicatesse guident vos gestes. Vous comprenez intuitivement les besoins émotionnels de l'autre.",
    "Un moment privilégié de partage et d'émotions sincères consolide vos attaches les plus chères."
  ]
};

const THEMES_CAREER: Record<string, string[]> = {
  Feu: [
    "Au travail, votre détermination et votre leadership naturel emportent l'adhésion de vos collègues et supérieurs.",
    "Une opportunité stimulante se profile : saisissez-la avec confiance sans hésiter à montrer votre expertise.",
    "Votre proactivité est récompensée. Vous bouclez des dossiers importants avec brio et rapidité."
  ],
  Terre: [
    "Votre rigueur exemplaire et votre organisation méthodique vous permettent de franchir des étapes décisives avec brio.",
    "Les questions financières ou logistiques trouvent des réponses claires et rassurantes grâce à votre minutie.",
    "Un travail de fond porte enfin ses fruits. Vos efforts constants inspirent la confiance et la reconnaissance générale."
  ],
  Air: [
    "Votre créativité et vos talents de négociateur sont sollicités. Vos propositions originales rencontrent un vif succès.",
    "La coopération d'équipe est particulièrement féconde. Votre facilité à coordonner les idées crée une vraie dynamique collective.",
    "Vous faites preuve d'une agilité intellectuelle remarquable pour adapter votre stratégie aux imprévus professionnels."
  ],
  Eau: [
    "Votre créativité et votre perspicacité vous permettent de voir au-delà des apparences et de trouver l'angle parfait.",
    "Les projets nécessitant de la diplomatie et de la psychologie relationnelle vous réussissent tout particulièrement.",
    "Faites confiance à votre flair professionnel : il vous oriente avec précision vers les bonnes collaborations."
  ]
};

const THEMES_VITALITY: Record<string, string[]> = {
  Feu: [
    "Votre niveau d'énergie est excellent. Canalisez cet élan vital dans une activité physique revigorante.",
    "Forme éclatante aujourd'hui ! Pensez simplement à vous hydrater régulièrement et à vous accorder des pauses respiration.",
    "Un tonus remarquable vous accompagne. Profitez-en pour vous aérer l'esprit et profiter du grand air."
  ],
  Terre: [
    "Une endurance stable et régulière. Privilégiez une alimentation équilibrée et une marche au contact de la nature.",
    "Votre équilibre corporel est au beau fixe. Respectez votre rythme de sommeil pour maintenir cette belle sérénité.",
    "Vitalité harmonieuse. Prenez le temps de vous étirer et de relâcher les tensions musculaires accumulées."
  ],
  Air: [
    "Bonne vitalité nerveuse et intellectuelle. Offrez-vous quelques instants de calme loin des écrans pour reposer vos yeux.",
    "Votre corps répond parfaitement à vos envies de mouvement. La pratique d'exercices de respiration vous procurera un grand bien-être.",
    "Dynamisme léger et agréable. Veillez à maintenir une bonne régularité dans vos heures de repos."
  ],
  Eau: [
    "Votre sensibilité vous invite à prendre soin de votre bien-être intérieur. Une séance de relaxation ou un bon bain chaud fera merveille.",
    "Énergie fluide et régénérante. Écoutez attentivement les signaux de votre corps et préservez des moments de ressourcement au calme.",
    "Une belle récupération physique et mentale. Accordez-vous un moment de méditation ou de lecture apaisante en soirée."
  ]
};

const ADVICES: string[] = [
  "Cultivez la gratitude pour les petites victoires du quotidien : elles construisent les grands succès.",
  "La patience n'est pas une attente passive, mais l'art d'avancer sereinement sans précipitation.",
  "Écoutez votre voix intérieure, elle sait toujours quelle est la direction la plus juste pour vous.",
  "Votre bienveillance envers les autres commence par la douceur que vous vous accordez à vous-même.",
  "Chaque journée apporte son lot de renouveau : accueillez l'inattendu avec curiosité et confiance.",
  "Prenez le temps d'apprécier la beauté qui vous entoure, elle nourrit durablement votre esprit.",
  "Faites confiance au tempo de votre vie : tout arrive au moment opportun avec persévérance.",
  "La simplicité est souvent la clé de voûte des réussites les plus durables et harmonieuses."
];

const COMPATIBLE_SIGNS: Record<string, string[]> = {
  'Bélier': ['Lion', 'Sagittaire', 'Balance'],
  'Taureau': ['Vierge', 'Capricorne', 'Cancer'],
  'Gémeaux': ['Balance', 'Verseau', 'Bélier'],
  'Cancer': ['Scorpion', 'Poissons', 'Taureau'],
  'Lion': ['Bélier', 'Sagittaire', 'Gémeaux'],
  'Vierge': ['Taureau', 'Capricorne', 'Scorpion'],
  'Balance': ['Gémeaux', 'Verseau', 'Lion'],
  'Scorpion': ['Cancer', 'Poissons', 'Vierge'],
  'Sagittaire': ['Bélier', 'Lion', 'Verseau'],
  'Capricorne': ['Taureau', 'Vierge', 'Poissons'],
  'Verseau': ['Gémeaux', 'Balance', 'Sagittaire'],
  'Poissons': ['Cancer', 'Scorpion', 'Capricorne']
};

export function getDailyHoroscope(birthDate: string, targetDate: Date = new Date()): HoroscopeData {
  const sign = getZodiacSign(birthDate);
  const effectiveSign = ZODIAC_METAS[sign] ? sign : 'Bélier';
  const meta = ZODIAC_METAS[effectiveSign];

  const dayOfYear = Math.floor(
    (targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const signOffset = effectiveSign.charCodeAt(0) + effectiveSign.length * 7;
  const hash = Math.abs(dayOfYear * 13 + signOffset);

  const element = meta.element;
  const generalList = THEMES_GENERAL[element];
  const loveList = THEMES_LOVE[element];
  const careerList = THEMES_CAREER[element];
  const vitalityList = THEMES_VITALITY[element];

  const general = generalList[hash % generalList.length];
  const love = loveList[(hash + 1) % loveList.length];
  const career = careerList[(hash + 2) % careerList.length];
  const vitality = vitalityList[(hash + 3) % vitalityList.length];
  const advice = ADVICES[(hash + 4) % ADVICES.length];

  const compatList = COMPATIBLE_SIGNS[effectiveSign] || ['Balance', 'Lion'];
  const compatibility = compatList[(hash + 5) % compatList.length];
  const luckyNumber = ((hash % 89) + 1);

  const formattedDate = targetDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    sign: meta.sign,
    symbol: meta.symbol,
    element: meta.element,
    planet: meta.planet,
    period: meta.period,
    date: formattedDate,
    general,
    love,
    career,
    vitality,
    advice,
    luckyNumber,
    compatibility,
    ai: false
  };
}
