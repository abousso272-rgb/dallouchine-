/** Coordonnées publiques Dallou Chine — à ajuster ici uniquement. */
export const CONTACT = {
  whatsappNumber: '221774201819',
  phoneDisplay: '+221 77 420 18 19',
  email: '', // à renseigner (ex. contact@votredomaine.com)
  city: 'Dakar, Sénégal'
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Photos d'illustration (Unsplash, libres de droits) — remplaçables par vos propres visuels. */
const unsplash = (id: string, w = 1400) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=70`;
/** Variantes de largeur pour srcset (le navigateur choisit la bonne taille : mobile plus léger). */
export const photoSrcSet = (url: string, widths = [480, 800, 1200, 1600]) =>
  widths.map(w => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ');

export const PHOTOS = {
  port: unsplash('photo-1494412574643-ff11b0a5c1c3'),
  ship: unsplash('photo-1605745341112-85968b19335b', 900),
  plane: unsplash('photo-1570710891163-6d3b5c47248b', 900),
  warehouse: unsplash('photo-1586528116311-ad8dd3c8310d', 900),
  truck: unsplash('photo-1601584115197-04ecc0da31d7', 900),
  /** Visuel conteneurs pour la bande marketplace */
  containers: unsplash('photo-1578575437130-527eed3abbec', 900)
};
