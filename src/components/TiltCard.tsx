import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

function TiltCard({ children, className = '', id, onClick }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Framer Motion values for relative coordinates (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs to avoid abrupt snapping
  const springX = useSpring(x, { damping: 25, stiffness: 350 });
  const springY = useSpring(y, { damping: 25, stiffness: 350 });

  // Map coordinate bounds to rotation degrees (tilt intensity)
  const rotateY = useTransform(springX, [-0.5, 0.5], [10, -10]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Touch scrolling fires pointermove too — without this guard, scrolling
    // past these cards on mobile (the app's primary surface) made all of
    // them tilt in 3D mid-scroll, an effect only meant for a mouse.
    if (e.pointerType !== 'mouse') return;
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Relative mouse cursor coordinates inside card (from -0.5 to 0.5)
    const relativeX = (e.clientX - rect.left) / width - 0.5;
    const relativeY = (e.clientY - rect.top) / height - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Parallax rotation is exactly the kind of motion prefers-reduced-motion
  // exists for — render the card flat instead of skipping the tilt logic
  // conditionally, so the hook order above stays stable either way.
  if (prefersReducedMotion) {
    return (
      <div
        id={id}
        onClick={onClick}
        className={`relative ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="perspective-[1000px] select-none"
      style={{ perspective: 1000 }}
    >
      <motion.div
        ref={cardRef}
        id={id}
        onClick={onClick}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
        }}
        className={`relative transition-all duration-300 ease-out will-change-transform ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        {/* Direct children layout to ensure standard click event flow */}
        {children}
      </motion.div>
    </div>
  );
}

export default React.memo(TiltCard);
