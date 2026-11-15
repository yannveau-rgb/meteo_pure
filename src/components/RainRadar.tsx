import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Radio, CloudOff } from 'lucide-react';
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
  const ago = Math.abs(diffMin);
  if (ago >= 90) return `il y a ${String(Math.round(ago / 30) / 2).replace('.', ',')} h`;
  return `il y a ${ago} min`;
}

function RainRadar({ latitude, longitude, cityName }: RainRadarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  // One persistent tile layer per radar frame, created once and left on the
  // map at opacity 0 — showFrame() below only flips opacities. This used to
  // removeLayer()+create a brand new L.tileLayer on every animation tick
  // (every 550ms, ~110/min while auto-playing), re-requesting tiles from
  // RainViewer each time and causing a visible flicker between frames.
  const layersRef = useRef<any[]>([]);
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

        if (cancelled || !containerRef.current) return;

        const map = L.map(containerRef.current, {
          center: [latitude, longitude],
          zoom: 7,
          minZoom: 4,
          // RainViewer's free tiles stop at zoom 7 ("Zoom Level Not Supported" above);
          // radar layers upscale their z7 tiles, so allow two extra levels at most.
          maxZoom: 9,
          zoomControl: false,
          scrollWheelZoom: false,
          // Attribution stays enabled: OpenStreetMap tiles require it, and
          // hiding it was a licensing problem, not a design choice.
          attributionControl: true,
        });
        map.attributionControl.setPrefix(false);
        map.attributionControl.getContainer()?.classList.add('radar-attribution');
        mapRef.current = map;

        // Basemap: Use Carto if an API key is configured, otherwise fallback to OpenStreetMap
        // with a soft light-grey filter (.radar-basemap-tiles) so radar precipitation echoes stand out cleanly.
        const cartoKey = import.meta.env.VITE_CARTO_API_KEY;
        if (cartoKey) {
          L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`, {
            maxZoom: 12,
            subdomains: 'abcd',
            attribution: '© CartoDB',
          }).addTo(map);
        } else {
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 12,
            className: 'radar-basemap-tiles',
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);
        }


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

        // Every frame costs a set of tile requests and RainViewer's free tier is
        // capped at 100 requests/min per IP (shared by every phone on a mobile
        // carrier). Keep the newest frame and every second one before it: ~7
        // frames over 2 h instead of 13, 512 px tiles to quarter the request count.
        const everyOther = <T,>(arr: T[]): T[] => arr.filter((_, i) => (arr.length - 1 - i) % 2 === 0);
        const allFrames: RadarFrame[] = [
          ...everyOther<any>(data.radar.past || []).map((f: any) => ({ ...f, isNowcast: false })),
          // Free nowcast was discontinued on 2026-01-01; kept in case it returns.
          ...(data.radar.nowcast || []).map((f: any) => ({ ...f, isNowcast: true })),
        ];
        if (allFrames.length === 0) throw new Error('No radar frames');

        if (cancelled) return;
        setFrames(allFrames);

        // Show most recent past frame first
        const lastPastIdx = allFrames.filter(f => !f.isNowcast).length - 1;
        const initIdx = Math.max(0, lastPastIdx);

        // Create every frame's tile layer once, up front, all at opacity 0
        // except the one being shown. showFrame() then only toggles opacity.
        layersRef.current = allFrames.map((f, i) =>
          L.tileLayer(
            // Colour scheme 2 = Universal Blue, the only one still served (other
            // numbers are silently mapped to it).
            `https://tilecache.rainviewer.com${f.path}/512/{z}/{x}/{y}/2/1_1.png`,
            {
              opacity: i === initIdx ? 0.8 : 0,
              tileSize: 512,
              zoomOffset: -1,
              maxNativeZoom: 8,
              maxZoom: 9,
              keepBuffer: 1,
            }
          ).addTo(map)
        );

        setFrameIdx(initIdx);
        setIsLoading(false);
      } catch {
        if (!cancelled) {
          setError(true);
          setIsLoading(false);
        }
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

  // Switch the visible radar frame by toggling opacity on the pre-built
  // layers — no layer creation/removal, so no re-fetch and no flicker.
  const showFrame = useCallback((idx: number) => {
    const layers = layersRef.current;
    if (layers.length === 0) return;
    layers.forEach((layer, i) => layer.setOpacity(i === idx ? 0.8 : 0));
  }, []);

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
    <div className="card card--flush overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <span className="kicker text-white/75">Radar de pluie · 2 h</span>
        </div>
        <div className="flex items-center gap-2">
          {currentFrame && (
            <span className={`pill ${
              currentFrame.isNowcast
                ? '!bg-amber-500/20 !border-amber-500/30 !text-amber-300'
                : '!bg-sky-500/20 !border-sky-500/30 !text-sky-300'
            }`}>
              {formatFrameLabel(currentFrame)}
            </span>
          )}
          <button
            onClick={() => setIsPlaying(p => !p)}
            aria-label={isPlaying ? 'Pause' : 'Lecture'}
            className="icon-btn icon-btn--sm"
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
              <span className="meta">Chargement radar…</span>
            </div>
          </div>
        )}
        {error ? (
          <div className="flex flex-col items-center justify-center text-center p-8 h-[240px] bg-white/10 border-y border-white/20">
            <CloudOff className="w-10 h-10 text-white mb-2" />
            <p className="text-sm text-white font-semibold">Radar indisponible.</p>
            <p className="text-[11px] text-white/60 mt-1">RainViewer ne répond pas pour le moment.</p>
          </div>
        ) : (
          <div ref={containerRef} style={{ height: '240px' }} className="w-full" />
        )}
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
          <div className="flex justify-between text-[11px] text-white/60 font-bold">
            <span>{formatFrameLabel(frames[0])}</span>
            {pastCount < frames.length && (
              <span className="text-amber-400/70">◆ Prévu ({frames.length - pastCount} pas)</span>
            )}
            <span>{formatFrameLabel(frames[frames.length - 1])}</span>
          </div>
          {pastCount === frames.length && (
            <p className="text-[11px] text-white/50 leading-snug">
              Observations passées uniquement (mosaïque de radars, source RainViewer) : le radar ne prévoit pas la suite.
              Pour l'heure qui vient, voyez « Pluie dans l'heure ».
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default React.memo(RainRadar);
