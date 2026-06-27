import { useState } from 'react';
import { generateElementDataUrl, copyDataUrlToClipboard, downloadDataUrl } from '../utils/shareUtils';

type Status = 'copied' | 'downloaded' | 'error' | null;

export function useShareImage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<Status>(null);

  function openShare(elementId: string) {
    setIsModalOpen(true);
    setIsGenerating(true);
    setImageSrc(null);
    setCopyStatus(null);

    setTimeout(() => {
      generateElementDataUrl(elementId)
        .then((dataUrl) => {
          setImageSrc(dataUrl);
          setIsGenerating(false);
          copyDataUrlToClipboard(dataUrl).then((ok) => {
            if (ok) {
              setCopyStatus('copied');
              setTimeout(() => setCopyStatus(null), 2500);
            }
          });
        })
        .catch((err) => {
          console.error('Erreur capture image:', err);
          setIsGenerating(false);
          setCopyStatus('error');
        });
    }, 150);
  }

  function copy() {
    if (!imageSrc) return;
    copyDataUrlToClipboard(imageSrc).then((ok) => {
      setCopyStatus(ok ? 'copied' : 'error');
      setTimeout(() => setCopyStatus(null), ok ? 2500 : 3000);
    });
  }

  function download(filename: string) {
    if (!imageSrc) return;
    downloadDataUrl(imageSrc, filename);
    setCopyStatus('downloaded');
    setTimeout(() => setCopyStatus(null), 2500);
  }

  function close() {
    setIsModalOpen(false);
  }

  return { isModalOpen, isGenerating, imageSrc, copyStatus, openShare, copy, download, close };
}
