import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Radio } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface RainRadarProps {
  latitude: number;
  longitude: number;
  cityName: string;
}

interface RadarFrame {
  time: number;
  path: string;
  isNowcast: boolean;
}

function formatFrameLabel(frame: RadarFrame): string {
  const nowSec = Math.floor(Date.now() / 1000);
  const diffMin = Math.round((frame.time - nowSec) / 60);
  if (frame.isNowcast) return `+${Math.abs(diffMin)} min (prévu)`;
  if (diffMin === 0) return 'Maintenant';
  return `il y a ${Math.abs(diffMin)} min`;
}

export default function RainRadar({ latitude, longitude, cityName }: RainRadarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [frameIdx, setFrameIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      try {
        const L = (await import('leaflet')).default;
        LRef.current = L;

        // Fix default icon path broken by Vite bundling
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          center: [latitude, longitude],
          zoom: 7,
          minZoom: 4,
          maxZoom: 10,
          zoomControl: false,
          scrollWheelZoom: false,
          attributionControl: false,
        });
        mapRef.current = map;

        // Dark CartoDB base layer
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
          maxZoom: 12,
          subdomains: 'abcd',
        }).addTo(map);

        // Labels layer on top
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
          maxZoom: 12,
          subdomains: 'abcd',
          pane: 'shadowPane',
        }).addTo(map);

        // City marker
        L.circleMarker([latitude, longitude], {
          radius: 5,
          fillColor: '#38bdf8',
          color: '#fff',
          weight: 2,
          fillOpacity: 1,
        }).addTo(map).bindTooltip(cityName, { permanent: false, direction: 'top' });

        // Fetch RainViewer frames
        const rv = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (!rv.ok) throw new Error('RainViewer unavailable');
        const data = await rv.json();

        const allFrames: RadarFrame[] = [
          ...(data.radar.past || []).map((f: any) => ({ ...f, isNowcast: false })),
          ...(data.radar.nowcast || []).map((f: any) => ({ ...f, isNowcast: true })),
        ];

        if (cancelled) return;
        setFrames(allFrames);

        // Show most recent past frame first
        const lastPastIdx = (data.radar.past?.length ?? 1) - 1;
        const initIdx = Math.max(0, lastPastIdx);

        const radarLayer = L.tileLayer(
          `https://tilecache.rainviewer.com${allFrames[initIdx].path}/256/{z}/{x}/{y}/6/1_1.png`,
          { opacity: 0.75, maxZoom: 12, tileSize: 256 }
        ).addTo(map);
        layerRef.current = radarLayer;

        setFrameIdx(initIdx);
        setIsLoading(false);
      } catch (e) {
        if (!cancelled) setError(true);
      }
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude, cityName]);

  // Update radar tile layer when frame changes
  const showFrame = useCallback((idx: number) => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map || frames.length === 0) return;
    const frame = frames[idx];
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    layerRef.current = L.tileLayer(
      `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/6/1_1.png`,
      { opacity: 0.75, maxZoom: 18, tileSize: 256 }
    ).addTo(map);
  }, [frames]);

  useEffect(() => {
    showFrame(frameIdx);
  }, [frameIdx, showFrame]);

  // Auto-play
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || frames.length === 0) return;
    intervalRef.current = setInterval(() => {
      setFrameIdx(i => (i + 1) % frames.length);
    }, 550);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, frames.length]);

  const currentFrame = frames[frameIdx];
  const pastCount = frames.filter(f => !f.isNowcast).length;

  return (
    <div className="glass-premium rounded-3xl overflow-hidden shadow-lg select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Radar pluie & orages</span>
        </div>
        <div className="flex items-center gap-2">
          {currentFrame && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              currentFrame.isNowcast
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
            }`}>
              {formatFrameLabel(currentFrame)}
            </span>
          )}
          <button
            onClick={() => setIsPlaying(p => !p)}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Map container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-[10px] text-white/60 font-medium">Chargement radar…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-52 text-white/40 text-xs">
            Radar indisponible
          </div>
        )}
        <div ref={containerRef} style={{ height: '240px' }} className="w-full" />
      </div>

      {/* Timeline scrubber */}
      {frames.length > 0 && (
        <div className="px-4 pb-4 pt-2 space-y-1.5">
          <input
            type="range"
            min={0}
            max={frames.length - 1}
            value={frameIdx}
            onChange={e => { setIsPlaying(false); setFrameIdx(Number(e.target.value)); }}
            className="w-full h-1 accent-sky-400 cursor-pointer"
            aria-label="Curseur radar"
          />
          <div className="flex justify-between text-[8px] text-white/35 font-bold">
            <span>Passé</span>
            <span className="text-amber-400/70">◆ Nowcast ({frames.length - pastCount} pas)</span>
            <span>+30 min</span>
          </div>
        </div>
      )}
    </div>
  );
}
