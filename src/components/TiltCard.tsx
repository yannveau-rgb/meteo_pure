import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  onClick?: () => void;
}

export default function TiltCard({ children, className = '', id, onClick }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Framer Motion values for relative coordinates (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth springs to avoid abrupt snapping
  const springX = useSpring(x, { damping: 25, stiffness: 350 });
  const springY = useSpring(y, { damping: 25, stiffness: 350 });

  // Map coordinate bounds to rotation degrees (tilt intensity)
  const rotateY = useTransform(springX, [-0.5, 0.5], [10, -10]);
  const rotateX = useTransform(springY, [-0.5, 0.5], [-10, 10]);

  // Map coordinates to spot glare position percentage
  const glareX = useTransform(springX, [-0.5, 0.5], [20, 80]);
  const glareY = useTransform(springY, [-0.5, 0.5], [20, 80]);
  const glareOpacity = useSpring(useTransform(springX, [-0.5, 0.5], [0.15, 0.35]), { damping: 20 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
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
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

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
        onPointerEnter={() => setIsHovered(true)}
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
