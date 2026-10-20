import { useEffect } from 'react';
import { SITE_URL } from './data.js';

/** Per-page title, description, canonical, Open Graph / Twitter tags and optional JSON-LD. */
export default function useSeo({ title, description, path = '/', jsonLd }) {
  useEffect(() => {
    document.title = title;
    const set = (sel, attrs) => {
      let el = document.head.querySelector(sel);
      if (!el) { el = document.createElement(sel.startsWith('link') ? 'link' : 'meta'); document.head.appendChild(el); }
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    };
    const url = SITE_URL + path;
    set('meta[name="description"]', { name: 'description', content: description });
    set('link[rel="canonical"]', { rel: 'canonical', href: url });
    set('meta[property="og:title"]', { property: 'og:title', content: title });
    set('meta[property="og:description"]', { property: 'og:description', content: description });
    set('meta[property="og:url"]', { property: 'og:url', content: url });
    set('meta[name="twitter:title"]', { name: 'twitter:title', content: title });
    set('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
    let script = document.getElementById('ld-page');
    if (jsonLd) {
      if (!script) { script = document.createElement('script'); script.id = 'ld-page'; script.type = 'application/ld+json'; document.head.appendChild(script); }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) script.remove();
  }, [title, description, path, jsonLd]);
}
