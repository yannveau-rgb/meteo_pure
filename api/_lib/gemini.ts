import { getMorningBriefContent, getZodiacSign } from '../../src/utils/notificationService.js';
import { buildMorningAnchor, MorningAnchorInput } from '../../src/utils/morningAnchor.js';

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
  /** Short humorous line tying the sign to the real weather. */
  punchline: string;
  /** Alias of `punchline`, kept so older consumers keep working. */
  body: string;
  ai?: boolean;
  model?: string;
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
    return { title, anchor, punchline, body: punchline, ai: false };
  };

  if (!process.env.MISTRAL_API_KEY) return staticFallback();

  let toneInstruction = '';
  if (humorLevel === 'safe') {
    toneInstruction = 'doux et bienveillant, une petite touche de peps';
  } else if (humorLevel === 'spicy') {
    toneInstruction = 'taquin, ironique, un peu moqueur';
  } else {
    toneInstruction = 'franc, familier, bien envoyé';
  }

  const seed = Math.floor(Math.random() * 99999);

  // The model writes ONLY the punchline. Facts are already handled by `anchor`,
  // so there is nothing here it could get numerically wrong.
  const prompt = `Écris UNE punchline courte et drôle en français, pour un ${sign}. SEED:${seed}

Contexte météo réel à ${cityName} : ${weatherDesc}
Ton : ${toneInstruction}

Règles :
1. Une seule phrase de 12 à 15 mots. Pas de mise en scène, pas de développement.
2. Doit relier le trait de caractère du ${sign} à la météo réelle ci-dessus.
3. Ne donne AUCUN chiffre (température, heure, pourcentage) — ils sont affichés ailleurs.
4. INTERDIT : "les astres", "alignement", "les étoiles vous réservent", "sous l'influence de".

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
          temperature: 1.1,
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
          return { title, anchor, punchline, body: punchline, ai: true, model };
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
