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
      toneInstruction = "Le ton doit être bienveillant, diplomate, chaleureux et plein de sagesse d'un astrologue de bien-être. Encourage l'utilisateur, donne-lui une astuce positive.";
    } else if (humorLevel === 'spicy') {
      toneInstruction = "Le ton doit être cynique, sarcastique, moqueur, un brin pince-sans-rire. Taquine l'utilisateur sur son signe astrologique et la météo. Ne sois pas vulgaire mais sois très ironique.";
    } else {
      toneInstruction = "Le ton doit être extrêmement drôle, familier, argotique, un peu piquant, direct et théâtral. Utilise des expressions françaises fleuries, mais reste drôle, rafraîchissant et bienveillant au fond.";
    }

    const prompt = `Rédige un brief météo + horoscope ultra-créatif, varié, sur-mesure et personnalisé en français pour la journée.
Informations sur l'utilisateur :
- Signe Astrologique : ${sign}
- Date de naissance : ${birthDate}
- Ville actuelle : ${cityName}
- Météo du jour : ${weatherDesc} (Code météo WMO : ${weatherCode})

Instructions de style :
${toneInstruction}

Règles impératives :
1. Fais de l'humour, varie le style, ne copie pas les clichés astrologiques ennuyeux.
2. Crée une métaphore amusante entre l'état du ciel (météo) et la destinée de l'utilisateur (horoscope).
3. Ne dépasse pas 3 phrases ou 80 mots pour le corps de texte.
4. Reste unique et original à chaque génération.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
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
      if (data.title && data.body) return { title: data.title, body: data.body };
    }
    throw new Error('Invalid Gemini response');
  } catch (err) {
    console.error('[GEMINI] Failed:', err);
    const fallback = getMorningBriefContent(humorLevel as any, birthDate, weatherCode);
    return fallback || { title: `🔮 Brief Matinal ${sign}`, body: `Météo mitigée aujourd'hui.` };
  }
}
