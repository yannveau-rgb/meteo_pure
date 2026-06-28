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
  humorLevel: 'spicy',
  minMinutesBetweenAlerts: 30,
  rainNotificationsEnabled: true,
  stormNotificationsEnabled: true,
  alertNotificationsEnabled: true,
  birthDate: '',
};

/**
 * Hilarious, sarcastic and spicy rain warning messages in French
 */
const RAIN_MESSAGES: Record<
  NotificationIntensity,
  Record<HumorLevel, string[]>
> = {
  light: {
    safe: [
      "Un petit crachin s'annonce. Rien de bien méchant, mais pensez à votre capuche !",
      "Quelques gouttes arrivent pour hydrater les plantes... et peut-être votre brushing.",
      "Léger saupoudrage d'eau en cours de préparation. Le ciel hésite.",
      "Micro-bruine imminente. Inutile de sortir la combinaison de plongrée, mais restez vigilant.",
      "Le ciel va verser sa petite larme de calme. Un petit air frais et humide pointe le nez."
    ],
    spicy: [
      "Alerte crachin inutile. De quoi accompagner ta petite déprime existentielle et te gâcher le moral d'ici 10 minutes.",
      "Un petit pipi d'oiseau arrive. Un micro-crachin agaçant qui va juste saboter tes lunettes et ta joie de vivre.",
      "Il va moutonner un peu dehors. Pas besoin de sortir le scaphandre, mais évite de faire le fier avant la prochaine glissade tragique.",
      "Une petite pluie timide d'ici peu. Même pas foutue d'être un vrai déluge dévastateur pour abréger nos souffrances, c'est décevant.",
      "Le ciel a une mini déprime passive-agressive. Idéal pour repenser à tous tes échecs amoureux sous une bruine fadasse."
    ],
    vulgar: [
      "Alerte flotte de merde ! C'est juste un p'tit crachin de lâche pour te filer le cafard sans même avoir la décence de laver ta poubelle de voiture.",
      "Bruine à la con en approche. Juste assez moite pour coller tes fringues à ta peau flasque et te donner une odeur de rat mouillé.",
      "Ça va goutter mollement. Le nuage fait sa petite vidange de feignasse, aussi chiante et inutile que ton existence moyenne.",
      "Attention, gouttes casse-couilles imminentes. Tu ne vas pas mourir aujourd'hui, hélas, mais tu seras délicieusement agacé.",
      "Le ciel crachote sa bave tiède. Ferme la bouche en l’air si tu veux pas boire les larmes acides de l’univers déçu par ta présence."
    ]
  },
  moderate: {
    safe: [
      "Une averse modérée approche. Il est grand temps d'ouvrir les parapluies !",
      "Une vraie ondée se prépare d'ici quelques minutes. Mieux vaut s'abriter sous un porche.",
      "Le ciel rince la ville. De bons filets d'eau tiède arrivent, sors ton imperméable.",
      "Pluie rythmée en chemin. Une ambiance parfaite pour rester à l'intérieur avec une boisson chaude.",
      "Averses confirmées. Pensez à vos proches dehors et surtout, prenez un grand parapluie !"
    ],
    spicy: [
      "Une bonne douche gratuite arrive pour te rappeler qu'on n'échappe pas à son triste destin d'humain trempé.",
      "Le ciel a choisi de laver ta bagnole gratuite... idéal pour camoufler tes larmes quand tu réaliseras que ta vie n'a aucun sens.",
      "Ça commence à pisser sévère d'ici un quart d'heure. De quoi accélérer l'érosion du sol et de tes derniers espoirs de bonheur.",
      "Une ondée hostile arrive pour humidifier ton jean favori. Un détail agaçant, mais insignifiant face à la mort thermique de l'univers.",
      "Le ciel fait ruisseler ses filons. Parfait pour masquer tes pleurs extatiques pendant ta crise de la trentaine."
    ],
    vulgar: [
      "Alerte drache ! Trouve un abri avant de ressembler à un cadavre trempé repêché dans le canal municipal.",
      "Ça va pisser sec d'ici peu. Tes jolies baskets blanches vont se muer en piscines de désespoir boueux.",
      "Le ciel t'arrose copieusement la tronche. Idéal pour te rappeler que la nature te déteste autant que ton banquier.",
      "Une grosse averse qui tache arrive. Prépare-toi à te faire rincer le fion d'ici quelques minutes !",
      "Le nuage lâche sa pisse tiède. Cours chez toi ou accepte joyeusement ta punition mouillée hebdomadaire."
    ]
  },
  heavy: {
    safe: [
      "ALERTE DÉLUGE ! De très fortes averses arrivent d'ici quelques minutes. Restez bien à l'abri !",
      "Préparez vos imperméables de compétition, c'est une véritable tempête d'eau qui commence !",
      "Le ciel gronde et déverse des trombes d'eau. Mettez-vous d'urgence au chaud.",
      "Des précipitations intenses approchent. Attention aux flaques géantes et à l'aquaplaning !",
      "Véritable douche torrentielle imminente. Prenez vos précautions pour rester au sec !"
    ],
    spicy: [
      "ALERTE SAUVE-QUI-PEUT ! C'est l'apocalypse de flotte d'ici 15 minutes. Prépare ton cercueil gonflable, fissa !",
      "Là ça rigole plus : ça va tomber si fort que même les escargots vont demander l'asile politique. Reste planqué !",
      "Tempête imminente. Le vent va te gifler et la pluie va te purger de ton arrogance. Bon enterrement de week-end !",
      "Il tombe des hallebardes et des enclumes ! Reste au sec si tu tiens un minimum à ta pitoyable carcasse.",
      "Prépare-toi à te faire saucer légendairement. À ce niveau, c'est du harcèlement cybernétique de la part des nuages."
    ],
    vulgar: [
      "BORDEL DE MERDE ! C'est le déluge total en approche ! Reste planqué au fond de ton trou si tu veux pas finir noyé comme un rat d'égout.",
      "Une pluie de bâtard va s'abattre sur ta tronche de victime. Cours te cacher avant d'être rincé jusqu'aux os.",
      "Le ciel s'énerve grave et va te balancer des seaux de flotte glacée dans la gueule d'ici 10 minutes. De quoi te donner des envies de fin définitive.",
      "Apocalypse de flotte imminente. De toute façon ton avenir était bouché, alors autant finir dissous par l'orage, non ?",
      "La nature a décidé de t’anéantir à grands coups de torrents de pisse froids. Planque-toi ou crève, c'est ton choix !"
    ]
  },
  thunderstorm: {
    safe: [
      "ALERTE ORAGE ! Des éclairs et du tonnerre s'annoncent dans l'heure. Mettez-vous d'urgence à l'abri !",
      "Un risque d'orage approche. Soyez vigilants dehors, évitez de rester sous de grands arbres ou près de structures isolées.",
      "Alerte foudre imminente. Mettez-vous au sec dès les premiers grondements.",
      "Le ciel va gronder fortement d'ici peu. Une activité électrique est prévue dans les prochaines minutes.",
      "Atmosphère électrique en vue. Mettez-vous à l'abri le temps que la vague passe."
    ],
    spicy: [
      "Alerte foudre imminente : idéal pour recharger ton téléphone gratos si tu oses lever ton parapluie métallique bien haut. Spoiler : évite !",
      "Alerte coup de foudre non romantique ! Le ciel va gronder encore plus fort que ton patron en fin d'année. Rentre chez toi !",
      "Attention, ça va secouer ! Les nuages fêtent la fin de la semaine un peu trop bruyamment d'ici 30 minutes.",
      "Le ciel est plus sous tension que ton compte en banque un lendemain de fête. Planque-toi avant de servir de cible de fardeau électrique !",
      "Orage violent en approche ! Prépare-toi à un concert gratuit de décibels célestes et d'éclairs stroboscopiques."
    ],
    vulgar: [
      "ALERTE ORAGE DE BÂTARD ! Ça va péter dans tous les sens ! Rentre tes fesses rapido avant de griller sur place !",
      "Le ciel pète des câbles, de la foudre bien hargneuse s'annonce. C'est vraiment pas le moment de frimer dehors avec un parapluie pointu !",
      "Bordel de merde, la foudre arrive ! Prépare-toi à un bruit apocalyptique et rentre vite si tu veux pas finir rôti comme un poulet au four.",
      "Alerte foudre de dingue de niveau fin du monde ! Rentre immédiatement ou prépare-toi à finir carbonisé !",
      "La nature s'énerve grave et nous balance des millions de volts dans la gueule ! Rentre au chaud avant que ce soit le bordel total !"
    ]
  },
  end_rain: {
    safe: [
      "La pluie s'est arrêtée. Les nuages se dispersent doucement.",
      "Fin de l'averse. Le soleil devrait refaire son apparition très bientôt !",
      "Le temps redevient sec, vous pouvez ranger votre parapluie."
    ],
    spicy: [
      "La pluie s'arrête enfin d'ici peu. Profite de ces 5 minutes de répit avant que la pollution de la ville ne reprenne ses droits.",
      "Fin de rinçage imminente. Tu vas pouvoir replier ton parapluie cassé acheté 5€ à la sauvette sans t'éborgner.",
      "Incroyable : les nuages ont fini leur vidange de feignasses. Tu peux ressortir de ton abri miteux sans finir liquéfié."
    ],
    vulgar: [
      "La pluie s'arrête de pisser ! Les nuages se tirent enfin se faire voir ailleurs.",
      "Le ciel a fini de nous chier sa flotte sur la gueule. Tu vas pouvoir décoller tes fringues moites.",
      "Fin de la drache de merde ! Sors donc respirer l'air tiède saturé d'odeurs de fioul et de bitume."
    ]
  },
  end_storm: {
    safe: [
      "L'activité orageuse se calme et s'éloigne.",
      "Le tonnerre cesse de gronder. Le risque électrique s'estompe.",
      "Retour au calme après l'orage. Prenez soin de vous."
    ],
    spicy: [
      "L'orage s'éloigne. Ta box internet et ton chat traumatisé caché sous le lit vont enfin pouvoir revivre normalement.",
      "La nature a fini de piquer sa crise existentielle de décibels. Tu n'as plus d'excuses du dimanche pour glander.",
      "Les dieux de la météo ont fini de se hurler dessus. Retour de la platitude céleste ordinaire."
    ],
    vulgar: [
      "Fin de l'orage de bâtard ! Le ciel s'est enfin calmé le fion avec ses éclairs à la con.",
      "Le tonnerre arrête de nous casser les couilles. Tu peux rebrancher ta fichue console.",
      "La foudre est partie cramer des bouseux plus loin. Fin du spectacle pyrotechnique gratuit."
    ]
  },
  alert_yellow: {
    safe: [
      "Mise en place d'une vigilance jaune de Météo-France. Soyez attentifs lors de vos déplacements.",
      "Vigilance jaune déclarée pour votre secteur. Tenez-vous au courant de l'évolution de la situation.",
      "Alerte de niveau jaune. Des phénomènes habituels mais localement dangereux sont possibles."
    ],
    spicy: [
      "Météo-France lance une vigilance jaune. Sois moyennement attentif, ou fais semblant, comme d'habitude.",
      "Alerte jaune déclarée. Pas de quoi paniquer, mais évite de rester planté sous l'unique arbre mort du parc comme un glandu.",
      "C'est jaune, c'est mou, c'est la vigilance jaune. Idéal pour avoir un sujet de conversation inutile à la machine à café."
    ],
    vulgar: [
      "Vigilance jaune de merde activée. C'est juste pour que Météo-France se couvre si une branche te tombe sur le groin.",
      "Alerte jaune. Rien de bien folichon, ne mouille pas ton short tout de suite, c'est gérable.",
      "Vigilance jaune de feignasse. Fais gaffe mais sans trop te fouler les méninges non plus."
    ]
  },
  alert_orange: {
    safe: [
      "Vigilance Orange : phénomènes très dangereux prévus. Soyez extrêmement vigilants !",
      "Alerte orange déclarée. Évitez les déplacements non indispensables et les activités en plein air.",
      "Météo-France conseille la plus grande vigilance. Suivez scrupuleusement les consignes de sécurité."
    ],
    spicy: [
      "Vigilance orange ! Attache ton trampoline et tes derniers espoirs de passer un week-end tranquille.",
      "Alerte orange active. Reste planqué au chaud au lieu de faire le aventurier du dimanche. On n'a pas envie de te chercher dans un fossé.",
      "Niveau d'alerte orange. Les éléments vont coopérer pour te pourrir la vie de manière organisée et agressive."
    ],
    vulgar: [
      "ATTENTION BORDEL ! Vigilance orange déclarée ! Ça va secouer sévère, range tes affaires avant que le vent ne te les foute chez le voisin.",
      "Alerte orange de niveau vénère. Sors de là si tu veux pas te faire dégommer le portrait par une tuile volante.",
      "Vigilance de bâtard orange active. Ne fais pas le mariolle dehors sous peine de leçon d'humilité naturelle."
    ]
  },
  alert_red: {
    safe: [
      "ALERTE ROUGE VIGILANCE ABSOLUE : Phénomènes météorologiques d'intensité exceptionnelle en cours ou prévus.",
      "Danger extrême déclaré. Restez impérativement à l'abri, ne vous déplacez sous aucun prétexte.",
      "Météo-France alerte de dangers majeurs pour la sécurité des personnes. Respectez les consignes des autorités."
    ],
    spicy: [
      "ALERTE ROUGE ! L'apocalypse locale est en cours de téléchargement. Si tu sors maintenant, c'est de la sélection naturelle pure et dure.",
      "Alerte rouge totale ! Reste cloîtré chez toi, ferme les volets, fais des prières et commence à stocker de l'eau tiède.",
      "Vigilance rouge absolue. À ce niveau, même les arbres préfèrent s'asseoir. Reste vissé à ton canapé !"
    ],
    vulgar: [
      "ALERTE ROUGE DE MORT ! C'est la fin du monde dehors, ne sors même pas un orteil de ton taudis sous peine de désintégration.",
      "Bordel de merde, alerte rouge maximale ! Planque tout ce que tu possèdes et prie pour que ton toit ne s'envole pas dans l'espace.",
      "Sélection naturelle de niveau rouge sang activée. Reste chez toi ou crève comme le dernier des imbéciles !"
    ]
  },
  heatwave: {
    safe: [
      "La température dépasse les 30°C. Hydratez-vous régulièrement et privilégiez les endroits frais.",
      "Alerte forte chaleur déclarée. Pensez à limiter vos efforts physiques aux heures les plus chaudes de la journée.",
      "Il fait chaud aujourd'hui ! Restez au frais autant que possible."
    ],
    spicy: [
      "Alerte 30°C ! Préparez la crème indice 500, le short à fleurs de mauvais goût, et n'oubliez pas d'arroser votre cactus d'intérieur qui s'auto-combuste doucement.",
      "Il fait plus de 30°C dehors. Vos fesses vont fusionner instantanément avec les sièges de voiture en simili-cuir s'ils sont exposés au soleil. Réfugiez-vous près du frigo !",
      "30°C atteints ! À ce niveau-là, notre climatiseur imaginaire fait grève et les pingouins réclament des glaces au poisson. Bonne chance à votre carcasse humide !"
    ],
    vulgar: [
      "PUTAIN DE CANICULE ! Plus de 30 degrés ! C'est officiel, on cuit comme des merguez oubliées au barbecue. Sors la bière fraîche ou assume ton trépas !",
      "Chaleur de malade à plus de 30°C. Ton slip va fondre sur tes fesses si tu ne te réfugies pas dare-dare dans un congélo !",
      "Bordel de merde, plus de 30°C ! On transpire comme dans un hammam low-cost, prépare-toi à puer de la gueule et des aisselles d'ici 5 minutes !"
    ]
  }
};

const ALERT_TITLES: Record<HumorLevel, string[]> = {
  safe: [
    "💧 Alerte Humidité !",
    "🌧️ Ondée en approche",
    "🌂 Sortez les parapluies !",
    "💦 Ciel changeant imminent",
    "🌤️ Fin du mode sec"
  ],
  spicy: [
    "⚠️ Alerte Douche Gratuite !",
    "☔ Sortez Couverts !",
    "👀 On a détecté de la Flotte !",
    "💨 Ça va Humidifier Sévère",
    "👟 Sauvez vos Baskets !"
  ],
  vulgar: [
    "🤬 ALERTE DRACHE DE MERDE !",
    "😱 ÇA VA PISSER SÉVÈRE !",
    "⚡ PLANQUE TES FESSES !",
    "🖕 Trempé jusqu'au Slip !",
    "🌧️ Rincé Grave d'ici peu"
  ]
};

const THUNDERSTORM_TITLES: Record<HumorLevel, string[]> = {
  safe: [
    "⚡ Alerte Orage !",
    "⛈️ Le ciel va gronder",
    "🔌 Appareils en sécurité !",
    "🏠 Alerte Foudre !",
    "⛈️ Éclairs imminents"
  ],
  spicy: [
    "⚡ Alerte Coup de Foudre !",
    "⛈️ Électricité Gratuite !",
    "🤠 Sortez le Paratonnerre !",
    "🏠 Rentre Chez Toi !",
    "🌩️ Disco Électrique Déchaînée !"
  ],
  vulgar: [
    "🤬 ORAGE DE BÂTARD D'ICI PEU !",
    "😱 ÇA VA PÉTER GRAVE !",
    "⚡ PLANQUE TON CUL ORAIGEUX !",
    "🌩️ Chaud Devant, la Foudre arrive !",
    "🖕 Foudroyé comme un con !"
  ]
};

const END_RAIN_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🌤️ Fin de la pluie", "☀️ Retour des éclaircies", "💧 Fin de l'ondée"],
  spicy: ["🌤️ Alléluia, la flemme céleste s'arrête !", "🕶️ Alerte fermeture de parapluie", "☀️ Le robinet est coupé !"],
  vulgar: ["🤫 Enfin fini de chier de la flotte !", "🖕 Les nuages se cassent", "🌤️ Fin de rinçage, ouf !"]
};

const END_STORM_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🌩️ Fin de l'orage", "⚡ Fin de l'alerte foudre", "⛈️ Calme revenu"],
  spicy: ["🌩️ Fin des hostilités électriques", "🛡️ Menace céleste écartée", "🤐 Silence radio divin !"],
  vulgar: ["🤬 L'orage s'est barré !", "⚡ La foudre a fini sa crise", "💀 Retour du calme plat !"]
};

const ALERT_YELLOW_TITLES: Record<HumorLevel, string[]> = {
  safe: ["⚠️ Vigilance Jaune", "🔔 Soyez attentifs", "👀 Risque météo léger"],
  spicy: ["⚠️ Alerte Jaune : Vigilance de canapé", "🔔 C'est Jaune, c'est mollasson", "👀 Petit avertissement mesquin"],
  vulgar: ["🤬 VIGILANCE JAUNE À LA CON", "🖕 Alerte jaune, fait pas chier", "💀 Risques de merde minimes"]
};

const ALERT_ORANGE_TITLES: Record<HumorLevel, string[]> = {
  safe: ["⚠️ Vigilance Orange", "🔥 Soyez très vigilants", "🚨 Alerte météo importante"],
  spicy: ["⚡ Alerte Orange : Ça rigole plus !", "🔥 Alerte Orange : Alerte sérieuse !", "🚨 Préparez l'abri anti-cataclysme !"],
  vulgar: ["😱 ALERTE ORANGE SA MÈRE !", "🖕 Gros bordel météo imminent", "🚨 Planque ton cul, ça va fesser !"]
};

const ALERT_RED_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🟥 VIGILANCE ROUGE ABSOLUE", "🚨 DANGER TRÈS GRAND", "💀 Alerte météo maximale"],
  spicy: ["🚨 ALERTE ROUGE : Apocalypse imminente !", "💀 ALERTE ROUGE : Stay home ou crève", "🟥 Alerte Rouge : Sélection naturelle active !"],
  vulgar: ["🤬 APOCALYPSE ROUGE FRACASSANTE !", "💀 ROUGE SANG : C'est la fin du monde", "🖕 Alerte Rouge absolue de mes deux !"]
};

const HEATWAVE_TITLES: Record<HumorLevel, string[]> = {
  safe: ["🌡️ Alerte Forte Chaleur", "☀️ 30°C Dépassés !", "🥵 Soleil intense"],
  spicy: ["🌡️ Alerte Merguez !", "🔥 Cuisson moyenne à point !", "🏖️ Sahara Express ! Préservation vitale."],
  vulgar: ["🥵 ENFER EN COURS !", "🤬 PUTAIN DE CHALEUR TRICOLORE !", "🖕 Chaud comme la braise sa mère !"]
};

/**
 * Get a random funny alert message based on rain intensity with a spicy/biting humor
 * @param intensity The rain level ('light', 'moderate', 'heavy', 'thunderstorm', etc.)
 * @param _level Ignored parameter, kept for compatibility
 */
export function getFunnyRainMessage(intensity: NotificationIntensity, _level?: HumorLevel): { title: string, message: string } {
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

  const messages = [
    ...(chosenMessages?.spicy || []),
    ...(chosenMessages?.vulgar || []),
    ...(chosenMessages?.safe || [])
  ];
  
  const titles = [
    ...(chosenTitlesMap?.spicy || []),
    ...(chosenTitlesMap?.vulgar || []),
    ...(chosenTitlesMap?.safe || [])
  ];
  
  const randomMsgIndex = Math.floor(Math.random() * (messages.length || 1));
  const randomTitleIndex = Math.floor(Math.random() * (titles.length || 1));
  
  return {
    title: titles[randomTitleIndex] || "Alerte Météo",
    message: messages[randomMsgIndex] || "Le temps change."
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
      
      let title = "🌕 Alerte Pleine Lune !";
      let body = "Ce soir c'est la pleine lune, préparez vos potions magiques !";

      if (humorLevel === 'safe') {
        title = "🌕 Pleine lune ce soir";
        body = "La pleine lune éclairera la nuit de ce soir. Profitez-en !";
      } else if (humorLevel === 'spicy') {
        title = "🌕 Pleine Lune Imminente";
        body = "C'est la pleine lune ce soir ! Attachez vos loups-garous intérieurs, vos insomnies et vos collègues hystériques.";
      } else if (humorLevel === 'vulgar') {
        title = "🤬 PUTAIN DE PLEINE LUNE !";
        body = "Ce soir la lune va briller comme un phare de bagnole dans ta gueule. Prépare-toi à mal dormir et à être entouré de tarés.";
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

export function getSarcasticChristmasCountdownMessage(now: Date, humorLevel: HumorLevel): { title: string, body: string } {
  const days = getDaysUntilChristmas(now);
  
  const titleTemplates: Record<HumorLevel, string[]> = {
    safe: [
      `🎄 Alerte Cadeaux : J-${days} avant Noël !`,
      `🎅 Décompte de Noël : Encore ${days} jours`,
      `🎁 J-${days} : L'esprit de Noël arrive (lentement)`
    ],
    spicy: [
      `🎄 Plus que ${days} jours d'hypocrisie avant Noël !`,
      `💸 J-${days} avant la faillite bancaire de décembre !`,
      `🎅 Alerte Gremlins Festifs : J-${days} avant le calvaire familial`,
      `🤮 Ruine & Dinde Sèche : J-${days} d'attente forcée`
    ],
    vulgar: [
      `🖕 Plus que ${days} jours avant de te taper tes oncles bourrés !`,
      `💸 J-${days} et ta thune va encore dégager pour des cadeaux de merde !`,
      `🤮 Foutue dinde et hypocrisie de fin de saison : J-${days} avant le drame !`,
      `🎄 J-${days} avant que le gros barbu rouge te l'enfonce bien profond !`
    ]
  };

  const bodyTemplates: Record<HumorLevel, string[]> = {
    safe: [
      `Encore ${days} jours d'attente studieuse. Pensez à commencer à lister vos envies et à préparer votre lettre au Père Noël.`,
      `Le temps passe vite ! Plus que ${days} jours avant de déguster les chocolats sous le sapin de Noël.`,
      `Déjà J-${days} avant la dinde aux marrons. C'est le moment de réfléchir aux cadeaux pour vos proches !`
    ],
    spicy: [
      `Plus que ${days} jours à tirer avant d'offrir une bougie parfumée à 5€ achetée à la va-vite que ta belle-mère va immédiatement revendre sur Vinted ou offrir à quelqu'un d'autre. Courage.`,
      `Prépare ton foie et ton compte en banque : encore ${days} jours avant de feindre l'extase devant une écharpe beige tricotée par une grand-tante qui a perdu la vue en 1998.`,
      `J-${days} ! C'est exactement le moment idéal pour paniquer sur le prix du saumon fumé alors qu'on est en plein milieu de l'année. Ne change rien à tes priorités financières désastreuses.`,
      `À J-${days} de Noël, ton compte d'épargne tremble déjà d'effroi. Rappelle-toi que le bonheur ne s'achète pas, sauf pour les gosses qui pleureront si c'est pas la bonne console de jeux.`
    ],
    vulgar: [
      `Bordel, encore ${days} foutus jours de patience avant de devoir embrasser tes cousins insupportables et simuler un orgasme mental devant une boîte de chocolats low-cost périmée.`,
      `J-${days} ! Prépare ta thune de merde pour acheter des cadeaux à des gens que tu ne peux pas blairer les 11 autres mois de l'année. Joyeux capitalisme cul-béni !`,
      `Plus que ${days} jours de répit avant de bouffer de la dinde farcie trop sèche et d'avoir une chiasse monumentale à cause des huîtres tièdes de ton oncle Gérard. Magnifique perspective.`,
      `Optimise ton foie d'oie dès maintenant : encore ${days} jours de calvaire avant le marathon de bouffe grasse, l'overdose de champagne tiède et les disputes politiques à table.`
    ]
  };

  const titles = titleTemplates[humorLevel] || titleTemplates['spicy'];
  const bodies = bodyTemplates[humorLevel] || bodyTemplates['spicy'];

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
      `🎄 Janvier déjà ! Plus que ${days} jours avant Noël`,
      `🎄 Février : ${days} jours pour préparer Noël`,
      `🌷 Mars : ${days} jours avant les cadeaux`,
      `🐣 Avril : encore ${days} jours de répit`,
      `☀️ Mai fleuri, ${days} jours avant Noël`,
      `🏖️ Juin : ${days} jours avant la hotte`,
      `🌞 Mi-chemin ! ${days} jours avant Noël`,
      `🌴 Août : ${days} jours avant la dinde`,
      `🍂 Septembre sonne : J-${days} pour Noël`,
      `🎃 Octobre : ${days} jours avant les cadeaux`,
      `🍁 Novembre : J-${days} avant Noël !`,
      `🔔 Décembre : Noël dans ${days} jours !`,
    ],
    spicy: [
      `🥂 Ça repart. ${days} jours avant de te ruiner à Noël`,
      `💘 Mois de l'amour, ${days} jours avant le vide du compte`,
      `🌷 Printemps et dèjà ${days} jours jusqu'à l'horreur familiale`,
      `🐟 Poisson d'avril ? Non, Noël dans ${days} jours — c'est vrai`,
      `💸 Mai : ${days} jours pour pas économiser un centime`,
      `☀️ Profite du soleil. Dans ${days} jours : dinde, oncles soûls`,
      `🌊 Mi-parcours. ${days} jours avant le carnage budgétaire de Noël`,
      `🏖️ Vacances ? Dans ${days} jours tu fais la queue aux caisses`,
      `🍂 Rentrée. Les décos de Noël arrivent et il reste ${days} jours`,
      `🎃 Citrouilles et décos Noël en rayon : encore ${days} jours`,
      `🌧️ Novembre gris. ${days} jours avant de feindre la joie en famille`,
      `⏰ Décembre. ${days} jours et le Père Noël vide ton compte`,
    ],
    vulgar: [
      `🥂 Bonne année et merde. Noël dans ${days} jours, ta thune aussi`,
      `💘 Mois de l'amour. Dans ${days} jours : cadeaux de merde et sourires forcés`,
      `🌷 Printemps en fleurs, faillite en ${days} jours. Magnifique`,
      `🐟 Dans ${days} jours tu te taperas la bouffe de Noël. Joyeuses fêtes de tes morts`,
      `💸 Mai, ça pousse. Ta thune aussi — vers la sortie dans ${days} jours`,
      `☀️ Il fait beau. Profites-en : dans ${days} jours c'est la merde de Noël`,
      `🌊 Mi-parcours vers le calvaire. ${days} jours avant Noël, courage l'ami`,
      `🏖️ En vacances ? Dans ${days} jours tu coures dans les rayons cadeaux comme un con`,
      `🍂 La rentrée et ses emmerdes. Noël rajoute sa couche dans ${days} jours`,
      `🎃 Halloween c'est quoi comparé à Noël ? Dans ${days} jours, l'horreur vraie`,
      `🌧️ Novembre pluvieux et déprimant. Dans ${days} jours : Noël par-dessus la merde`,
      `⏰ Plus que ${days} jours avant que tout le monde te casse les couilles avec Noël`,
    ],
  };

  // Corps : contexte du mois, cinglant
  const bodies: Record<HumorLevel, string[]> = {
    safe: [
      `La nouvelle année commence à peine et Noël revient déjà pointer le bout de son nez. ${days} jours pour anticiper vos achats et éviter la panique de décembre !`,
      `Février file vite. ${days} jours pour peaufiner votre liste de cadeaux avant que les rayons soient dévalisés.`,
      `Le printemps arrive et Noël se rapproche doucement. ${days} jours pour commencer à économiser.`,
      `Joyeux poisson ! Noël n'est pas une blague : encore ${days} jours avant le réveillon.`,
      `Le mois de mai ouvre la saison des beaux jours. ${days} jours pour préparer Noël sereinement.`,
      `L'été pointe le bout de son nez, et Noël aussi (dans ${days} jours). Profitez du soleil d'abord.`,
      `À mi-chemin entre deux Noëls. ${days} jours exactement vous séparent de la fête.`,
      `Bonne détente estivale. Noël arrive dans ${days} jours — autant le planifier depuis la plage.`,
      `La rentrée est là, et Noël dans ${days} jours. Le temps file !`,
      `Décos de Noël en rayon dès maintenant… et pour cause : plus que ${days} jours.`,
      `Novembre, mois de la Toussaint et des premières décos lumineuses. Noël dans ${days} jours.`,
      `Le compte à rebours final est lancé : ${days} jours et Noël est là !`,
    ],
    spicy: [
      `Le champagne du réveillon n'est pas encore digéré et ta liste de cadeaux pour Noël prochain te regarde déjà. ${days} jours. Commence à mettre des sous de côté — spoiler : tu le feras pas.`,
      `${days} jours pour trouver un cadeau original. Tu finiras comme chaque année par une bougie et un livre qu'on te conseille depuis ton historique Amazon. On ne change pas.`,
      `${days} jours. Le temps de voir pousser les jonquilles, de faire semblant de faire du sport en avril et de procrastiner sur les cadeaux jusqu'en décembre. Le cycle est immuable.`,
      `Noël dans ${days} jours. Autant de temps pour oublier complètement cet avertissement et paniquer en décembre devant des rayons vides. Bonne chance.`,
      `Encore ${days} jours avant l'hémorragie bancaire traditionnelle. L'économie de marché se porte bien grâce à toi, chaque année, sans faute.`,
      `${days} jours de soleil avant le blizzard budgétaire. Les vendeurs de marché de Noël frottent déjà leurs mains. Toi, profite du barbecue.`,
      `${days} jours. Tu es exactement à mi-parcours entre deux éditions du même calvaire festif. Statistiquement, tu n'as toujours pas changé. Félicitations.`,
      `${days} jours depuis ta chaise longue. Tes neveux ont déjà leur liste prête depuis mars. Ta liste à toi : inexistante. On se retrouve en décembre comme d'habitude.`,
      `Rentrée et Noël dans ${days} jours. La mauvaise nouvelle c'est que les décos envahissent déjà les Leclerc. La pire : tu n'as rien économisé cet été.`,
      `Octobre, le mois où les supermarchés mélangent citrouilles et boules de Noël. Plus que ${days} jours. Commencez à flipper correctement.`,
      `${days} jours. Tu n'as rien préparé. Tu savais pourtant depuis janvier. Même chose l'an prochain.`,
      `Plus que ${days} jours. Les colis Amazon se télescopent, les files de caisse s'allongent et ton compte tremble. Le grand soir approche.`,
    ],
    vulgar: [
      `Noël dans ${days} jours. Ta gueule de bois du 1er janvier est à peine dissipée que le prochain carnage financier est déjà programmé. Magnifique système, non ?`,
      `${days} putains de jours avant que tu achètes des cadeaux de merde à des gens qui en feront autant pour toi. L'humanité dans toute sa splendeur consumériste.`,
      `${days} jours avant le rituel annuel de la ruine organisée. Le printemps arrive, les oiseaux chantent, et ta thune va bientôt morfler. Profite.`,
      `Dans ${days} jours, tu ouvriras un cadeau emballé à la va-vite et tu feras semblant d'être ravi. On se pratique dès maintenant ? Parfait.`,
      `${days} jours. Le mois de mai, c'est beau, ça sent la liberté. Décembre, ça sent la dinde trop sèche et les dettes. Savourez la différence.`,
      `Il fait chaud, tu glandes. Dans ${days} jours tu seras à genoux devant un rayon Fnac bondé. Profite du barbecue, connard (avec affection).`,
      `Mi-parcours de la vie en direction du Noël prochain. ${days} jours. Tu es toujours aussi impréparé qu'au premier janvier. C'est respectable dans sa constance.`,
      `${days} jours. Tu prends des coups de soleil pendant que tes gosses écrivent leur liste au Père Noël avec un budget délirant. Belle vie.`,
      `La rentrée et ses emmerdes habituelles. Bonne nouvelle : dans seulement ${days} jours, Noël rajoutera une couche. Y'a des traditions qu'on respecte.`,
      `Halloween dans quelques semaines, Noël dans ${days} jours. En France on arrive même plus à profiter d'une fête à la fois. Bien joué la société.`,
      `${days} jours. T'as rien préparé, rien économisé, et tu le sais très bien. Même chose l'an dernier. Le cercle vicieux est fermé et toi tu souris bêtement.`,
      `${days} jours avant que les fêtes te fracassent le porte-monnaie une fois de plus. Décembre est là, et avec lui l'avalanche habituelle de conneries festives.`,
    ],
  };

  const t = titles[humorLevel] ?? titles.spicy;
  const b = bodies[humorLevel] ?? bodies.spicy;

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
      sun: ["Belle journée ensoleillée en perspective.", "Le soleil brille, profitez-en.", "Journée lumineuse et agréable."],
      rain: ["La pluie arrose votre journée.", "Pensez au parapluie aujourd'hui.", "Journée humide mais cosy."],
      storm: ["Attention aux orages aujourd'hui.", "Journée électrique en perspective.", "Temps agité, restez prudent."],
      cloud: ["Ciel couvert mais doux.", "Les nuages veillent sur vous.", "Journée grise mais tranquille."]
    },
    spicy: {
      sun: [
        "Le soleil tape comme ton boss un lundi : sans pitié.",
        "Grand beau temps, dommage que ta vie soit pas aussi radieuse.",
        "Soleil éclatant. Ta motivation, elle, reste au point mort.",
        "Le ciel est bleu, ton découvert aussi.",
        "Temps magnifique. L'ironie c'est que t'es coincé à l'intérieur.",
        "Le soleil fait des heures sup. Toi non."
      ],
      rain: [
        "Il pleut des cordes, comme tes espoirs de productivité.",
        "Temps idéal pour rester au lit et réfléchir à tes choix de vie.",
        "Averse prévue. Comme ta motivation : par intermittence.",
        "La pluie lave tout sauf ta conscience.",
        "Crachin mélancolique. Ton humeur matche parfaitement.",
        "Dehors il flotte, dedans tu coules. Belle symétrie."
      ],
      storm: [
        "Orage imminent. Évite de lever le doigt en réunion.",
        "Le ciel gronde plus fort que ton estomac vide.",
        "Tempête dehors, chaos dedans. Tu gères comme d'habitude : mal.",
        "Tonnerre et éclairs. Ta journée sera à la hauteur.",
        "Orage prévu. Autant d'énergie que t'en auras jamais.",
        "Le ciel fait une crise. Toi aussi, bientôt."
      ],
      cloud: [
        "Grisaille permanente, comme ton feed LinkedIn.",
        "Ciel bas et moral assorti. La routine quoi.",
        "Nuages lourds. Comme tes paupières ce matin.",
        "Temps maussade. Comme ta playlist du lundi.",
        "Le ciel hésite entre rien et pas grand-chose. Toi aussi.",
        "Couverture nuageuse complète. Comme ton planning : opaque."
      ]
    },
    vulgar: {
      sun: [
        "Putain de soleil de malade. Sors de ta tanière.",
        "Grand beau bordel. Même le ciel se moque de ta journée de merde.",
        "Soleil qui défonce. Ta crème solaire va prendre cher.",
        "Un temps de ouf, dommage que ta gueule soit pas raccord.",
        "Le soleil tape. Comme la réalité ce matin.",
        "Il fait beau à crever. Littéralement si t'as pas d'eau."
      ],
      rain: [
        "Il pisse dehors. Reste couché, y'a rien à sauver.",
        "Temps de merde intégral. Parfait pour une journée de merde.",
        "Flotte à mort. Comme tes ambitions : noyées.",
        "Il pleut comme vache qui pisse. Poétique.",
        "Déluge. Le ciel chiale plus fort que toi hier soir.",
        "Averse de fou. Même ton chat veut pas sortir."
      ],
      storm: [
        "Bordel ça pète dehors ! Fais pas le con avec un parapluie.",
        "Orage de dingue. Comme ta vie : bruyant et destructeur.",
        "Ça foudroie de partout. Reste chez toi, sérieux.",
        "Tempête de ouf. Le ciel est en PLS complet.",
        "Éclairs, tonnerre, le bordel. Au moins c'est pas chiant.",
        "Ça défouraille dans le ciel. Spectacle gratuit, profite."
      ],
      cloud: [
        "Ciel grisâtre, morne et chiant. Un classique.",
        "Gris partout. Comme ton avenir professionnel.",
        "Plafond bas de merde. Ta journée sera à l'image.",
        "Nuages de déprime. Le ciel fait la gueule, toi aussi.",
        "Temps pourri sans conviction. Même la pluie a la flemme.",
        "Gris béton. L'architecte de ta journée était bourré."
      ]
    }
  };

  const signPhrases: Record<string, string[]> = {
    'Bélier': [
      "Fonce tête baissée, comme d'hab. Ça passera. Ou pas.",
      "Ta patience a la durée de vie d'un Snap. Respire.",
      "Aujourd'hui tu vas vouloir tout casser. Limite-toi au plafond de verre.",
      "Tes cornes sont chargées. Épargne tes collègues.",
      "L'impulsivité, c'est ton cardio du matin.",
      "Tu vas foncer dans un mur. Au moins ce sera avec panache.",
      "Énergie de guerrier, stratégie de hamster dans une roue.",
      "Ta diplomatie ce matin : inexistante. Bravo.",
      "Tu démarres au quart de tour. Les freins, c'est pour les autres."
    ],
    'Taureau': [
      "Têtu comme une enclume. Pas un compliment.",
      "Lâche ce croissant. Ton body summer n'est plus qu'un souvenir.",
      "Aujourd'hui : routine, confort, déni. Le triptyque parfait.",
      "Tu vas résister au changement. Comme hier. Et avant-hier.",
      "Ta zone de confort est un bunker anti-progrès.",
      "Obstination légendaire. Tu confonds ça avec du caractère.",
      "Rien ne te fera bouger. Même pas cette notification.",
      "Journée contemplative. C'est joli pour dire 'j'ai rien foutu'.",
      "Tu vas manger trois fois trop. Sans regret. Respect."
    ],
    'Gémeaux': [
      "Tes deux personnalités vont pas être d'accord aujourd'hui.",
      "Tu vas parler pour dix. Écouter pour zéro.",
      "Indécision chronique : tu hésites même sur ta tenue.",
      "Mensonge du jour : 'J'arrive dans 5 minutes'.",
      "Un bavard introverti un jour, un timide survolté le lendemain.",
      "Ta double vie est épuisante. Pour les autres.",
      "Tu changeras d'avis six fois avant midi. Record personnel en vue.",
      "Papillonner c'est ton sport. Les résultats, moins.",
      "Tu vas lancer trois projets et en finir zéro. La constance."
    ],
    'Cancer': [
      "Sensible à la température, à l'humidité, au regard du boulanger.",
      "Ne pleure pas. Enfin si, mais discrètement.",
      "Ta carapace protège un cœur de guimauve fondante.",
      "Aujourd'hui tu vas prendre tout personnellement. Comme d'hab.",
      "Éponge émotionnelle du bureau. Essore-toi.",
      "Tu vas te vexer pour un truc anodin. Le grand classique.",
      "Nostalgie matinale : tu regrettes déjà hier.",
      "Ton intuition dit danger. Ton intuition dit toujours danger.",
      "Tu vas nourrir tout le monde et oublier de manger."
    ],
    'Lion': [
      "Oui tu es formidable. Non, 8h c'est trop tôt pour le rappeler.",
      "Ta majesté va devoir attendre son café avant de régner.",
      "Crinière en bataille ce matin. Le trône attendra.",
      "Tu vas prendre toute la place en réunion. Comme d'habitude.",
      "Ego surdimensionné dans un open space sous-dimensionné.",
      "Le monde ne tourne pas autour de toi. Mais chut.",
      "Tu brilles. Malheureusement c'est la sueur.",
      "Besoin de compliments pour démarrer. Voilà : t'es okay.",
      "Roi de la savane, esclave de ton réveil."
    ],
    'Vierge': [
      "Tout ranger, tout trier, tout optimiser. Personne n'a demandé.",
      "Ton perfectionnisme va encore ralentir tout le monde.",
      "Plan de journée en 47 étapes. Rien ne va se passer comme prévu.",
      "Critique constructive ou destructrice ? On penche pour la deux.",
      "Le chaos autour de toi te rend physiquement malade.",
      "Tu vas corriger les fautes d'orthographe de tout le monde. Mentalement.",
      "Un poil maniaque ? Non, complètement maniaque.",
      "L'imprévu te donne de l'urticaire. Bonne journée.",
      "Tu as déjà fait ta to-do list à 6h. Bravo (et aide-toi)."
    ],
    'Balance': [
      "Choisis un truc. N'importe quoi. Mais choisis.",
      "Ton indécision est un art. Un art chiant.",
      "Équilibre précaire entre productivité et procrastination.",
      "Tu vas peser le pour et le contre pendant 3 heures pour un sandwich.",
      "Diplomate-né. Traduction : tu n'oses pas dire non.",
      "Hésiter entre le café et le thé : 20 minutes de perdues.",
      "Ton sens de la justice va te jouer des tours.",
      "Tu vas plaire à tout le monde et t'oublier toi-même.",
      "Harmonie recherchée, chaos obtenu. Le paradoxe Balance."
    ],
    'Scorpion': [
      "Garde ton venin pour après le déjeuner au moins.",
      "Intense dès le réveil. Tes voisins de pallier compatissent.",
      "Non, un regard noir n'est pas un bonjour.",
      "Mystérieux ? Non, renfermé. Y'a une nuance.",
      "Tu vas stalker quelqu'un sur les réseaux. On le sait.",
      "Ta rancune a une meilleure mémoire que toi.",
      "Passion ou obsession ? La frontière est floue chez toi.",
      "Se venger est ton hobby. Aujourd'hui c'est jour de pratique.",
      "Profondeur émotionnelle : un gouffre sans fond."
    ],
    'Sagittaire': [
      "Ton optimisme irrationnel va encore frapper.",
      "Envie de voyager ? Commence par aller au bureau.",
      "Philosophe du matin : des grandes idées, zéro exécution.",
      "Ta franchise va blesser au moins trois personnes avant midi.",
      "Liberté chérie. Traduction : allergie aux responsabilités.",
      "Tu vas promettre monts et merveilles. Livrer des collines.",
      "Aventurier du quotidien : tu prends un autre chemin pour aller bosser.",
      "Ton enthousiasme fatigue les introvertis autour de toi.",
      "Grand discours ce matin. Application : la semaine prochaine. Peut-être."
    ],
    'Capricorne': [
      "Bosseur acharné ou robot ? La frontière s'estompe.",
      "Ton ambition dépasse tes heures de sommeil.",
      "Austère, efficace, pas drôle. Le profil LinkedIn parfait.",
      "Le plaisir c'est pour les faibles. Tu travailles, toi.",
      "Ton tableau Excel est prêt à détruire des vies.",
      "Discipline de fer, personnalité de granit. Fun zéro.",
      "Tu planifies tes vacances comme une opération militaire.",
      "Le travail c'est la vie. Ta vie sociale, elle, est morte.",
      "Objectifs atteints. Bonheur ? Pas dans le KPI."
    ],
    'Verseau': [
      "Idées de génie ou conneries monumentales ? Pile ou face.",
      "Original comme un hipster qui dit 'je suis pas hipster'.",
      "Ton besoin d'indépendance fatigue même ta wifi.",
      "Rebelle dans l'âme, conformiste en pyjama.",
      "Tu vas proposer une idée révolutionnaire. Personne n'écoutera.",
      "Excentrique du matin : tu mets tes chaussettes dépareillées.",
      "Détaché des conventions. Attaché à ton téléphone.",
      "Humanitaire de canapé. Tu likes des pétitions en mangeant.",
      "Trop en avance sur ton temps. Ou juste à côté de la plaque."
    ],
    'Poissons': [
      "Tes pieds touchent rarement le sol. Aujourd'hui non plus.",
      "Intuition de médium, pragmatisme de méduse.",
      "Tu vas rêvasser la moitié de la matinée. L'autre moitié aussi.",
      "Empathie débordante : tu pleures devant une pub.",
      "Ton monde imaginaire est plus intéressant que la réalité. C'est un problème.",
      "Nager à contre-courant, c'est pas de la natation, c'est du masochisme.",
      "Tes émotions changent comme la marée. Toutes les six heures.",
      "Artiste incompris ou incompétent ? Le mystère reste entier.",
      "Tu vas absorber l'humeur de tout le bureau. Éponge humaine."
    ]
  };

  const weatherPool = weatherPhrases[humorLevel]?.[weatherType] || weatherPhrases.spicy[weatherType];
  const signPool = signPhrases[sign] || ["L'univers t'ignore aujourd'hui. C'est mérité."];

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

  let body = '';
  if (humorLevel === 'safe') {
    body = `Bonjour ${sign} ! ${weatherLine} ${signLine}`;
  } else {
    body = `${weatherLine} ${signLine}`;
  }

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
  birthDate?: string
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
          currentConditions: weather ? {
            temperature: weather.current.temperature,
            precipitation: weather.current.precipitation,
            weatherCode: weather.current.weatherCode
          } : null
        })
      });
      return true;
    }
  } catch (err) {
    console.error('Error syncing Push subscription with server:', err);
  }
  return false;
}

/**
 * Silent background re-sync: call on every app load when notifs are enabled.
 * Re-sends the existing push subscription to the server so the endpoint stays fresh.
 * If the subscription was rotated by the browser, creates a new one.
 */
export async function refreshPushSubscription(
  commune: any,
  humorLevel: HumorLevel,
  birthDate?: string
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
        body: JSON.stringify({ subscription: sub, commune, humorLevel, birthDate })
      });
    }
  } catch (e) {
    console.warn('[PUSH] silent refresh failed:', e);
  }
}
