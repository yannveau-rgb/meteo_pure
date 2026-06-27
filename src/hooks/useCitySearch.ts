import { useEffect, useState } from 'react';
import { Commune } from '../types';
import { searchFrenchCommunes } from '../utils/weatherApi';

export function useCitySearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Commune[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchList, setShowSearchList] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setIsSearching(true);
      try {
        setSearchResults(await searchFrenchCommunes(searchQuery));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  return {
    searchQuery, setSearchQuery,
    searchResults, setSearchResults,
    isSearching,
    showSearchList, setShowSearchList,
  };
}
