import React, { useEffect, useRef, useState } from 'react';

export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : true));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth < 768;
    if (reduce || isMobile || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '200px 0px 100px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`md:transition-[opacity,transform] md:duration-500 md:ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'md:translate-y-3 md:opacity-0'
      } ${className}`}
      style={typeof window !== 'undefined' && window.innerWidth >= 768 && delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
