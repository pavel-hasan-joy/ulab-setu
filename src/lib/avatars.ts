/** Curated SVG avatars that work 100% offline and load instantly. */
export const AVATAR_PRESETS = [
  {
    id: "preset-graduate",
    label: "Graduating Scholar",
    category: "Academic",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%230f766e"/><circle cx="50" cy="45" r="22" fill="%23fde047"/><path d="M26 84c4-18 16-24 24-24s20 6 24 24z" fill="%23115e59"/><polygon points="50,15 78,28 50,41 22,28" fill="%231e293b"/><polygon points="76,29 76,46 72,46 72,31" fill="%23f59e0b"/><circle cx="74" cy="48" r="2" fill="%23f59e0b"/></svg>`,
  },
  {
    id: "preset-coder",
    label: "Software Engineer",
    category: "Tech",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%231e3a8a"/><circle cx="50" cy="46" r="21" fill="%23fed7aa"/><path d="M25 86c4-18 15-23 25-23s21 5 25 23z" fill="%233b82f6"/><path d="M30 42h40v8H30z" fill="%230f172a"/><circle cx="42" cy="46" r="4" fill="%2338bdf8"/><circle cx="58" cy="46" r="4" fill="%2338bdf8"/></svg>`,
  },
  {
    id: "preset-designer",
    label: "UI/UX Designer",
    category: "Creative",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23701a75"/><circle cx="50" cy="44" r="21" fill="%23fecdd3"/><path d="M26 85c5-17 15-22 24-22s19 5 24 22z" fill="%23c026d3"/><circle cx="50" cy="36" r="14" fill="%23ec4899"/><path d="M38 48a12 12 0 0 0 24 0" stroke="%23831843" stroke-width="3" fill="none"/></svg>`,
  },
  {
    id: "preset-business",
    label: "Business Leader",
    category: "Leadership",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23854d0e"/><circle cx="50" cy="43" r="20" fill="%23ffedd5"/><path d="M26 86c4-18 15-23 24-23s20 5 24 23z" fill="%231e293b"/><polygon points="50,63 46,80 50,86 54,80" fill="%23eab308"/><polygon points="46,63 50,68 54,63" fill="%23ffffff"/></svg>`,
  },
  {
    id: "preset-researcher",
    label: "Faculty Researcher",
    category: "Academic",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23312e81"/><circle cx="50" cy="44" r="21" fill="%23fde68a"/><path d="M26 86c4-17 14-22 24-22s20 5 24 22z" fill="%23e2e8f0"/><circle cx="43" cy="43" r="6" stroke="%234338ca" stroke-width="2.5" fill="none"/><circle cx="57" cy="43" r="6" stroke="%234338ca" stroke-width="2.5" fill="none"/><line x1="49" y1="43" x2="51" y2="43" stroke="%234338ca" stroke-width="2.5"/></svg>`,
  },
  {
    id: "preset-creator",
    label: "Media & Journalist",
    category: "Media",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%239a3412"/><circle cx="50" cy="46" r="20" fill="%23fed7aa"/><path d="M26 86c4-18 15-23 24-23s20 5 24 23z" fill="%23ea580c"/><rect x="25" y="38" width="8" height="16" rx="3" fill="%230f172a"/><rect x="67" y="38" width="8" height="16" rx="3" fill="%230f172a"/><path d="M29 42a22 22 0 0 1 42 0" stroke="%230f172a" stroke-width="4" fill="none"/></svg>`,
  },
  {
    id: "preset-campus",
    label: "ULAB Campus Explorer",
    category: "Student",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23065f46"/><circle cx="50" cy="45" r="21" fill="%23fef08a"/><path d="M26 86c4-18 15-23 24-23s20 5 24 23z" fill="%23059669"/><path d="M36 32h28l-4-8H40z" fill="%2310b981"/><circle cx="50" cy="24" r="3" fill="%23fef08a"/></svg>`,
  },
  {
    id: "preset-minimal",
    label: "Modern Professional",
    category: "Minimal",
    svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23334155"/><circle cx="50" cy="44" r="22" fill="%23e2e8f0"/><path d="M25 86c4-18 15-23 25-23s21 5 25 23z" fill="%2364748b"/><circle cx="50" cy="40" r="12" fill="%23475569"/></svg>`,
  },
] as const;
