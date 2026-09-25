// Normalising and linking contact details (Bangladesh-friendly defaults).

/** Keeps digits and a leading +; returns null if it doesn't look like a phone number. */
export function cleanPhone(input: string) {
  const v = input.replace(/[^\d+]/g, "");
  const digits = v.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return v;
}

/** WhatsApp wants the full international number without "+": 01712… becomes 8801712… */
export function whatsappLink(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 11) d = `88${d}`;
  return `https://wa.me/${d}`;
}

/** Accepts a profile URL or just a username and returns a facebook.com URL, or null. */
export function cleanFacebook(input: string) {
  const v = input.trim();
  if (!v) return null;
  const m = v.match(/^(?:https?:\/\/)?(?:www\.|m\.|web\.)?(?:facebook|fb)\.com\/(.+)$/i);
  const path = (m ? m[1] : v).replace(/^\/+|\/+$/g, "");
  if (!/^[\w.\-/?=&]+$/.test(path)) return null;
  return `https://facebook.com/${path}`;
}

type Contactable = {
  phone: string | null; phonePublic: boolean;
  whatsapp: string | null; whatsappPublic: boolean;
  facebook: string | null; facebookPublic: boolean;
};

/** Only the details the person chose to make public. */
export function publicContacts(u: Contactable) {
  return {
    phone: u.phonePublic ? u.phone : null,
    whatsapp: u.whatsappPublic ? u.whatsapp : null,
    facebook: u.facebookPublic ? u.facebook : null,
  };
}
