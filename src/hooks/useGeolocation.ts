import { useState } from 'react';
import { Commune } from '../types';
import { getCommuneByCoords } from '../utils/weatherApi';
import { AppTab } from '../components/BottomNav';

export function useGeolocation(
  setCurrentCommune: (commune: Commune) => void,
  setActiveTab: (tab: AppTab) => void,
  setErrorMsg: (msg: string | null) => void
) {
  const [geoLocating, setGeoLocating] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const nearestCommune = await getCommuneByCoords(latitude, longitude);
          if (nearestCommune) {
            setCurrentCommune(nearestCommune);
            setActiveTab('meteo');
          } else {
            setErrorMsg("Aucune commune française correspondante trouvée.");
          }
        } catch (err) {
          console.error(err);
          setErrorMsg("Échec de la recherche de commune locale.");
        } finally {
          setGeoLocating(false);
        }
      },
      (geoError) => {
        console.warn(geoError);
        setGeoLocating(false);
        setErrorMsg("La géolocalisation a échoué (accès refusé ou bloqué). Si vous êtes sur Safari/iPhone, essayez d'ouvrir l'application en plein écran, ou recherchez votre ville manuellement.");
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  return { geoLocating, handleGeolocation };
}
