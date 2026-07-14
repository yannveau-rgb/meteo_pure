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
    toneInstruction = "doux et bienveillant, une petite touche de peps";
  } else if (humorLevel === 'spicy') {
    toneInstruction = "taquin, ironique, un peu moqueur";
  } else {
    toneInstruction = "franc, familier, bien envoyé";
  }

  const parisNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const dayOfWeek = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][parisNow.getDay()];
  const seed = Math.floor(Math.random() * 99999);

  const prompt = `Écris UNE punchline courte et drôle en français qui mélange l'horoscope du ${sign} et la météo réelle du jour. SEED:${seed}

Ville : ${cityName} | Météo : ${weatherDesc}
Ton : ${toneInstruction}

Règles :
1. Une seule phrase, 15 à 20 mots maximum. Pas de mise en scène, pas de développement — juste une punchline qui claque, comme une bonne réplique.
2. Doit faire référence à la vraie météo (${weatherDesc}) ET au signe (${sign}), pas juste l'un des deux.
3. INTERDICTION de dire "les astres", "alignement", "les étoiles vous réservent", "sous l'influence de".
4. Titre très court, 2-3 mots max + 1 emoji (ex: "☀️ Spécial ${sign}").

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
        const title = typeof parsed.title === 'string' ? parsed.title.trim() : '';
        const body = typeof parsed.body === 'string' ? parsed.body.trim() : '';
        if (title.length >= 3 && body.length >= 10) {
          return { title, body, ai: true, model };
        }
        console.error(`[MISTRAL] ${model} returned invalid content:`, content.slice(0, 200));
      }
    } catch (e: any) {
      console.error(`[MISTRAL] ${model} failed:`, e.message || e);
    }
  }

  console.error('[MISTRAL] All models failed, using fallback');
  const fallback = getMorningBriefContent(humorLevel as any, birthDate, weatherCode);
  return fallback ? { ...fallback, ai: false } : { title: `🔮 Brief Matinal ${sign}`, body: `Météo mitigée aujourd'hui.`, ai: false };
}
