import { getMorningBriefContent, getZodiacSign } from '../../src/utils/notificationService.js';

function getWeatherDescription(code: number): string {
  if (code === 0) return 'Ciel totalement dégagé, grand soleil';
  if ([1, 2, 3].includes(code)) return 'Ciel peu nuageux ou très nuageux, pas de pluie';
  if ([45, 48].includes(code)) return 'Brouillard épais, visibilité réduite';
  if ([51, 53, 55].includes(code)) return 'Bruine fine ou crachin';
  if ([61, 63, 65].includes(code)) return 'Pluie modérée à forte';
  if ([71, 73, 75, 85, 86].includes(code)) return 'Chute de neige';
  if ([80, 81, 82].includes(code)) return 'Averses de pluie passagères';
  if ([95, 96, 99].includes(code)) return 'Orages violents';
  return 'Temps mitigé ou indéterminé';
}

export async function generateAiMorningBrief(
  birthDate: string,
  weatherCode: number,
  humorLevel: string,
  cityName: string
): Promise<{ title: string; body: string; ai?: boolean; model?: string; error?: string }> {
  const sign = getZodiacSign(birthDate);
  const weatherDesc = getWeatherDescription(weatherCode);

  if (!process.env.MISTRAL_API_KEY) {
    const fallback = getMorningBriefContent(humorLevel as any, birthDate, weatherCode);
    return fallback ? { ...fallback, ai: false } : { title: `🔮 Brief Matinal ${sign}`, body: `Météo mitigée aujourd'hui.`, ai: false };
  }

  let toneInstruction = '';
  if (humorLevel === 'safe') {
    toneInstruction = "Ton bienveillant, chaleureux, plein de sagesse douce. Encourage avec une astuce positive.";
  } else if (humorLevel === 'spicy') {
    toneInstruction = "Ton cynique, sarcastique, moqueur, pince-sans-rire. Pas vulgaire mais très ironique.";
  } else {
    toneInstruction = "Ton familier, argotique, piquant, direct et théâtral. Expressions françaises fleuries.";
  }

  const today = new Date();
  const dayOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][today.getUTCDay()];
  const dayOfMonth = today.getUTCDate();
  const monthName = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][today.getUTCMonth()];
  const seed = Math.floor(Math.random() * 99999);

  const angles = [
    "Aborde l'horoscope sous l'angle d'un conseil de survie absurde pour la journée",
    "Imagine que le signe astro est un personnage de film et décris sa journée météo",
    "Fais une analogie culinaire entre le temps qu'il fait et l'humeur du signe",
    "Écris comme si tu étais un commentateur sportif narrant la journée du signe",
    "Compare la météo à l'état émotionnel typique du signe, avec ironie",
    "Donne un horoscope sous forme de bulletin d'alerte météo intérieure",
    "Fais comme si le temps qu'il fait était un message personnel du destin au signe",
    "Écris l'horoscope comme une critique gastronomique de la journée",
    "Raconte la journée comme un épisode de série TV dont le signe est le héros",
    "Formule l'horoscope comme des instructions de montage IKEA pour la journée",
    "Présente la météo comme le karma du signe pour aujourd'hui",
    "Écris comme un coach de vie complètement à côté de la plaque",
    "Fais une métaphore animalière : quel animal est le signe par ce temps ?",
    "Présente la journée comme une quête de jeu vidéo pour le signe",
  ];
  const angle = angles[(dayOfMonth + seed) % angles.length];

  const prompt = `Rédige un brief météo + horoscope en français. SEED:${seed}

Date : ${dayOfWeek} ${dayOfMonth} ${monthName}
Signe : ${sign} | Ville : ${cityName}
Météo : ${weatherDesc} (WMO ${weatherCode})

Style : ${toneInstruction}

ANGLE CRÉATIF OBLIGATOIRE : ${angle}

Règles :
1. INTERDICTION : "les astres", "alignement", "les étoiles vous réservent", "sous l'influence de", "l'univers conspire", "les planètes s'alignent".
2. Intègre la VRAIE météo de ${cityName} dans la prédiction — pas juste décorative.
3. Maximum 3 phrases, 80 mots.
4. Titre percutant court (max 5 mots + 1 emoji).
5. Mentionne le jour (${dayOfWeek}).

Réponds UNIQUEMENT avec un JSON valide : {"title": "...", "body": "..."}`;

  const models = ['mistral-small-latest', 'open-mistral-nemo'];

  for (const model of models) {
    try {
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 1.2,
          max_tokens: 200,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`[MISTRAL] ${model} HTTP ${res.status}:`, errText.slice(0, 200));
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.title && parsed.body) {
          return { title: parsed.title, body: parsed.body, ai: true, model };
        }
      }
    } catch (e: any) {
      console.error(`[MISTRAL] ${model} failed:`, e.message || e);
    }
  }

  console.error('[MISTRAL] All models failed, using fallback');
  const fallback = getMorningBriefContent(humorLevel as any, birthDate, weatherCode);
  return fallback ? { ...fallback, ai: false } : { title: `🔮 Brief Matinal ${sign}`, body: `Météo mitigée aujourd'hui.`, ai: false };
}
