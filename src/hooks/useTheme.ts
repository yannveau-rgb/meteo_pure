import { useCallback, useLayoutEffect, useState } from 'react';
import {
  ThemeId,
  applyThemeAttribute,
  loadStoredTheme,
  storeTheme,
} from '../utils/theme';

/** Thème courant, mémorisé dans le navigateur et reflété sur <html data-theme>. */
export function useTheme(): [ThemeId, (id: ThemeId) => void] {
  const [theme, setThemeState] = useState<ThemeId>(() => loadStoredTheme());

  useLayoutEffect(() => {
    applyThemeAttribute(theme);
  }, [theme]);

  const setTheme = useCallback((id: ThemeId) => {
    storeTheme(id);
    setThemeState(id);
  }, []);

  return [theme, setTheme];
}
