import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { NotificationIntensity } from '../utils/notificationService';

export interface ToastData {
  id: string;
  title: string;
  message: string;
  intensity: NotificationIntensity;
}

interface ToastProps {
  toast: ToastData | null;
  cityName: string;
  onDismiss: () => void;
}

export default function Toast({ toast, cityName, onDismiss }: ToastProps) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -45, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 150, damping: 18 }}
          role="status"
          aria-live="polite"
          className="absolute top-[calc(env(safe-area-inset-top,0px)+1rem)] sm:top-4 left-4 right-4 z-50 pointer-events-auto"
        >
          <div className={`glass-premium p-4 rounded-2xl shadow-2xl border flex flex-col gap-1.5 relative overflow-hidden backdrop-blur-2xl ${
            toast.intensity === 'alert_red' ? 'border-rose-500/50 bg-rose-950/75 text-rose-100 shadow-[0_0_15px_rgba(244,63,94,0.4)]' :
            toast.intensity === 'alert_orange' ? 'border-amber-500/50 bg-amber-950/75 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.35)]' :
            toast.intensity === 'alert_yellow' ? 'border-yellow-400/50 bg-yellow-950/75 text-yellow-100' :
            toast.intensity === 'heavy' ? 'border-red-500/40 bg-red-950/75 text-red-100' :
            toast.intensity === 'moderate' ? 'border-amber-500/40 bg-amber-950/75 text-amber-100' :
            toast.intensity === 'thunderstorm' ? 'border-purple-500/50 bg-indigo-950/75 text-indigo-100 shadow-[0_0_15px_rgba(168,85,247,0.35)]' :
            toast.intensity === 'heatwave' ? 'border-orange-500/50 bg-orange-950/75 text-orange-100 shadow-[0_0_15px_rgba(249,115,22,0.35)]' :
            'border-sky-500/40 bg-sky-950/75 text-sky-100'
          }`}>
            {/* Visual Timer Progress Bar */}
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 6, ease: 'linear' }}
              onAnimationComplete={onDismiss}
              className={`absolute bottom-0 left-0 h-1 ${
                toast.intensity === 'alert_red' ? 'bg-rose-500' :
                toast.intensity === 'alert_orange' ? 'bg-amber-500' :
                toast.intensity === 'alert_yellow' ? 'bg-yellow-400' :
                toast.intensity === 'heavy' ? 'bg-red-500' :
                toast.intensity === 'moderate' ? 'bg-amber-400' :
                toast.intensity === 'thunderstorm' ? 'bg-purple-500' :
                toast.intensity === 'heatwave' ? 'bg-orange-500' :
                'bg-sky-400'
              }`}
            />

            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm select-none">
                  {toast.intensity === 'alert_red' ? '🟥' :
                   toast.intensity === 'alert_orange' ? '🟧' :
                   toast.intensity === 'alert_yellow' ? '🟨' :
                   toast.intensity === 'heavy' ? '🤬' :
                   toast.intensity === 'moderate' ? '☔' :
                   toast.intensity === 'thunderstorm' ? '⚡' :
                   toast.intensity === 'heatwave' ? '🌡️' : '💧'}
                </span>
                <h4 className="font-extrabold text-[11px] tracking-wider uppercase">
                  {toast.title}
                </h4>
              </div>

              <button
                onClick={onDismiss}
                className="p-1 rounded-full hover:bg-white/10 active:scale-95 transition-all text-white/50 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] font-bold leading-relaxed pl-0.5 text-white/95 mt-0.5">
              "{toast.message}"
            </p>

            <div className="flex justify-between items-center text-[9px] text-white/50 font-extrabold pl-0.5 mt-1 uppercase select-none tracking-widest">
              <span>Météo à {cityName}</span>
              <span className="bg-white/15 px-1.5 py-0.5 rounded-full text-[9px] text-white/90">
                {toast.intensity === 'alert_red' ? 'Vigilance rouge' :
                 toast.intensity === 'alert_orange' ? 'Vigilance orange' :
                 toast.intensity === 'alert_yellow' ? 'Vigilance jaune' :
                 toast.intensity === 'heavy' ? 'Averse forte' :
                 toast.intensity === 'moderate' ? 'Pluie soutenue' :
                 toast.intensity === 'thunderstorm' ? 'Orage électrique !' :
                 toast.intensity === 'heatwave' ? 'Chaleur Intense !' : 'Petite bruine'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
