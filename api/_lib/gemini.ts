import { GoogleGenAI, Type } from '@google/genai';
import { getMorningBriefContent, getZodiacSign } from '../../src/utils/notificationService.js';

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY missing');
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { 'User-Agent': 'meteo-pure' } }
    });
  }
  return aiClient;
}

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
): Promise<{ title: string; body: string }> {
  const sign = getZodiacSign(birthDate);
  const weatherDesc = getWeatherDescription(weatherCode);

  if (!process.env.GEMINI_API_KEY) {
    const fallback = getMorningBriefContent(humorLevel as any, birthDate, weatherCode);
    return fallback || { title: `🔮 Brief Matinal ${sign}`, body: `Météo mitigée aujourd'hui.` };
  }

  try {
    const ai = getGeminiClient();

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
      "Fais comme si le temps qu'il fait était un message personnel de l'univers au signe",
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
1. INTERDICTION de réutiliser ces formules : "les astres", "alignement", "les étoiles vous réservent", "sous l'influence de", "l'univers conspire", "les planètes s'alignent". Trouve des formulations ORIGINALES.
2. Intègre la VRAIE météo de ${cityName} dans la prédiction astro — pas juste une mention décorative.
3. Maximum 3 phrases, 80 mots.
4. Le titre doit être percutant et court (max 5 mots + 1 emoji).
5. Mentionne le jour de la semaine (${dayOfWeek}) pour ancrer le message.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 1.4,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Un titre court (max 4-5 mots) incluant un emoji adapté' },
            body: { type: Type.STRING, description: 'Le texte du brief combinant horoscope et météo. Maximum 80 mots.' }
          },
          required: ['title', 'body']
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text.trim());
      if (data.title && data.body) return { title: data.title, body: data.body, ai: true };
    }
    throw new Error('Invalid Gemini response');
  } catch (err) {
    console.error('[GEMINI] Failed:', err);
    const fallback = getMorningBriefContent(humorLevel as any, birthDate, weatherCode);
    return fallback ? { ...fallback, ai: false } : { title: `🔮 Brief Matinal ${sign}`, body: `Météo mitigée aujourd'hui.`, ai: false };
  }
}
