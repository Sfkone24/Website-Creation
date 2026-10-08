// Inline SVG icons (stroke-based, inherit currentColor). Reference by name in config: "icon": "flame".
const svg = (d) => `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

export const icons = {
  flame: svg('<path d="M12 22c4 0 7-2.8 7-7 0-3.5-2.2-6-4-8 0 2.5-1.3 4-3 4 .5-3-1-6-4-9 0 4-4 7-4 12 0 4.2 3.5 8 8 8z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-2 2-3 3-5 1 2 3 3 3 5 0 1.7-1.3 3-3 3z"/>'),
  snowflake: svg('<path d="M12 2v20M4.9 7l14.2 10M4.9 17L19.1 7"/><path d="M9 4l3 2 3-2M9 20l3-2 3 2M3.5 10.5l3.2-.2-1.4-2.9M20.5 13.5l-3.2.2 1.4 2.9M3.5 13.5l3.2.2-1.4 2.9M20.5 10.5l-3.2-.2 1.4-2.9"/>'),
  wrench: svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 17.7V21h3.3l6.3-6.3a4 4 0 0 0 5.1-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  gauge: svg('<path d="M12 14l4-4"/><path d="M3.3 17a9 9 0 1 1 17.4 0"/><circle cx="12" cy="14" r="1.5"/>'),
  fan: svg('<circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7s3 4 0 6l-4 1zM14 12c4 0 7 1 7 4s-4 3-6 0l-1-4zM12 14c0 4-1 7-4 7s-3-4 0-6l4-1zM10 12c-4 0-7-1-7-4s4-3 6 0l1 4z"/>'),
  leaf: svg('<path d="M4 20c0-9 6-15 16-16-1 10-7 16-16 16z"/><path d="M4 20l9-9"/>'),
  earth: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z"/>'),
  duct: svg('<path d="M3 7h12a3 3 0 0 1 3 3v10"/><path d="M3 12h9a1 1 0 0 1 1 1v7"/><path d="M15 20h6"/>'),
  building: svg('<path d="M4 21V5l8-3v19M12 9h8v12M7 8h2M7 12h2M7 16h2M15 13h2M15 17h2M2 21h20"/>'),
  droplet: svg('<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>'),
  wind: svg('<path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7"/>'),
  clipboard: svg('<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V3h6v1M9 11l2 2 4-4M9 17h6"/>'),
  shield: svg('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
  family: svg('<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 21v-2a6 6 0 0 1 12 0v2M14 21v-1.5a4 4 0 0 1 8 0V21"/>'),
  star: svg('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  tag: svg('<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
  phone: svg('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
  pin: svg('<path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
  check: svg('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
};
