import { useEffect, useState } from 'react';
import { Commune } from '../types';

const STORAGE_KEY = 'meteo_pure_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Commune[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading favorites from localStorage', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error('Error saving favorites to localStorage', e);
    }
  }, [favorites]);

  const toggleFavorite = (commune: Commune) => {
    setFavorites(prev =>
      prev.some(fav => fav.code === commune.code)
        ? prev.filter(fav => fav.code !== commune.code)
        : [...prev, commune]
    );
  };

  return { favorites, setFavorites, toggleFavorite };
}
