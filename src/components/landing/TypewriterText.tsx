'use client';

import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  texts: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
}

const TypewriterText = ({
  texts,
  className = '',
  typingSpeed = 100,
  deletingSpeed = 40,
  pauseDuration = 2000,
}: TypewriterTextProps) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const currentFullText = texts[currentTextIndex];

  useEffect(() => {
    // 暂停状态
    if (isPaused) {
      const pauseTimeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseDuration);
      return () => clearTimeout(pauseTimeout);
    }

    // 打字完成，进入暂停
    if (!isDeleting && displayText === currentFullText) {
      setIsPaused(true);
      return;
    }

    // 删除完成，切换到下一个文字
    if (isDeleting && displayText === '') {
      setIsDeleting(false);
      setCurrentTextIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    // 打字或删除动画
    const timeout = setTimeout(
      () => {
        if (isDeleting) {
          setDisplayText(currentFullText.substring(0, displayText.length - 1));
        } else {
          setDisplayText(currentFullText.substring(0, displayText.length + 1));
        }
      },
      isDeleting ? deletingSpeed : typingSpeed
    );

    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, isPaused, currentTextIndex, texts, currentFullText, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <span className={className}>
      {displayText}
    </span>
  );
};

export default TypewriterText;