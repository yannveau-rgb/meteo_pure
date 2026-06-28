import { useState } from 'react';
import { getMorningBriefContent, HumorLevel } from '../utils/notificationService';

export function useMorningBrief() {
  const [showMoonModal, setShowMoonModal] = useState<boolean>(false);
  const [showMorningBriefModal, setShowMorningBriefModal] = useState<boolean>(false);
  const [aiBrief, setAiBrief] = useState<{ title: string; body: string; ai?: boolean } | null>(null);
  const [loadingBrief, setLoadingBrief] = useState<boolean>(false);

  async function openMorningBrief(birthDate: string, weatherCode: number, humorLevel: HumorLevel, cityName: string) {
    setShowMorningBriefModal(true);
    if (!birthDate) {
      setAiBrief(null);
      return;
    }
    setLoadingBrief(true);
    setAiBrief(null);
    const fallback = () => getMorningBriefContent(humorLevel, birthDate, weatherCode);
    try {
      const res = await fetch('/api/morning-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthDate, weatherCode, humorLevel, cityName })
      });
      if (res.ok) {
        const data = await res.json();
        setAiBrief({ title: data.title, body: data.body, ai: data.ai !== false });
      } else {
        setAiBrief(fallback());
      }
    } catch (err) {
      console.error('[BRIEF]', err);
      setAiBrief(fallback());
    } finally {
      setLoadingBrief(false);
    }
  }

  return {
    showMoonModal, setShowMoonModal,
    showMorningBriefModal, setShowMorningBriefModal,
    aiBrief, setAiBrief,
    loadingBrief,
    openMorningBrief,
  };
}
