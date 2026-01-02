'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

const FloatingCard = ({ 
  children, 
  className = '',
  glowColor = 'rgba(106, 90, 205, 0.3)'
}: FloatingCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-10deg', '10deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative ${className}`}
    >
      {/* 光晕效果 */}
      <motion.div
        className="absolute -inset-1 rounded-2xl opacity-0 blur-xl transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, ${glowColor}, transparent 70%)`,
        }}
        animate={{
          opacity: isHovered ? 0.6 : 0,
        }}
      />
      
      {/* 卡片内容 */}
      <motion.div
        style={{
          transform: 'translateZ(50px)',
          transformStyle: 'preserve-3d',
        }}
        className="relative h-full"
      >
        {children}
      </motion.div>

      {/* 反光效果 */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </motion.div>
  );
};

export default FloatingCard;