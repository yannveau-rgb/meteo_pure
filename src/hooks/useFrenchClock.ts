import { useEffect, useState } from 'react';

export function useFrenchClock() {
  const [frenchDate, setFrenchDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formattedDate = new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }).format(now);
      setFrenchDate(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1));

      setCurrentTime(now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return { frenchDate, currentTime };
}
