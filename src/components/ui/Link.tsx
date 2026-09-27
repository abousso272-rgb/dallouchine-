import React from 'react';
import { useApp } from '../../context/AppContext';

export interface LinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: string;
  replace?: boolean;
}

/** Lien interne : vrai <a href> (accessibilité, ouverture dans un nouvel onglet) + navigation sans rechargement. */
export function Link({ to, replace, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useApp();
  const external = /^https?:\/\//.test(to) || to.startsWith('mailto:') || to.startsWith('tel:');
  return (
    <a
      href={to}
      {...(/^https?:\/\//.test(to) ? { target: rest.target || '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
      onClick={e => {
        onClick?.(e);
        if (e.defaultPrevented || external) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to, { replace });
      }}
    >
      {children}
    </a>
  );
}
