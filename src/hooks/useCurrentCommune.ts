import { useEffect, useState } from 'react';
import { Commune } from '../types';

const STORAGE_KEY = 'meteo_pure_last_commune';

const DEFAULT_COMMUNE: Commune = {
  nom: 'Paris',
  code: '75056',
  codesPostaux: ['75001'],
  centre: { type: 'Point', coordinates: [2.3522, 48.8566] },
  codeDepartement: '75'
};

export function useCurrentCommune() {
  const [showWelcomePrompt, setShowWelcomePrompt] = useState<boolean>(
    () => !localStorage.getItem(STORAGE_KEY)
  );

  const [currentCommune, setCurrentCommune] = useState<Commune>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading last commune from localStorage', e);
    }
    return DEFAULT_COMMUNE;
  });

  useEffect(() => {
    if (!currentCommune) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCommune));
    } catch (e) {
      console.error('Error saving commune to localStorage', e);
    }
  }, [currentCommune]);

  return { currentCommune, setCurrentCommune, showWelcomePrompt, setShowWelcomePrompt };
}
