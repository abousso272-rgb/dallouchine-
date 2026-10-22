import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { PLACEHOLDER_IMAGE } from './services/catalog';
import './index.css';

// Image introuvable (lien fournisseur expiré, CDN bloqué…) : visuel neutre au lieu d'une icône cassée
document.addEventListener(
  'error',
  event => {
    const target = event.target;
    if (target instanceof HTMLImageElement && !target.dataset.fallback) {
      target.dataset.fallback = '1';
      target.alt = '';
      target.src = PLACEHOLDER_IMAGE;
    }
  },
  true
);

// Lien de secours généré par le serveur (« /#!/produit/… ») : on revient à l'adresse réelle
if (window.location.hash.startsWith('#!/')) window.history.replaceState(null, '', window.location.hash.slice(2));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
