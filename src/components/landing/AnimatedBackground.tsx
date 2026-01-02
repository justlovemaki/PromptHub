'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FloatingOrb {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const AnimatedBackground = () => {
  const [orbs, setOrbs] = useState<FloatingOrb[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 生成浮动光球
    const colors = [
      'rgba(106, 90, 205, 0.15)', // primary
      'rgba(217, 70, 239, 0.12)', // accent
      'rgba(124, 58, 237, 0.1)',  // secondary
      'rgba(59, 130, 246, 0.1)',  // blue
    ];

    const generatedOrbs: FloatingOrb[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 300 + 200,
      duration: Math.random() * 20 + 20,
      delay: Math.random() * 5,
      color: colors[i % colors.length],
    }));

    setOrbs(generatedOrbs);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* 渐变网格背景 */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(106, 90, 205, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(106, 90, 205, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 浮动光球 */}
      {orbs.map((orb) => (
        <motion.div
          key={orb.id}
          className="absolute rounded-full blur-3xl"
          style={{
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 50, -30, 20, 0],
            y: [0, -40, 30, -20, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* 顶部渐变遮罩 */}
      <div 
        className="absolute top-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, var(--bg-100), transparent)',
        }}
      />

      {/* 底部渐变遮罩 */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: 'linear-gradient(to top, var(--bg-100), transparent)',
        }}
      />

      {/* 动态光线效果 */}
      <motion.div
        className="absolute top-1/4 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'conic-gradient(from 0deg, transparent, rgba(106, 90, 205, 0.05), transparent, rgba(217, 70, 239, 0.05), transparent)',
          filter: 'blur(60px)',
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

export default AnimatedBackground;