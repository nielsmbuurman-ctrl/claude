// Preview data for the local renderer. NOT real product data: the measurements,
// tints and metafields below are placeholders so every section has something to show.
// Only Marea has photos (the Calora images from the earlier PEP SCHEP build).

const frame = (id, handle, title, m, images = []) => ({
  id,
  handle,
  title,
  type: 'Zonnebril',
  url: `/products/${handle}`,
  price: 1995,
  available: true,
  has_only_default_variant: true,
  description: '',
  media: images.map((src, i) => ({ id: id * 10 + i, alt: title, src, preview_image: { src, alt: title, aspect_ratio: i === 2 ? 0.8 : 0.8 } })),
  get featured_media() { return this.media[0] || null; },
  variants: [{ id: id * 100, title: 'Default Title', price: 1995, available: true }],
  get selected_or_first_available_variant() { return this.variants[0]; },
  options: ['Title'],
  metafields: { carfo: Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { value: v }])) }
});

const base = { uv400: true, filter_category: 3, polarized: false, material: 'Polycarbonaat', in_the_box: 'Hard etui en een microvezeldoekje.' };

export const frames = [
  frame(1, 'ambra', 'Ambra', { ...base, colourway: 'Black / Orange', one_liner: 'Zwart montuur, oranje glas. De hele dag golden hour.', shape: 'tinted', fit: 'medium', style: 'loud', wear_to: ['festival', 'city'], tint_hex: '#E8892E', tint_alpha: 0.6, frame_hex: '#111111', frame_width_mm: 140, lens_width_mm: 52, bridge_mm: 18, temple_mm: 145, weight_g: 24 }),
  frame(2, 'bruma', 'Bruma', { ...base, colourway: 'Smoke Grey / Grey', one_liner: 'Half doorzichtig grijs, scherpe hoeken. Rustig, met een randje.', shape: 'clear', fit: 'narrow', style: 'clean', wear_to: ['city', 'driving'], tint_hex: '#5E646B', tint_alpha: 0.55, frame_hex: '#9AA0A6', frame_width_mm: 136, lens_width_mm: 50, bridge_mm: 19, temple_mm: 142, weight_g: 21 }),
  frame(3, 'calma', 'Calma', { ...base, colourway: 'Crystal / Grey', shape: 'clear', fit: 'medium', style: 'clean', wear_to: ['city', 'beach'], tint_hex: '#7F868D', tint_alpha: 0.5, frame_hex: '#C9CED2', frame_width_mm: 139, lens_width_mm: 51, bridge_mm: 19, temple_mm: 145, weight_g: 22 }),
  frame(4, 'fiera', 'Fiera', { ...base, colourway: 'Black / Black', one_liner: 'Helemaal zwart, helemaal aanwezig. Deze valt op.', shape: 'bold', fit: 'wide', style: 'loud', wear_to: ['festival'], tint_hex: '#1B1C20', tint_alpha: 0.72, frame_hex: '#111111', frame_width_mm: 146, lens_width_mm: 56, bridge_mm: 17, temple_mm: 148, weight_g: 28 }),
  frame(5, 'lua', 'Lua', { ...base, shape: 'tinted', fit: 'medium', style: 'y2k', wear_to: ['festival', 'beach'], tint_hex: '#4A3F5C', tint_alpha: 0.55, frame_hex: '#2A2430', frame_width_mm: 141, lens_width_mm: 53, bridge_mm: 18, temple_mm: 145, weight_g: 23 }),
  frame(6, 'marea', 'Marea', { ...base, colourway: 'Clear / Ice Blue', one_liner: 'Helder montuur, ijsblauw verloop. De frisse. Past bij alles.', shape: 'clear', fit: 'medium', style: 'clean', wear_to: ['city', 'beach', 'festival'], tint_hex: '#8FC3E4', tint_alpha: 0.42, frame_hex: '#E9EEF0', frame_width_mm: 140, lens_width_mm: 51, bridge_mm: 20, temple_mm: 145, weight_g: 23, filter_category: 2 }, ['/img/marea-1.jpg', '/img/marea-2.jpg', '/img/marea-3.jpg']),
  frame(7, 'nimbo', 'Nimbo', { ...base, shape: 'bold', fit: 'wide', style: 'y2k', wear_to: ['festival'], tint_hex: '#AEB8C0', tint_alpha: 0.45, frame_hex: '#F2F2F2', frame_width_mm: 147, lens_width_mm: 57, bridge_mm: 17, temple_mm: 148, weight_g: 27 }),
  frame(8, 'pilar', 'Pilar', { ...base, colourway: 'Black / Dark Grey', one_liner: 'Geen gedoe, geen kleur. De bril waar de rest op bouwt.', shape: 'slim', fit: 'medium', style: 'clean', wear_to: ['city', 'driving'], tint_hex: '#2B2B30', tint_alpha: 0.65, frame_hex: '#111111', frame_width_mm: 141, lens_width_mm: 52, bridge_mm: 19, temple_mm: 145, weight_g: 24 }),
  frame(9, 'sombra', 'Sombra', { ...base, colourway: 'Black / Black', one_liner: 'Zwart op zwart. Zegt niks, zegt genoeg.', shape: 'slim', fit: 'narrow', style: 'clean', wear_to: ['city', 'festival'], tint_hex: '#141416', tint_alpha: 0.78, frame_hex: '#111111', frame_width_mm: 135, lens_width_mm: 49, bridge_mm: 19, temple_mm: 142, weight_g: 20 }),
  frame(10, 'zefi', 'Zefi', { ...base, shape: 'tinted', fit: 'narrow', style: 'loud', wear_to: ['beach', 'city'], tint_hex: '#C9A27A', tint_alpha: 0.5, frame_hex: '#6B4E37', frame_width_mm: 137, lens_width_mm: 50, bridge_mm: 18, temple_mm: 143, weight_g: 22 })
];

const accessory = (id, handle, title, price) => ({
  id, handle, title, type: 'Accessoire', url: `/products/${handle}`, price, available: true,
  has_only_default_variant: true, description: '', media: [], featured_media: null,
  variants: [{ id: id * 100, title: 'Default Title', price, available: true }],
  get selected_or_first_available_variant() { return this.variants[0]; },
  options: ['Title'], metafields: { carfo: {} }
});

export const cord = accessory(50, 'koord', 'Koord', 495);
export const extraCase = accessory(51, 'extra-etui', 'Extra etui', 495);

export const framesCollection = {
  id: 900, handle: 'zonnebrillen', title: 'Alle tien', url: '/collections/zonnebrillen',
  description: '', products: frames, products_count: frames.length
};

export const allProducts = [...frames, cord, extraCase];
