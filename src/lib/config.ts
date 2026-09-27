/** Coordonnées publiques DALUCHE — à ajuster ici uniquement. */
export const CONTACT = {
  whatsappNumber: '221774201819',
  phoneDisplay: '+221 77 420 18 19',
  email: '', // à renseigner (ex. contact@votredomaine.com)
  city: 'Dakar, Sénégal'
};

export const whatsappLink = (text?: string) =>
  `https://wa.me/${CONTACT.whatsappNumber}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
