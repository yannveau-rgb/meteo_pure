import { getMorningBriefContent, getZodiacSign } from '../../src/utils/notificationService.js';
import { buildMorningAnchor, MorningAnchorInput } from '../../src/utils/morningAnchor.js';
import { getDailyHoroscope, HoroscopeData, ZODIAC_METAS } from '../../src/utils/horoscopeService.js';

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

export interface MorningBrief {
  title: string;
  /** Factual, actionable line — computed in code, never by the model. */
  anchor: string;
  /** Short inspirational line tying the sign to the real weather. */
  punchline: string;
  /** Alias of `punchline`, kept so older consumers keep working. */
  body: string;
  ai?: boolean;
  model?: string;
  horoscope?: HoroscopeData;
}

export async function generateAiHoroscope(birthDate: string): Promise<HoroscopeData> {
  const fallback = getDailyHoroscope(birthDate);
  if (!process.env.MISTRAL_API_KEY) return fallback;

  const meta = ZODIAC_METAS[fallback.sign] || ZODIAC_METAS['Bélier'];
  const todayStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const prompt = `Rédige l'horoscope du jour en français pour le signe du ${meta.sign} (élément ${meta.element}, gouverné par ${meta.planet}).
Date : ${todayStr}.

Règles de rédaction :
1. Ton : bienveillant, inspirant, constructif et digne des meilleurs astrologues professionnels.
2. Pas de fatalisme, pas de prédictions anxiogènes ou irréalistes. Des conseils de sagesse et de dynamisme.
3. Chaque domaine doit comporter 2 à 3 phrases claires, harmonieuses et fluides.

Réponds UNIQUEMENT avec un JSON strict respectant cette structure exacte :
{
  "general": "Climat astral et ambiance générale de la journée",
  "love": "Conseils et tendances pour la vie affective et relationnelle",
  "career": "Dynamique professionnelle, projets et opportunités",
  "vitality": "Forme, énergie et équilibre bien-être",
  "advice": "Conseil clé ou mantra sage pour la journée"
}`;

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
          temperature: 0.75,
          max_tokens: 500,
        }),
      });

      if (!res.ok) continue;

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        if (parsed.general && parsed.love && parsed.career && parsed.vitality && parsed.advice) {
          return {
            ...fallback,
            general: String(parsed.general).trim(),
            love: String(parsed.love).trim(),
            career: String(parsed.career).trim(),
            vitality: String(parsed.vitality).trim(),
            advice: String(parsed.advice).trim(),
            ai: true,
          };
        }
      }
    } catch (e: any) {
      console.error(`[HOROSCOPE MISTRAL] ${model} failed:`, e.message || e);
    }
  }

  return fallback;
}

export async function generateAiMorningBrief(
  birthDate: string,
  weatherCode: number,
  humorLevel: string,
  cityName: string,
  anchorInput?: MorningAnchorInput
): Promise<MorningBrief> {
  const sign = getZodiacSign(birthDate);
  const weatherDesc = getWeatherDescription(weatherCode);

  // The factual line is always computed locally, whether or not the AI answers.
  const anchor = buildMorningAnchor(anchorInput ?? { weatherCode });
  const title = `${sign}`;

  const staticFallback = (): MorningBrief => {
    const fb = getMorningBriefContent(humorLevel as any, birthDate, weatherCode);
    const punchline = fb?.body ?? 'Journée ordinaire en perspective.';
    return { title, anchor, punchline, body: punchline, ai: false, horoscope: getDailyHoroscope(birthDate) };
  };

  if (!process.env.MISTRAL_API_KEY) return staticFallback();

  let toneInstruction = '';
  if (humorLevel === 'spicy') {
    toneInstruction = 'souriant, dynamique et plein d\'énergie positive';
  } else {
    toneInstruction = 'doux, bienveillant, encourageant et lumineux';
  }

  const seed = Math.floor(Math.random() * 99999);

  // The model writes ONLY the punchline. Facts are already handled by `anchor`,
  // so there is nothing here it could get numerically wrong.
  const prompt = `Écris UNE phrase courte, inspirante et positive en français, pour un ${sign}. SEED:${seed}

Contexte météo réel à ${cityName} : ${weatherDesc}
Ton : ${toneInstruction}

Règles :
1. Une seule phrase de 12 à 15 mots. Pas de mise en scène, pas de développement.
2. Relie un trait positif du caractère du ${sign} à la météo réelle ci-dessus pour encourager sa journée.
3. Reste toujours bienveillant, chaleureux et respectueux (aucun sarcasme, aucune moquerie).
4. Ne donne AUCUN chiffre (température, heure, pourcentage) — ils sont affichés ailleurs.
5. INTERDIT : "les astres", "alignement", "les étoiles vous réservent", "sous l'influence de".

Réponds UNIQUEMENT avec un JSON valide : {"punchline": "..."}`;

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
          temperature: 0.85,
          max_tokens: 120,
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
        const punchline = typeof parsed.punchline === 'string' ? parsed.punchline.trim() : '';
        if (punchline.length >= 10) {
          return { title, anchor, punchline, body: punchline, ai: true, model, horoscope: getDailyHoroscope(birthDate) };
        }
        console.error(`[MISTRAL] ${model} returned invalid content:`, content.slice(0, 200));
      }
    } catch (e: any) {
      console.error(`[MISTRAL] ${model} failed:`, e.message || e);
    }
  }

  console.error('[MISTRAL] All models failed, using fallback');
  return staticFallback();
}
