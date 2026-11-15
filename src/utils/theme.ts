/**
 * Thèmes visuels de l'application.
 *
 * `auto` ("Ciel vivant") est le rendu historique : le ciel suit l'heure et la
 * météo. Il n'ajoute AUCUN attribut au <html>, donc aucune règle de thème ne
 * s'applique et le design d'origine reste strictement inchangé.
 * Les autres thèmes posent `data-theme` sur <html> ; index.css redéfinit alors
 * les variables de couleur (dont les `--color-*` de Tailwind v4) et
 * ThemeBackdrop remplace le ciel animé.
 */
export type ThemeId = 'auto' | 'aurora' | 'kraft' | 'radar' | 'pop';

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  tagline: string;
  /** Couleur de la barre système mobile / fond avant le premier rendu. */
  topColor: string;
  /** Trois pastilles d'aperçu : fond, surface, accent. */
  swatch: [string, string, string];
  /** Aperçu du fond dans le sélecteur. */
  preview: string;
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'auto',
    label: 'Ciel vivant',
    tagline: "Suit l'heure et la météo",
    topColor: '#3878cf',
    swatch: ['#3878cf', '#5495e8', '#fbbf24'],
    preview:
      'linear-gradient(160deg,#3d7fd6,#7eb8f7 60%,#f2ae7a)',
  },
  {
    id: 'aurora',
    label: 'Aurore boréale',
    tagline: 'Nuit polaire, voiles verts et violets',
    topColor: '#0b1020',
    swatch: ['#0b1020', '#141b34', '#5ef2c0'],
    preview:
      'radial-gradient(circle at 25% 20%,rgba(61,224,176,.75),transparent 55%),radial-gradient(circle at 80% 30%,rgba(123,77,255,.8),transparent 55%),#0b1020',
  },
  {
    id: 'kraft',
    label: 'Papier Kraft',
    tagline: 'Carnet de météo ancien, encre et rouille',
    topColor: '#f2e8d5',
    swatch: ['#f2e8d5', '#e7d8bc', '#c4552d'],
    preview:
      'radial-gradient(circle at 85% 10%,#f2c39a,transparent 55%),linear-gradient(160deg,#f8f0e0,#e9dcc0)',
  },
  {
    id: 'radar',
    label: 'Terminal Radar',
    tagline: 'Écran de contrôle, vert phosphore',
    topColor: '#030a06',
    swatch: ['#030a06', '#08160d', '#3cff6b'],
    preview:
      'radial-gradient(circle at 50% 40%,#1b5a2c,#04100a 70%)',
  },
  {
    id: 'pop',
    label: 'Pop Party',
    tagline: 'Couleurs vives, formes pop, bords nets',
    topColor: '#ff3d8b',
    swatch: ['#ff3d8b', '#ffe14d', '#2de2e6'],
    preview:
      'radial-gradient(circle at 20% 20%,#ffe14d,transparent 45%),radial-gradient(circle at 85% 80%,#7b2cff,transparent 50%),linear-gradient(160deg,#ff3d6e,#ff9f1c)',
  },
];

export const THEME_STORAGE_KEY = 'meteo_pure_theme';

export function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function getThemeMeta(id: ThemeId): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function loadStoredTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeId(raw) ? raw : 'auto';
  } catch {
    return 'auto';
  }
}

export function storeTheme(id: ThemeId): void {
  try {
    if (id === 'auto') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, id);
  } catch {
    /* stockage indisponible : le thème vaut pour la session seulement */
  }
}

/** Pose (ou retire) l'attribut qui active les règles CSS du thème. */
export function applyThemeAttribute(id: ThemeId): void {
  const root = document.documentElement;
  if (id === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', id);
}
