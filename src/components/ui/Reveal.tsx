import React, { useEffect, useRef, useState } from 'react';

/** Apparition douce au défilement (désactivée si l'utilisateur préfère réduire les animations). */
export function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
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
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-700 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
